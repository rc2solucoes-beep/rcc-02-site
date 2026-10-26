import { randomUUID } from "node:crypto";
import type { VerifiedTarget } from "../integration/support/target";

// Ambiente do servidor Next.js iniciado pelo Playwright isolado (EX-4).
//
// O Next lê `.env.local` (que pode conter credenciais de PRODUÇÃO) para toda variável que o
// processo ainda não definiu. Por isso o lançador define EXPLICITAMENTE cada variável que o
// aplicativo lê, com valores do alvo isolado ou neutros: o que já está definido no ambiente do
// processo nunca é sobrescrito pelos arquivos `.env*`. Um teste unitário garante que toda
// variável lida em `src/` esteja coberta aqui.

export const E2E_PORT = 3100;
export const E2E_BASE_URL = `http://localhost:${E2E_PORT}`;
export const NEUTRAL = "e2e-isolated-disabled";

/** Variáveis que o aplicativo lê e que recebem valor neutro (sem serviço externo real). */
export const NEUTRALIZED_ENV_NAMES = [
  "ADMIN_BOOTSTRAP_TOKEN",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
  "GOOGLE_PLACES_API_KEY",
  "GOOGLE_PLACE_ID",
  "LEAD_NOTIFICATION_EMAIL",
  "LEADS_DELETE_ENABLED", // valor neutro ≠ "true": a exclusão definitiva fica suspensa no E2E
  "NEXT_PUBLIC_GTM_ID",
  "NEXT_PUBLIC_SENTRY_DSN",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "NEXT_PUBLIC_WHATSAPP_NUMBER",
  "RESEND_API_KEY",
  "SECURITY_ALERT_EMAIL",
  "SENTRY_DSN",
  "TURNSTILE_SECRET_KEY",
] as const;

/** Variáveis do aplicativo que recebem valor sintético próprio. */
export const SYNTHETIC_ENV_NAMES = [
  "AUDIT_LOG_SALT",
  "IP_SALT",
  "NEXT_PUBLIC_SITE_URL",
  "RATE_LIMIT_PEPPER", // >= 32 caracteres: abaixo disso a rota de contato fecha (E0c)
  "TRUST_CLOUDFLARE_PROXY", // "false": cf-connecting-ip nunca é confiável no E2E
] as const;

/** Variáveis do Supabase, sempre vindas do alvo verificado. */
export const SUPABASE_ENV_NAMES = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"] as const;

/** Variáveis ambientais lidas pelo aplicativo que não são configuração de serviço. */
export const AMBIENT_ENV_NAMES = ["NODE_ENV", "VERCEL_ENV", "VERCEL_URL"] as const;

export function buildIsolatedServerEnv(target: Pick<VerifiedTarget, "url" | "anonKey" | "serviceKey">): Record<string, string> {
  const env: Record<string, string> = {};
  for (const name of NEUTRALIZED_ENV_NAMES) env[name] = NEUTRAL;
  env.AUDIT_LOG_SALT = `e2e-${randomUUID()}`;
  env.IP_SALT = `e2e-${randomUUID()}`;
  env.NEXT_PUBLIC_SITE_URL = E2E_BASE_URL;
  env.RATE_LIMIT_PEPPER = `e2e-${randomUUID()}`;
  env.TRUST_CLOUDFLARE_PROXY = "false";
  env.NEXT_PUBLIC_SUPABASE_URL = target.url;
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY = target.anonKey;
  env.SUPABASE_SERVICE_ROLE_KEY = target.serviceKey;
  return env;
}

/** Host do único Supabase permitido no navegador (contém o ref: nunca vai para logs). */
export function allowedSupabaseHost(target: Pick<VerifiedTarget, "url">): string {
  return new URL(target.url).host.toLowerCase();
}
