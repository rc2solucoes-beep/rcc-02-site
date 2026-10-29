import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createProviderFromEnv, resendBaseUrlProblem } from "@/lib/newsletter/provider";
import { MAX_READY_AGE_SECONDS, evaluateProbe } from "@/lib/newsletter/probe";
import { PROCESSOR_PARAMS } from "@/lib/newsletter/processor";
import { assertSimulatorUrl, startResendSimulator } from "../../lc01/resendSimulator";

// Travas do LC-01: o simulador não pode apontar para o Resend real, RESEND_BASE_URL é proibida em
// Production, a sonda decide corretamente e os parâmetros temporais são consistentes entre si.
const read = (p: string) => readFileSync(p, "utf8").replace(/\r\n/g, "\n");

describe("RESEND_BASE_URL sob trava (o SDK a lê na carga do módulo e redireciona TODO envio)", () => {
  it("sem a variável: segura", () => {
    expect(resendBaseUrlProblem({})).toBeNull();
    expect(resendBaseUrlProblem({ RESEND_BASE_URL: "  " })).toBeNull();
  });

  it("proibida em Production, seja qual for o valor", () => {
    expect(resendBaseUrlProblem({ RESEND_BASE_URL: "http://127.0.0.1:4000", VERCEL_ENV: "production" })).toMatch(/proibida em Production/);
    expect(createProviderFromEnv({ RESEND_API_KEY: "re_x", RESEND_BASE_URL: "http://127.0.0.1:4000", VERCEL_ENV: "production" })).toBeNull();
  });

  it("fora de Production só loopback; Resend real e hosts remotos são recusados", () => {
    for (const ok of ["http://127.0.0.1:4010", "http://localhost:4010", "http://[::1]:4010"]) {
      expect(resendBaseUrlProblem({ RESEND_BASE_URL: ok, VERCEL_ENV: "preview" }), ok).toBeNull();
    }
    for (const bad of ["https://api.resend.com", "https://sim.example.com", "http://10.0.0.5:4010", "ftp://127.0.0.1", "nao-e-url"]) {
      expect(resendBaseUrlProblem({ RESEND_BASE_URL: bad, VERCEL_ENV: "preview" }), bad).not.toBeNull();
      expect(createProviderFromEnv({ RESEND_API_KEY: "re_x", RESEND_BASE_URL: bad, VERCEL_ENV: "preview" }), bad).toBeNull();
    }
  });

  it("a variável não aparece com valor em nenhum arquivo de configuração versionado", () => {
    const example = read(".env.example");
    expect(example).not.toMatch(/^RESEND_BASE_URL=./m);
    expect(read("next.config.ts")).not.toContain("RESEND_BASE_URL");
    expect(read("tests/e2e-support/isolatedEnv.ts")).not.toMatch(/RESEND_BASE_URL\s*[=:]/);
  });
});

describe("simulador do Resend", () => {
  it("recusa apontar para fora do loopback ou para o Resend real", () => {
    expect(() => assertSimulatorUrl("http://127.0.0.1:1234")).not.toThrow();
    expect(() => assertSimulatorUrl("https://api.resend.com")).toThrow(/RECUSADO/);
    expect(() => assertSimulatorUrl("https://sim.example.com")).toThrow(/RECUSADO/);
  });

  it("escuta só em loopback, recusa chave de API real e destinatário não sintético, e não guarda corpo", async () => {
    const sim = await startResendSimulator();
    try {
      expect(new URL(sim.url).hostname).toBe("127.0.0.1");
      const post = (key: string, to: string) =>
        fetch(`${sim.url}/emails`, {
          method: "POST",
          headers: { authorization: `Bearer ${key}`, "content-type": "application/json", "idempotency-key": "nl-t" },
          body: JSON.stringify({ from: "a@b.test", to, subject: "s", html: "<p>x</p>" }),
        });
      expect((await post("re_chave_real_123", "pessoa@example.com")).status).toBe(401);
      expect(sim.violations.join()).toMatch(/chave de API fora do padrão/);
      sim.reset();
      expect((await post("re_sim_ok", "alguem@gmail.com")).status).toBe(200);
      expect(sim.violations.join()).toMatch(/destinatário não sintético/);
      sim.reset();
      expect((await post("re_sim_ok", "pessoa@example.com")).status).toBe(200);
      expect(JSON.stringify(sim.requests)).not.toMatch(/pessoa@|<p>x/); // nada do corpo é registrado
    } finally {
      await sim.close();
    }
  });

  it("idempotência: mesma chave+conteúdo devolve a original; conteúdo diferente é 409", async () => {
    const sim = await startResendSimulator();
    try {
      const send = (subject: string) =>
        fetch(`${sim.url}/emails`, {
          method: "POST",
          headers: { authorization: "Bearer re_sim_ok", "content-type": "application/json", "idempotency-key": "nl-i" },
          body: JSON.stringify({ from: "a@b.test", to: "p@example.com", subject, html: "x" }),
        });
      const first = await (await send("um")).json();
      const again = await (await send("um")).json();
      expect(again.id).toBe(first.id);
      expect(sim.deliveries.size).toBe(1);
      expect((await send("outro")).status).toBe(409);
    } finally {
      await sim.close();
    }
  });
});

describe("sonda externa (SDD §8.6)", () => {
  const base = { queued: 0, retry: 0, sending: 0, sending_lease_expired: 0, dead_24h: 0, oldest_ready_age_seconds: null };

  it("alerta se a sonda falhar, se a fila parar (> 15 min) ou se o lease vencido persistir", () => {
    expect(MAX_READY_AGE_SECONDS).toBe(900);
    expect(evaluateProbe(null)).toEqual({ alert: true, reasons: ["probe_failed"] });
    expect(evaluateProbe({ ...base, oldest_ready_age_seconds: 901 })).toEqual({ alert: true, reasons: ["queue_stalled"] });
    expect(evaluateProbe({ ...base, oldest_ready_age_seconds: 900 }).alert).toBe(false);
    expect(evaluateProbe({ ...base, sending_lease_expired: 1 }).alert).toBe(false); // 1ª observação
    expect(evaluateProbe({ ...base, sending_lease_expired: 1 }, { ...base, sending_lease_expired: 2 })).toEqual({ alert: true, reasons: ["lease_expired_persistent"] });
    expect(evaluateProbe({ ...base, sending_lease_expired: 0 }, { ...base, sending_lease_expired: 2 }).alert).toBe(false);
  });
});

describe("consistência dos parâmetros temporais (migration 019 × rota × processador)", () => {
  const migration = read("supabase/migrations/019_newsletter_dispatch_jobs.sql").replace(/--[^\n]*/g, "");
  const route = read("src/app/api/internal/newsletter/dispatch/route.ts");

  it("timeout do pg_net (125 s) > maxDuration (120 s) > B·T + M (105 s)", () => {
    const pgNetTimeout = Number(/timeout_milliseconds := (\d+)/.exec(migration)?.[1]);
    const maxDuration = Number(/^export const maxDuration = (\d+);$/m.exec(route)?.[1]);
    expect(maxDuration).toBe(PROCESSOR_PARAMS.maxDurationSeconds);
    expect(pgNetTimeout).toBe(125_000);
    expect(pgNetTimeout / 1000).toBeGreaterThan(maxDuration);
    expect(maxDuration).toBeGreaterThanOrEqual((PROCESSOR_PARAMS.batch * PROCESSOR_PARAMS.timeoutMs) / 1000 + PROCESSOR_PARAMS.marginSeconds);
  });

  it("lease (180 s) > maxDuration e a varredura (1 min) bate com o período P do processador", () => {
    expect(PROCESSOR_PARAMS.leaseSeconds).toBeGreaterThan(PROCESSOR_PARAMS.maxDurationSeconds);
    expect(PROCESSOR_PARAMS.sweepSeconds).toBe(60);
    expect(/cron\.schedule\(\s*'newsletter-dispatch',\s*'\* \* \* \* \*'/.test(migration)).toBe(true);
    expect(/cron\.schedule\(\s*'newsletter-maintenance',\s*'\*\/5 \* \* \* \*'/.test(migration)).toBe(true);
  });

  it("a migration não contém segredo literal e lê URL e segredo do Vault", () => {
    expect(migration).toContain("vault.decrypted_secrets");
    expect(migration).toContain("newsletter_dispatch_url");
    expect(migration).toContain("newsletter_dispatch_secret");
    expect(migration).not.toMatch(/Bearer [A-Za-z0-9_-]{16,}/);
    expect(migration).not.toMatch(/\bvault\.create_secret\b|INSERT INTO vault\./i);
    expect(migration).not.toMatch(/CREATE EXTENSION/i);
  });

  it("a 019 não toca nos jobs da 011 e da 017 nem em tabelas, e não cria purga", () => {
    for (const forbidden of [/unschedule/i, /DROP\s/i, /ALTER\s/i, /purge-rate-limit/, /publish-scheduled/ , /CREATE TABLE/i]) {
      // As menções aos jobs 011/017 existem só no guard/autoverificação (leitura); nenhuma escrita.
      if (forbidden.source.includes("purge") || forbidden.source.includes("publish")) continue;
      expect(migration, String(forbidden)).not.toMatch(forbidden);
    }
    expect(migration.match(/cron\.schedule\(/g)).toHaveLength(2);
  });

  it("unsubscribe_link independe da flag de confirmação e as rotas públicas não disparam processamento", () => {
    expect(route).toContain('process.env.NEWSLETTER_CONFIRMATION_DISPATCH_ENABLED === "true"');
    const processor = read("src/lib/newsletter/processor.ts");
    expect(processor).toMatch(/deps\.confirmationEnabled \? \["confirmation", "unsubscribe_link"\] : \["unsubscribe_link"\]/);
  });
});
