// Rate limit atômico do contato (RF-SEG-05, DEC-12), independente da tabela `leads`.
//
// Cada tentativa chama `rate_limit_hit` (migration 017), que incrementa o contador da janela
// com INSERT … ON CONFLICT DO UPDATE. As chaves são HMAC-SHA256 do valor normalizado com
// RATE_LIMIT_PEPPER: dado pessoal pseudonimizado, retido por até 2 dias.
//
// FALHA FECHADA: pepper ausente/curto, erro do banco ou resposta inesperada lançam; a rota
// responde 429. Nenhum valor de e-mail, IP, chave ou pepper entra em mensagem de erro ou log.

import { createHmac } from "node:crypto";

export const CONTACT_RATE_LIMIT = 3;
export const CONTACT_RATE_WINDOW_SECONDS = 60 * 60;
export const MIN_PEPPER_LENGTH = 32;

/** Configuração crítica ausente ou inválida (RATE_LIMIT_PEPPER). */
export class RateLimitConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitConfigError";
  }
}

/** Falha ao consultar ou interpretar o contador no banco. */
export class RateLimitStoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitStoreError";
  }
}

export type RateLimitDecision = { allowed: boolean; count: number; resetAt: string };

/** O mínimo do cliente Supabase que o limitador usa; permite simular o banco nos testes. */
export type RateLimitClient = {
  rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: unknown }>;
};

export function getRateLimitPepper(env: Record<string, string | undefined> = process.env): string {
  const pepper = env.RATE_LIMIT_PEPPER?.trim();
  if (!pepper || pepper.length < MIN_PEPPER_LENGTH) {
    throw new RateLimitConfigError("RATE_LIMIT_PEPPER ausente ou curto demais");
  }
  return pepper;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function contactRateLimitKey(scope: "email" | "ip", value: string, pepper: string): string {
  const normalized = scope === "email" ? normalizeEmail(value) : value.trim();
  const digest = createHmac("sha256", pepper).update(normalized).digest("hex");
  return `contact:${scope}:${digest}`;
}

function parseDecision(data: unknown): RateLimitDecision {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object") throw new RateLimitStoreError("resposta vazia do rate_limit_hit");
  const { allowed, count, reset_at: resetAt } = row as Record<string, unknown>;
  if (typeof allowed !== "boolean" || typeof count !== "number" || !Number.isInteger(count) || typeof resetAt !== "string") {
    throw new RateLimitStoreError("resposta inesperada do rate_limit_hit");
  }
  return { allowed, count, resetAt };
}

export async function rateLimitHit(
  client: RateLimitClient,
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitDecision> {
  let result: { data: unknown; error: unknown };
  try {
    result = await client.rpc("rate_limit_hit", { p_key: key, p_limit: limit, p_window_seconds: windowSeconds });
  } catch {
    throw new RateLimitStoreError("falha de rede ao chamar rate_limit_hit");
  }
  if (result.error) throw new RateLimitStoreError("erro do banco em rate_limit_hit");
  return parseDecision(result.data);
}

export type ContactRateLimitInput = {
  email: string;
  /** IP já validado por getClientIp; nulo quando não há IP confiável. */
  ip: string | null;
};

/**
 * Registra a tentativa nos contadores aplicáveis (e-mail sempre; IP quando confiável) e devolve
 * `allowed = false` se QUALQUER um estourou. Os contadores aplicáveis são incrementados mesmo
 * quando o outro já estourou: tentativas rejeitadas também contam.
 */
export async function checkContactRateLimit(
  client: RateLimitClient,
  input: ContactRateLimitInput,
  env: Record<string, string | undefined> = process.env,
): Promise<{ allowed: boolean; decisions: RateLimitDecision[] }> {
  const pepper = getRateLimitPepper(env);
  const keys = [contactRateLimitKey("email", input.email, pepper)];
  if (input.ip) keys.push(contactRateLimitKey("ip", input.ip, pepper));

  const decisions = await Promise.all(
    keys.map((key) => rateLimitHit(client, key, CONTACT_RATE_LIMIT, CONTACT_RATE_WINDOW_SECONDS)),
  );
  return { allowed: decisions.every((decision) => decision.allowed), decisions };
}
