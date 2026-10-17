// IP do cliente (RF-SEG-04).
//
// DEPENDÊNCIA DE CONFIANÇA (PV-19): estes cabeçalhos só são confiáveis atrás de uma fronteira
// de proxy que os sobrescreve (a Vercel, a validar em deploy isolado). Fora dela, um cliente
// pode forjá-los. Por isso o helper valida o formato e nunca inventa um endereço: sem IP
// confiável devolve null e o limite por e-mail continua valendo (E0c).
//
// `cf-connecting-ip` só é lido quando o chamador confirma o proxy do Cloudflare (PV-07).

import { isIP } from "node:net";

export type ClientIpOptions = {
  /** true somente depois de a PV-07 confirmar que o domínio passa pelo Cloudflare. */
  trustCloudflare?: boolean;
};

function validIp(value: string | null | undefined): string | null {
  const candidate = value?.trim();
  if (!candidate) return null;
  return isIP(candidate) ? candidate : null;
}

export function getClientIp(headers: Pick<Headers, "get">, options: ClientIpOptions = {}): string | null {
  const real = validIp(headers.get("x-real-ip"));
  if (real) return real;

  const forwarded = validIp(headers.get("x-forwarded-for")?.split(",")[0]);
  if (forwarded) return forwarded;

  if (options.trustCloudflare) return validIp(headers.get("cf-connecting-ip"));
  return null;
}
