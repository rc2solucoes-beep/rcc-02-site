// Guarda anti-produção da suíte de integração (RF-OPS-02, T-OPS-U01).
// Falha fechada: qualquer dado ausente ou ambíguo recusa a execução, e isso
// acontece antes de qualquer conexão de rede. As mensagens nunca contêm URL
// nem chaves.
//
// LIMITES (declarados no plano E0a):
//  * A allowlist é configurada pelo operador: reduz, mas não elimina, o risco de
//    apontar para o projeto errado.
//  * Só chaves JWT legadas têm o claim `ref` conferido. Chaves opacas
//    (sb_publishable_/sb_secret_) não são inspecionáveis aqui; a verificação
//    independente humana e o marcador de ambiente (clients.ts) compensam.

export type GuardFailure =
  | "missing_test_url"
  | "missing_test_ref"
  | "missing_allowlist"
  | "missing_production_ref"
  | "invalid_url"
  | "ref_mismatch"
  | "not_allowlisted"
  | "is_production"
  | "key_ref_mismatch"
  | "missing_keys"
  | "missing_marker"
  | "env_conflict"
  | "target_changed";

export type GuardInput = {
  testUrl?: string;
  testProjectRef?: string;
  /** Refs de projetos de teste permitidos, separados por vírgula. */
  allowlist?: string;
  /** Ref do projeto de produção, declarado de forma explícita. */
  productionRef?: string;
  /** URLs que representam produção (por exemplo, NEXT_PUBLIC_SUPABASE_URL). */
  productionUrls?: Array<string | undefined>;
  /** Chaves do ambiente de teste; as que forem JWT têm o claim `ref` conferido. */
  keys?: Array<string | undefined>;
};

export class IntegrationGuardError extends Error {
  constructor(public readonly reason: GuardFailure) {
    super(`Guarda anti-produção: execução recusada (${reason}).`);
    this.name = "IntegrationGuardError";
  }
}

const SUPABASE_HOST = /^([a-z0-9]+)\.supabase\.co$/;

function fail(reason: GuardFailure): never {
  throw new IntegrationGuardError(reason);
}

function refFromUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    const match = SUPABASE_HOST.exec(url.hostname);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function refFromJwt(token: string | undefined): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as {
      ref?: unknown;
    };
    return typeof payload.ref === "string" ? payload.ref : null;
  } catch {
    return null;
  }
}

export function assertSafeTestTarget(input: GuardInput): { projectRef: string } {
  const testUrl = input.testUrl?.trim();
  if (!testUrl) fail("missing_test_url");

  const testRef = input.testProjectRef?.trim();
  if (!testRef) fail("missing_test_ref");

  const allowlist = (input.allowlist ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (allowlist.length === 0) fail("missing_allowlist");

  const productionRef = input.productionRef?.trim();
  if (!productionRef) fail("missing_production_ref");

  const urlRef = refFromUrl(testUrl);
  if (!urlRef) fail("invalid_url");

  const productionRefs = new Set<string>([productionRef]);
  for (const candidate of input.productionUrls ?? []) {
    const ref = refFromUrl(candidate);
    if (ref) productionRefs.add(ref);
  }
  if (productionRefs.has(urlRef) || productionRefs.has(testRef)) fail("is_production");

  if (urlRef !== testRef) fail("ref_mismatch");
  if (!allowlist.includes(testRef)) fail("not_allowlisted");

  for (const key of input.keys ?? []) {
    const keyRef = refFromJwt(key);
    if (keyRef && keyRef !== testRef) fail("key_ref_mismatch");
  }

  return { projectRef: testRef };
}

export function readGuardInputFromEnv(env: NodeJS.ProcessEnv): GuardInput {
  return {
    testUrl: env.RC2_TEST_SUPABASE_URL,
    testProjectRef: env.RC2_TEST_PROJECT_REF,
    allowlist: env.RC2_TEST_PROJECT_REF_ALLOWLIST,
    productionRef: env.RC2_PRODUCTION_PROJECT_REF,
    productionUrls: [env.NEXT_PUBLIC_SUPABASE_URL],
    keys: [env.RC2_TEST_SUPABASE_ANON_KEY, env.RC2_TEST_SUPABASE_SERVICE_ROLE_KEY],
  };
}
