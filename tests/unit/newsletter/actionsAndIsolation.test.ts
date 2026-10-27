import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Server Actions das páginas de token e isolamento de rastreadores (T-NL-U11, U14, U22; DEC-27).

type Rpc = { fn: string; args: Record<string, unknown> };
const state = vi.hoisted(() => ({
  calls: [] as Rpc[],
  rateAllowed: true,
  results: {} as Record<string, unknown>,
  rpcError: {} as Record<string, boolean>,
}));

vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-real-ip": "203.0.113.9" }) }));
vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: () => ({
    rpc: async (fn: string, args: Record<string, unknown>) => {
      state.calls.push({ fn, args });
      if (fn === "rate_limit_hit") return { data: [{ allowed: state.rateAllowed, count: 1, reset_at: "2026-10-27T14:00:00Z" }], error: null };
      if (state.rpcError[fn]) return { data: null, error: { message: "boom" } };
      return { data: state.results[fn] ?? null, error: null };
    },
  }),
}));

import { confirmSubscriptionAction, unsubscribeAction } from "@/app/(newsletter)/newsletter/actions";
import { generateToken, hashToken } from "@/lib/newsletter/tokens";

const rate = () => state.calls.filter((c) => c.fn === "rate_limit_hit");
const nl = () => state.calls.filter((c) => c.fn.startsWith("newsletter_"));
let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  state.calls = [];
  state.rateAllowed = true;
  state.results = {};
  state.rpcError = {};
  vi.stubEnv("RATE_LIMIT_PEPPER", "p".repeat(40));
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("confirmSubscriptionAction", () => {
  const token = generateToken();

  it("confirma por hash, sem enviar versão de consentimento nem o token bruto; IP só como hash", async () => {
    state.results = { newsletter_confirm: "confirmed" };
    expect(await confirmSubscriptionAction(token)).toEqual({ status: "confirmed" });
    const [call] = nl();
    expect(call.fn).toBe("newsletter_confirm");
    expect(Object.keys(call.args).sort()).toEqual(["p_ip_hash", "p_token_hash"]);
    expect(call.args.p_token_hash).toBe(hashToken(token));
    expect(JSON.stringify(call.args)).not.toContain(token);
    expect(JSON.stringify(call.args)).not.toContain("203.0.113.9");
    expect(rate()).toHaveLength(0); // token encontrado nunca conta
  });

  it("token inexistente/consumido → invalid e conta em nl:tok:ip; estourado → rate_limited", async () => {
    state.results = { newsletter_confirm: "invalid" };
    expect(await confirmSubscriptionAction(token)).toEqual({ status: "invalid" });
    expect(String(rate()[0].args.p_key)).toMatch(/^nl:tok:ip:/);
    state.rateAllowed = false;
    expect(await confirmSubscriptionAction(token)).toEqual({ status: "rate_limited" });
  });

  it("token malformado não chega às RPCs da newsletter, mas conta", async () => {
    expect(await confirmSubscriptionAction("nlt_curto")).toEqual({ status: "invalid" });
    expect(nl()).toHaveLength(0);
    expect(rate()).toHaveLength(1);
  });

  it("falha do banco → error genérico; nada sensível em log", async () => {
    state.rpcError = { newsletter_confirm: true };
    expect(await confirmSubscriptionAction(token)).toEqual({ status: "error" });
    const logged = JSON.stringify(errorSpy.mock.calls);
    expect(logged).not.toContain(token);
    expect(logged).not.toContain(hashToken(token));
    expect(logged).not.toContain("boom");
  });
});

describe("unsubscribeAction", () => {
  const token = generateToken();

  it("idempotente: unsubscribed e already_unsubscribed; token encontrado nunca é limitado por IP", async () => {
    state.rateAllowed = false;
    state.results = { newsletter_unsubscribe: "unsubscribed" };
    expect(await unsubscribeAction(token)).toEqual({ status: "unsubscribed" });
    state.results = { newsletter_unsubscribe: "already_unsubscribed" };
    expect(await unsubscribeAction(token)).toEqual({ status: "already_unsubscribed" });
    expect(nl()[0].args).toEqual({ p_token_hash: hashToken(token), p_channel: "link" });
    expect(rate()).toHaveLength(0);
  });

  it("não encontrado → invalid (sem afirmar descadastro) e conta; falha do banco → error", async () => {
    state.results = { newsletter_unsubscribe: "not_found" };
    expect(await unsubscribeAction(token)).toEqual({ status: "invalid" });
    expect(rate()).toHaveLength(1);
    state.rpcError = { newsletter_unsubscribe: true };
    expect(await unsubscribeAction(token)).toEqual({ status: "error" });
  });
});

// ─── Isolamento de rastreadores (DEC-27 / PRP-10, opção O5) ──────────────────
const root = process.cwd();
const read = (p: string) => readFileSync(resolve(root, p), "utf8");
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const full = join(dir, n);
    return statSync(full).isDirectory() ? files(full) : [full];
  });
}
const FORBIDDEN =
  /TrackingScripts|DelayedGtm|PageViewTracker|ConsentManager|getConsentBootstrapScript|googletagmanager|google-analytics|gtag|dataLayer|connect\.facebook|fbq|ahrefs|doubleclick|@\/lib\/tracking|@\/lib\/consent/;

describe("T-NL-U22 — páginas de token sem rastreadores por estrutura", () => {
  const tokenFiles = [
    ...files(resolve(root, "src/app/(newsletter)")),
    ...files(resolve(root, "src/components/newsletter")),
  ].filter((f) => /\.tsx?$/.test(f));

  it("layout, páginas, actions e componentes do grupo (newsletter) não importam nem citam rastreadores", () => {
    expect(tokenFiles.length).toBeGreaterThanOrEqual(5);
    for (const file of tokenFiles) {
      // Comentários explicam a proibição e podem citar os nomes.
      const code = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
      expect(code, file).not.toMatch(FORBIDDEN);
    }
  });

  it("o layout raiz não carrega rastreadores nem Header/Footer; só os layouts que podem os montam", () => {
    const rootLayout = read("src/app/layout.tsx");
    expect(rootLayout).not.toMatch(/TrackingScripts|DelayedGtm|PageViewTracker|getConsentBootstrapScript|ConsentManager/);
    expect(read("src/app/(public)/layout.tsx")).toContain("<TrackingScripts />");
    expect(read("src/app/not-found.tsx")).toContain("<TrackingScripts />");
    expect(read("src/app/(newsletter)/layout.tsx").replace(/\/\/[^\n]*/g, "")).not.toContain("TrackingScripts");
  });

  it("TrackingScripts mantém o bootstrap de consentimento ANTES do carregador do GTM", () => {
    const source = read("src/components/tracking/TrackingScripts.tsx");
    expect(source.indexOf("getConsentBootstrapScript()")).toBeGreaterThan(-1);
    expect(source.indexOf("<DelayedGtm")).toBeGreaterThan(source.indexOf("getConsentBootstrapScript()"));
    expect(source).toContain("<PageViewTracker />");
  });

  it("páginas de token: noindex, referrer no-referrer, sem canonical; Turnstile só no formulário do ramo sem token", () => {
    for (const page of ["confirmar", "descadastro"]) {
      const source = read(`src/app/(newsletter)/newsletter/${page}/page.tsx`);
      expect(source).toMatch(/robots: \{ index: false, follow: false \}/);
      expect(source).toMatch(/referrer: "no-referrer"/);
      expect(source).not.toMatch(/Turnstile/);
    }
    expect(read("src/components/newsletter/TokenActionPanel.tsx")).not.toMatch(/Turnstile/);
    expect(read("src/components/newsletter/UnsubscribeRequestForm.tsx")).toMatch(/@marsidev\/react-turnstile/);
  });

  it("o painel remove o fragmento da URL e só chama a action no clique (GET não muta)", () => {
    const panel = read("src/components/newsletter/TokenActionPanel.tsx");
    expect(panel).toContain("history.replaceState");
    expect(panel).toMatch(/onClick=\{submit\}/);
    expect(panel).not.toMatch(/useEffect[\s\S]{0,200}(confirmSubscriptionAction|unsubscribeAction)\(/);
  });

  it("next.config: páginas e API da newsletter sem cache e sem Referer, DEPOIS da regra global", () => {
    const config = read("next.config.ts");
    const global = config.indexOf('source: "/(.*)"');
    const pages = config.indexOf('source: "/newsletter/:path*"');
    const api = config.indexOf('source: "/api/newsletter/:path*"');
    expect(global).toBeGreaterThan(-1);
    expect(pages).toBeGreaterThan(global);
    expect(api).toBeGreaterThan(global);
    const block = config.slice(pages, config.indexOf("images:", pages));
    expect(block).toMatch(/"Cache-Control", value: "no-store"/);
    expect(block.match(/"Referrer-Policy", value: "no-referrer"/g)).toHaveLength(2);
  });
});
