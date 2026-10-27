// Tokens opacos da newsletter (SDD Newsletter §6, PRP-09).
//
// Token = "nlt_" + base64url de 32 bytes de CSPRNG (47 caracteres). Só o SHA-256 (hex) é
// persistido em newsletter_tokens; o token bruto existe apenas em newsletter_outbox_payload
// (transitório, somente service_role). Nada aqui lê variável de ambiente nem registra valores.

import { createHash, randomBytes } from "node:crypto";

export const TOKEN_PREFIX = "nlt_";
export const TOKEN_BYTES = 32;
/** 32 bytes em base64url sem padding = 43 caracteres; mais o prefixo = 47. */
export const TOKEN_LENGTH = TOKEN_PREFIX.length + 43;
const TOKEN_PATTERN = /^nlt_[A-Za-z0-9_-]{43}$/;
const HASH_PATTERN = /^[0-9a-f]{64}$/;

/** Validade do token de confirmação, contada da criação do item do outbox (§6.2). */
export const CONFIRM_TOKEN_TTL_HOURS = 48;

export function generateToken(): string {
  return TOKEN_PREFIX + randomBytes(TOKEN_BYTES).toString("base64url");
}

/** Rejeita entradas malformadas ou grandes ANTES de tocar no banco. */
export function isWellFormedToken(value: unknown): value is string {
  return typeof value === "string" && value.length === TOKEN_LENGTH && TOKEN_PATTERN.test(value);
}

export function hashToken(token: string): string {
  if (!isWellFormedToken(token)) throw new TypeError("token malformado");
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function isTokenHash(value: unknown): value is string {
  return typeof value === "string" && HASH_PATTERN.test(value);
}

export type TokenPair = { raw: string; hash: string };

export function generateTokenPair(): TokenPair {
  const raw = generateToken();
  return { raw, hash: hashToken(raw) };
}
