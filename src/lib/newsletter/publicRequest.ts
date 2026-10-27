// Cadeia de validação comum à inscrição e ao pedido de novo link (SDD §5.1):
// origem → corpo JSON com tamanho máximo → Zod → honeypot → Turnstile → rate limit.
// Cada etapa que reprova devolve a resposta HTTP final; a rota só executa a RPC se a cadeia passar.

import { NextResponse } from "next/server";
import type { ZodType } from "zod";
import { getClientIp } from "@/lib/security/clientIp";
import { isValidOrigin } from "@/lib/security/origin";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { MAX_JSON_BODY_BYTES } from "@/lib/newsletter/schemas";

export const ACCEPTED_BODY = { status: "received" } as const;
const NO_STORE = { "Cache-Control": "no-store" } as const;

/** Resposta uniforme (RF-NL-03): idêntica para qualquer estado do endereço e para o honeypot. */
export function acceptedResponse(): NextResponse {
  return NextResponse.json(ACCEPTED_BODY, { status: 202, headers: NO_STORE });
}

export function errorResponse(status: number, error: string): NextResponse {
  return NextResponse.json({ error }, { status, headers: NO_STORE });
}

export const MESSAGES = {
  badOrigin: "Requisição rejeitada.",
  badBody: "Dados inválidos.",
  stale: "Formulário desatualizado. Recarregue a página e tente novamente.",
  turnstile: "Não foi possível validar a verificação de segurança. Recarregue a página e tente novamente.",
  rateLimited: "Muitas solicitações. Aguarde alguns minutos e tente novamente.",
  internal: "Não foi possível concluir a solicitação. Tente novamente.",
  disabled: "Serviço indisponível no momento.",
} as const;

/** Lê o corpo como JSON respeitando o tamanho máximo. Devolve `undefined` se inválido ou grande. */
export async function readJsonBody(req: Request): Promise<unknown | undefined> {
  const declared = Number(req.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_JSON_BODY_BYTES) return undefined;
  let text: string;
  try {
    text = await req.text();
  } catch {
    return undefined;
  }
  if (text.length > MAX_JSON_BODY_BYTES) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

export type ParsedPublicRequest<T> =
  | { ok: false; response: NextResponse }
  | { ok: true; data: T; ip: string | null; honeypot: boolean };

/**
 * Origem, corpo e Zod. O Turnstile e o rate limit rodam depois, em `passTurnstile`, porque o
 * honeypot decide entre eles e a resposta uniforme.
 */
export async function parsePublicRequest<T extends { website?: string }>(
  req: Request,
  schema: ZodType<T>,
): Promise<ParsedPublicRequest<T>> {
  if (!isValidOrigin(req.headers.get("origin"))) {
    return { ok: false, response: errorResponse(403, MESSAGES.badOrigin) };
  }
  const body = await readJsonBody(req);
  if (body === undefined) return { ok: false, response: errorResponse(400, MESSAGES.badBody) };
  const parsed = schema.safeParse(body);
  if (!parsed.success) return { ok: false, response: errorResponse(400, MESSAGES.badBody) };

  const ip = getClientIp(req.headers, { trustCloudflare: process.env.TRUST_CLOUDFLARE_PROXY === "true" });
  return { ok: true, data: parsed.data, ip, honeypot: Boolean(parsed.data.website && parsed.data.website.length > 0) };
}

export async function passTurnstile(token: string, ip: string | null): Promise<boolean> {
  const result = await verifyTurnstile(token, { ip });
  return result.ok;
}
