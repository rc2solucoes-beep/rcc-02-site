import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Endpoints internos da newsletter (SDD §8.6 e §8.8), health e alertas. Banco, provedor e auditoria
// são simulados; nenhum e-mail sai e nenhuma rede é usada.

vi.mock("server-only", () => ({}));

type Rpc = { fn: string; args: Record<string, unknown> };
const state = vi.hoisted(() => ({
  rpcCalls: [] as Rpc[],
  claimRows: [] as unknown[],
  throttleAllowed: true,
  provider: null as unknown,
  audit: [] as Array<Record<string, unknown>>,
  counts: { queued: 3, retry: 1, sending: 2, expired: 1, dead: 4 },
  oldest: "2026-10-27T11:50:00.000Z" as string | null,
  dbError: false,
}));

vi.mock("@/lib/admin/auditLog", () => ({ writeAdminAuditLog: async (input: Record<string, unknown>) => { state.audit.push(input); } }));
vi.mock("@/lib/newsletter/provider", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/newsletter/provider")>()),
  createProviderFromEnv: () => state.provider,
}));
vi.mock("@/lib/supabase/server", () => {
  // Construtor de consultas mínimo para as contagens de saúde.
  const builder = (table: string) => {
    const filters: string[] = [];
    const q: Record<string, unknown> = {};
    const self = new Proxy(q, {
      get(_t, prop: string) {
        if (prop === "then") {
          return (resolve: (v: unknown) => void) => {
            if (state.dbError) return resolve({ count: null, data: null, error: { message: "boom" } });
            if (filters.includes("order")) return resolve({ data: state.oldest ? [{ next_attempt_at: state.oldest }] : [], error: null });
            const f = filters.join(",");
            const count = f.includes("lte:lease_until") ? state.counts.expired : f.includes("eq:status:queued") ? state.counts.queued : f.includes("eq:status:retry") ? state.counts.retry : f.includes("gte:updated_at") ? state.counts.dead : state.counts.sending;
            return resolve({ count, error: null });
          };
        }
        return (...args: unknown[]) => {
          filters.push(prop === "eq" || prop === "lte" || prop === "gte" ? `${prop}:${args[0]}:${args[1]}` : prop);
          return self;
        };
      },
    });
    void table;
    return self;
  };
  return {
    createServiceClient: () => ({
      from: builder,
      rpc: async (fn: string, args: Record<string, unknown>) => {
        state.rpcCalls.push({ fn, args });
        if (state.dbError && fn !== "rate_limit_hit") return { data: null, error: { message: "boom" } };
        if (fn === "rate_limit_hit") return { data: [{ allowed: state.throttleAllowed, count: 1, reset_at: "2026-10-27T13:00:00Z" }], error: null };
        if (fn === "newsletter_outbox_expire") return { data: 0, error: null };
        if (fn === "newsletter_outbox_claim") return { data: state.claimRows, error: null };
        return { data: null, error: null };
      },
    }),
  };
});

import { GET as health } from "@/app/api/internal/newsletter/health/route";
import { POST as dispatch } from "@/app/api/internal/newsletter/dispatch/route";
import { raiseAlert, reportDispatchAlerts } from "@/lib/newsletter/alerts";
import { isDispatchAuthorized } from "@/lib/newsletter/internalAuth";
import { emptySummary } from "@/lib/newsletter/processor";
import { ScriptedProvider } from "@/lib/newsletter/provider";

const SECRET = "s".repeat(40);
const url = (path: string) => `https://www.rc2solucoes.com.br/api/internal/newsletter/${path}`;
const post = (auth?: string) => new NextRequest(url("dispatch"), { method: "POST", headers: auth ? { authorization: auth } : {} });
const get = (auth?: string) => new NextRequest(url("health"), { method: "GET", headers: auth ? { authorization: auth } : {} });
const claimCalls = () => state.rpcCalls.filter((c) => c.fn === "newsletter_outbox_claim");

beforeEach(() => {
  state.rpcCalls = [];
  state.claimRows = [];
  state.throttleAllowed = true;
  state.provider = new ScriptedProvider();
  state.audit = [];
  state.dbError = false;
  state.oldest = "2026-10-27T11:50:00.000Z";
  vi.stubEnv("NEWSLETTER_DISPATCH_SECRET", SECRET);
  vi.stubEnv("NEWSLETTER_CONFIRMATION_DISPATCH_ENABLED", "false");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("autenticação por segredo de dispatch", () => {
  it("aceita só o bearer exato; compara em tempo constante (função pura)", () => {
    expect(isDispatchAuthorized(`Bearer ${SECRET}`, { NEWSLETTER_DISPATCH_SECRET: SECRET })).toBe(true);
    for (const header of [null, "", SECRET, `Bearer ${SECRET}x`, `Bearer ${SECRET.slice(1)}`, `bearer ${SECRET}`, "Bearer ", `Basic ${SECRET}`, `Bearer a b`]) {
      expect(isDispatchAuthorized(header, { NEWSLETTER_DISPATCH_SECRET: SECRET }), String(header)).toBe(false);
    }
  });

  it("segredo ausente, vazio ou curto nega TODO acesso, inclusive com 'Bearer ' + o mesmo valor", () => {
    for (const secret of [undefined, "", "   ", "curto", "x".repeat(31)]) {
      expect(isDispatchAuthorized(`Bearer ${secret ?? ""}`, { NEWSLETTER_DISPATCH_SECRET: secret })).toBe(false);
    }
  });

  it("dispatch e health respondem 401 sem corpo e sem tocar na fila quando não autorizados", async () => {
    for (const auth of [undefined, "Bearer errado", `Bearer ${SECRET}x`]) {
      const d = await dispatch(post(auth));
      expect(d.status).toBe(401);
      expect(await d.text()).toBe("");
      const h = await health(get(auth));
      expect(h.status).toBe(401);
      expect(await h.text()).toBe("");
    }
    expect(claimCalls()).toHaveLength(0);
    expect(state.rpcCalls.some((c) => c.fn === "newsletter_outbox_expire")).toBe(false);
  });

  it("sem segredo configurado ambos negam (401), mesmo com um bearer qualquer", async () => {
    vi.stubEnv("NEWSLETTER_DISPATCH_SECRET", "");
    expect((await dispatch(post("Bearer qualquer-coisa-bem-longa-para-passar-no-tamanho"))).status).toBe(401);
    expect((await health(get("Bearer qualquer-coisa-bem-longa-para-passar-no-tamanho"))).status).toBe(401);
  });

  it("acesso negado gera alerta de segurança limitado a 1 por hora e nunca vaza o segredo", async () => {
    await dispatch(post("Bearer tentativa-com-o-segredo-errado-xxxxxxxxxxxxxx"));
    await dispatch(post("Bearer tentativa-com-o-segredo-errado-xxxxxxxxxxxxxx"));
    state.throttleAllowed = false;
    await dispatch(post("Bearer tentativa-com-o-segredo-errado-xxxxxxxxxxxxxx"));
    expect(state.audit.map((a) => a.event)).toEqual(["newsletter_dispatch_unauthorized", "newsletter_dispatch_unauthorized", "newsletter_dispatch_unauthorized_logged"]);
    expect(JSON.stringify(state.audit)).not.toContain("tentativa-com-o-segredo");
    expect(JSON.stringify(state.audit)).not.toContain(SECRET);
  });
});

describe("POST /api/internal/newsletter/dispatch", () => {
  it("sem credencial do provedor responde 503 SEM reivindicar nem expirar nada", async () => {
    state.provider = null;
    const res = await dispatch(post(`Bearer ${SECRET}`));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ status: "not_configured" });
    expect(claimCalls()).toHaveLength(0);
  });

  it("flag de confirmação DESLIGADA: reivindica só unsubscribe_link; resposta com contagens", async () => {
    const res = await dispatch(post(`Bearer ${SECRET}`));
    expect(res.status).toBe(200);
    expect(claimCalls()[0].args.p_kinds).toEqual(["unsubscribe_link"]);
    const body = await res.json();
    expect(body).toMatchObject({ claimed: 0, sent: 0, confirmationPaused: true });
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("flag de confirmação LIGADA: reivindica os dois tipos", async () => {
    vi.stubEnv("NEWSLETTER_CONFIRMATION_DISPATCH_ENABLED", "true");
    const res = await dispatch(post(`Bearer ${SECRET}`));
    expect(res.status).toBe(200);
    expect(claimCalls()[0].args.p_kinds).toEqual(["confirmation", "unsubscribe_link"]);
    expect((await res.json()).confirmationPaused).toBe(false);
  });

  it("não depende da flag de inscrição e ignora o corpo", async () => {
    vi.stubEnv("NEWSLETTER_SIGNUP_ENABLED", "false");
    const res = await dispatch(new NextRequest(url("dispatch"), { method: "POST", headers: { authorization: `Bearer ${SECRET}` }, body: "ignorado" }));
    expect(res.status).toBe(200);
  });

  it("falha do banco → 500 sem detalhes; nada sensível em log", async () => {
    state.dbError = true;
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await dispatch(post(`Bearer ${SECRET}`));
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toMatch(/boom|@|nlt_/);
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain(SECRET);
  });

  it("maxDuration da rota é um literal estático igual a D dos parâmetros do processador", async () => {
    const { readFileSync } = await import("node:fs");
    const { PROCESSOR_PARAMS } = await import("@/lib/newsletter/processor");
    const source = readFileSync("src/app/api/internal/newsletter/dispatch/route.ts", "utf8");
    const match = /^export const maxDuration = (\d+);$/m.exec(source);
    expect(match, "o Next exige literal em exports de configuração de segmento").not.toBeNull();
    expect(Number(match![1])).toBe(PROCESSOR_PARAMS.maxDurationSeconds);
  });

  it("as rotas públicas não disparam o processamento (nenhuma importa o processador)", async () => {
    const { readFileSync } = await import("node:fs");
    for (const route of ["subscribe", "unsubscribe", "unsubscribe-request"]) {
      const source = readFileSync(`src/app/api/newsletter/${route}/route.ts`, "utf8");
      expect(source, route).not.toMatch(/processor|dispatchOnce|after\(/);
    }
  });
});

describe("GET /api/internal/newsletter/health", () => {
  it("devolve só contagens e a idade do item mais antigo; sem PII", async () => {
    const res = await health(get(`Bearer ${SECRET}`));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Object.keys(body).sort()).toEqual(["dead_24h", "oldest_ready_age_seconds", "queued", "retry", "sending", "sending_lease_expired"]);
    expect(body).toMatchObject({ queued: 3, retry: 1, sending: 2, sending_lease_expired: 1, dead_24h: 4 });
    expect(typeof body.oldest_ready_age_seconds).toBe("number");
    expect(JSON.stringify(body)).not.toMatch(/@|nlt_|nl-/);
  });

  it("fila vazia: idade nula; falha do banco: 503", async () => {
    state.oldest = null;
    expect((await (await health(get(`Bearer ${SECRET}`))).json()).oldest_ready_age_seconds).toBeNull();
    state.dbError = true;
    expect((await health(get(`Bearer ${SECRET}`))).status).toBe(503);
  });
});

describe("alertas sem inundação (SDD §8.7)", () => {
  const client = () => ({ rpc: async (fn: string, args: Record<string, unknown>) => { state.rpcCalls.push({ fn, args }); return { data: [{ allowed: state.throttleAllowed, count: 1, reset_at: "x" }], error: null }; } });

  it("o primeiro alerta do tipo na hora usa o evento da whitelist; os seguintes só registram", async () => {
    expect(await raiseAlert(client(), "config", 3, async (i) => { state.audit.push(i as never); })).toBe("alerted");
    state.throttleAllowed = false;
    expect(await raiseAlert(client(), "config", 5, async (i) => { state.audit.push(i as never); })).toBe("logged");
    expect(state.audit.map((a) => [a.event, a.severity])).toEqual([["newsletter_outbox_dead", "error"], ["newsletter_outbox_dead_logged", "info"]]);
    expect(state.rpcCalls.every((c) => String(c.args.p_key).startsWith("nl:alert:") && c.args.p_limit === 1 && c.args.p_window_seconds === 3600)).toBe(true);
  });

  it("alerta por causa: configuração, bug, entrega e cota; superseded NÃO alerta", async () => {
    const summary = emptySummary();
    summary.deadByReason = { permanent_error: 2, invalid_state: 1, superseded: 9 };
    summary.expired = 4;
    summary.quotaHit = true;
    const raised = await reportDispatchAlerts(client(), summary, async (i) => { state.audit.push(i as never); });
    expect(raised).toEqual(["config", "bug", "delivery", "quota"]);
    expect(state.audit.map((a) => (a.metadata as { alert_type: string }).alert_type)).toEqual(["config", "bug", "delivery", "quota"]);
    expect(state.audit.find((a) => (a.metadata as { alert_type: string }).alert_type === "quota")?.event).toBe("newsletter_provider_quota");
    expect(JSON.stringify(state.audit)).not.toMatch(/@|nlt_/);
  });

  it("sem nada a alertar não escreve nada; falha do throttle registra sem e-mail", async () => {
    expect(await reportDispatchAlerts(client(), emptySummary(), async (i) => { state.audit.push(i as never); })).toEqual([]);
    expect(state.audit).toHaveLength(0);
    const broken = { rpc: async () => ({ data: null, error: { message: "x" } }) };
    expect(await raiseAlert(broken, "bug", 1, async (i) => { state.audit.push(i as never); })).toBe("logged");
  });

  it("os eventos de alerta estão na whitelist do auditLog", async () => {
    const { readFileSync } = await import("node:fs");
    const source = readFileSync("src/lib/admin/auditLog.ts", "utf8");
    for (const event of ["newsletter_outbox_dead", "newsletter_provider_quota", "newsletter_dispatch_unauthorized"]) expect(source).toContain(`"${event}"`);
  });
});
