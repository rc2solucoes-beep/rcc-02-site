// Verificação do Cloudflare Turnstile (RF-SEG-03). Usada pelo contato e, depois, pela newsletter.
//
// Decide pelo ambiente da Vercel (VERCEL_ENV), não só por NODE_ENV: builds de preview
// também têm NODE_ENV=production. O bypass existe apenas para desenvolvimento local.
// Nenhuma mensagem de log contém token ou segredo.
//
// BL-06: antes do deploy, confirmar que TURNSTILE_SECRET_KEY e NEXT_PUBLIC_TURNSTILE_SITE_KEY
// existem e são válidos em Production E Preview; sem isso o formulário deixa de funcionar.

export const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
export const TURNSTILE_TIMEOUT_MS = 5000;

export type TurnstileFailure =
  | "misconfigured" // segredo ausente/placeholder fora do desenvolvimento local
  | "missing_token"
  | "rejected" // o Cloudflare respondeu success=false
  | "unavailable"; // erro de rede, HTTP inválido, resposta malformada ou timeout

export type TurnstileResult = { ok: true; bypassed: boolean } | { ok: false; reason: TurnstileFailure };

export type TurnstileOptions = {
  /** Origem do IP do cliente; omitido quando não há IP confiável. */
  ip?: string | null;
  /** Injeção para testes. */
  fetchImpl?: typeof fetch;
  /** Injeção para testes; o padrão é process.env. */
  env?: { VERCEL_ENV?: string; NODE_ENV?: string; TURNSTILE_SECRET_KEY?: string };
};

function hasRealSecret(secret: string | undefined): secret is string {
  const value = secret?.trim();
  return Boolean(value) && value !== "xxxx";
}

/** Desenvolvimento local: fora da Vercel (ou `vercel dev`) e sem build de produção. */
function isLocalDevelopment(env: NonNullable<TurnstileOptions["env"]>): boolean {
  const vercelEnv = env.VERCEL_ENV;
  const notDeployed = vercelEnv === undefined || vercelEnv === "" || vercelEnv === "development";
  return notDeployed && env.NODE_ENV !== "production";
}

export async function verifyTurnstile(
  token: string | null | undefined,
  options: TurnstileOptions = {},
): Promise<TurnstileResult> {
  const env = options.env ?? process.env;
  const secret = env.TURNSTILE_SECRET_KEY;

  if (!hasRealSecret(secret)) {
    if (isLocalDevelopment(env)) return { ok: true, bypassed: true };
    console.error("[turnstile] turnstile_misconfigured");
    return { ok: false, reason: "misconfigured" };
  }

  if (!token || !token.trim()) return { ok: false, reason: "missing_token" };

  const fetchImpl = options.fetchImpl ?? fetch;
  const payload: Record<string, string> = { secret, response: token };
  if (options.ip) payload.remoteip = options.ip;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TURNSTILE_TIMEOUT_MS);
  try {
    const res = await fetchImpl(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) return { ok: false, reason: "unavailable" };
    const data = (await res.json()) as { success?: unknown };
    return data.success === true ? { ok: true, bypassed: false } : { ok: false, reason: "rejected" };
  } catch {
    return { ok: false, reason: "unavailable" };
  } finally {
    clearTimeout(timer);
  }
}
