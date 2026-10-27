// Autenticação dos endpoints internos da newsletter (SDD Newsletter §8.8): bearer com
// NEWSLETTER_DISPATCH_SECRET, comparado em tempo constante. Segredo ausente ou curto = acesso negado.

import { createHash, timingSafeEqual } from "node:crypto";

export const MIN_DISPATCH_SECRET_LENGTH = 32;

export function isDispatchAuthorized(
  authorizationHeader: string | null,
  env: Record<string, string | undefined> = process.env,
): boolean {
  const secret = env.NEWSLETTER_DISPATCH_SECRET?.trim();
  if (!secret || secret.length < MIN_DISPATCH_SECRET_LENGTH) return false;

  const match = /^Bearer (\S+)$/.exec(authorizationHeader ?? "");
  if (!match) return false;

  // Compara os SHA-256 (tamanho fixo): não vaza o comprimento do segredo e usa tempo constante.
  const given = createHash("sha256").update(match[1]).digest();
  const expected = createHash("sha256").update(secret).digest();
  return timingSafeEqual(given, expected);
}
