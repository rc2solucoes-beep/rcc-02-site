// Versões de consentimento e hash de IP da newsletter (SDD Newsletter §4.2 e §7.1).
//
// As versões são constantes do SERVIDOR: o formulário envia a versão que renderizou e o servidor
// só aceita se for a vigente. O texto de consentimento e a política são PROVISÓRIOS até a
// validação jurídica (BL-01) e a aprovação de copy (BL-10): não ativar a inscrição pública antes.

import { createHmac } from "node:crypto";
import { getRateLimitPepper } from "@/lib/security/rateLimit";

export const CONSENT_TEXT_VERSION = "draft-1";
export const POLICY_VERSION = "draft-1";

export function isCurrentConsentVersion(version: unknown): boolean {
  return version === CONSENT_TEXT_VERSION;
}

/** Apenas o caminho: sem query nem fragmento, no máximo 200 caracteres. */
export function sanitizeSourcePath(path: string): string {
  const clean = path.split(/[?#]/, 1)[0] ?? "";
  return clean.slice(0, 200);
}

/** HMAC com pepper e prefixo `consent-ip`: pseudonimizado, NÃO anônimo (DEC-23). */
export function consentIpHash(ip: string, env: Record<string, string | undefined> = process.env): string {
  return createHmac("sha256", getRateLimitPepper(env)).update(`consent-ip:${ip.trim()}`).digest("hex");
}
