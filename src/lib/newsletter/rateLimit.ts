// Rate limit da newsletter sobre o contador atômico da E0c (SDD Newsletter §5.2, PRP-02).
//
// Reutiliza `rate_limit_hit` e o pepper do contato. As chaves são HMAC do valor normalizado:
// dado pessoal pseudonimizado, retido por até 2 dias. FALHA FECHADA: erro de configuração ou de
// banco lança (a rota decide 429 na inscrição/pedido e 503 no descadastro por token).
// `nl:global` (derivado da cota diária do Resend, PV-22) fica fora até o dimensionamento.

import { createHmac } from "node:crypto";
import {
  getRateLimitPepper,
  normalizeEmail,
  rateLimitHit,
  type RateLimitClient,
  type RateLimitDecision,
} from "@/lib/security/rateLimit";

export type NewsletterBucket = "nl:sub:ip" | "nl:sub:email" | "nl:unreq:ip" | "nl:unreq:email" | "nl:tok:ip";

const HOUR = 60 * 60;
const DAY = 24 * HOUR;

/** Valores iniciais e provisórios (PRP-02); calibrar após medir. */
export const NEWSLETTER_BUCKETS: Record<NewsletterBucket, { limit: number; windowSeconds: number }> = {
  "nl:sub:ip": { limit: 5, windowSeconds: HOUR },
  "nl:sub:email": { limit: 3, windowSeconds: DAY },
  "nl:unreq:ip": { limit: 5, windowSeconds: HOUR },
  "nl:unreq:email": { limit: 3, windowSeconds: DAY },
  "nl:tok:ip": { limit: 30, windowSeconds: HOUR },
};

export function newsletterRateLimitKey(bucket: NewsletterBucket, value: string, pepper: string): string {
  const normalized = bucket.endsWith(":email") ? normalizeEmail(value) : value.trim();
  const digest = createHmac("sha256", pepper).update(normalized).digest("hex");
  return `${bucket}:${digest}`;
}

export type NewsletterRateLimitInput = {
  email: string;
  /** IP já validado por getClientIp; nulo quando não há IP confiável (o bucket de IP é ignorado). */
  ip: string | null;
};

/**
 * Inscrição ou pedido de novo link de descadastro. Todos os buckets aplicáveis são incrementados
 * mesmo quando outro já estourou: tentativas rejeitadas também contam.
 */
export async function checkNewsletterRateLimit(
  client: RateLimitClient,
  scope: "subscribe" | "unsubscribe_request",
  input: NewsletterRateLimitInput,
  env: Record<string, string | undefined> = process.env,
): Promise<{ allowed: boolean; decisions: RateLimitDecision[] }> {
  const pepper = getRateLimitPepper(env);
  const buckets: Array<[NewsletterBucket, string]> =
    scope === "subscribe"
      ? [["nl:sub:email", input.email]]
      : [["nl:unreq:email", input.email]];
  if (input.ip) buckets.push([scope === "subscribe" ? "nl:sub:ip" : "nl:unreq:ip", input.ip]);

  const decisions = await Promise.all(
    buckets.map(([bucket, value]) => {
      const { limit, windowSeconds } = NEWSLETTER_BUCKETS[bucket];
      return rateLimitHit(client, newsletterRateLimitKey(bucket, value, pepper), limit, windowSeconds);
    }),
  );
  return { allowed: decisions.every((decision) => decision.allowed), decisions };
}

/**
 * Conta UMA tentativa com token malformado ou não encontrado (confirmar, descadastrar, one-click).
 * Token encontrado NUNCA chama esta função: não é limitado por IP (§5.2). Sem IP confiável não
 * há o que contar e a tentativa é permitida.
 */
export async function recordInvalidTokenAttempt(
  client: RateLimitClient,
  ip: string | null,
  env: Record<string, string | undefined> = process.env,
): Promise<RateLimitDecision | null> {
  if (!ip) return null;
  const pepper = getRateLimitPepper(env);
  const { limit, windowSeconds } = NEWSLETTER_BUCKETS["nl:tok:ip"];
  return rateLimitHit(client, newsletterRateLimitKey("nl:tok:ip", ip, pepper), limit, windowSeconds);
}
