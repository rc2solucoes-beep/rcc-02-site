import { IntegrationGuardError } from "./guard";

// Erros vindos do Supabase, da rede ou de bibliotecas são conteúdo EXTERNO e
// não confiável: a mensagem pode carregar URLs com parâmetros, cabeçalhos de
// autenticação, tokens ou chaves. Nada disso é copiado para logs, relatórios ou
// exceções finais. O diagnóstico usa só categorias e códigos CONTROLADOS: nome da
// classe (lista fechada), código SQLSTATE/PostgREST/de sistema ou de autenticação
// conhecido, e status HTTP numérico. O que não casa vira "nao_classificado".

const KNOWN_NAMES = new Set([
  "Error",
  "TypeError",
  "RangeError",
  "AbortError",
  "AggregateError",
  "AuthApiError",
  "AuthRetryableFetchError",
  "AuthUnknownError",
  "AuthSessionMissingError",
  "PostgrestError",
  "FunctionsHttpError",
  "FunctionsFetchError",
]);

const KNOWN_AUTH_CODES = new Set([
  "user_already_exists",
  "email_exists",
  "user_not_found",
  "invalid_credentials",
  "validation_failed",
  "over_request_rate_limit",
  "bad_jwt",
  "not_admin",
  "no_authorization",
  "unexpected_failure",
  "request_timeout",
]);

export function safeCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (/^[0-9A-Z]{5}$/.test(value)) return value; // SQLSTATE
  if (/^PGRST\d{3}$/.test(value)) return value; // PostgREST
  if (/^E[A-Z0-9_]{2,20}$/.test(value)) return value; // sistema (ECONNREFUSED...)
  if (KNOWN_AUTH_CODES.has(value)) return value;
  return null;
}

function field(source: unknown, key: string): unknown {
  return source !== null && typeof source === "object" ? (source as Record<string, unknown>)[key] : undefined;
}

/**
 * Descreve um erro (lançado ou devolvido pela API) sem reproduzir conteúdo
 * externo. Motivos de IntegrationGuardError são preservados (lista fechada).
 */
export function describeError(thrown: unknown): string {
  if (thrown instanceof IntegrationGuardError) return `guarda:${thrown.reason}`;
  if (thrown === null || typeof thrown !== "object") return "excecao:nao_classificado";

  const rawName = field(thrown, "name");
  const name = typeof rawName === "string" && KNOWN_NAMES.has(rawName) ? rawName : "nao_classificado";
  const code = safeCode(field(thrown, "code")) ?? safeCode(field(field(thrown, "cause"), "code"));
  const status = field(thrown, "status");

  let text = `excecao:${name}`;
  if (code) text += `;codigo=${code}`;
  if (typeof status === "number" && Number.isInteger(status) && status >= 100 && status <= 599) {
    text += `;http=${status}`;
  }
  return text;
}

/** Erro do próprio harness: a mensagem é montada só com texto fixo e descrições controladas. */
export class HarnessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HarnessError";
  }
}

/**
 * Erro seguro para propagar: preserva a guarda tal como é e reduz qualquer outro
 * a uma mensagem com contexto próprio e descrição controlada. A causa original
 * não é anexada.
 */
export function sanitizeThrown(thrown: unknown, context: string): Error {
  if (thrown instanceof IntegrationGuardError || thrown instanceof HarnessError) return thrown;
  return new HarnessError(`${context}: ${describeError(thrown)}`);
}
