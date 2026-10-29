import type { NextRequest } from "next/server";
import { acceptedResponse, errorResponse, MESSAGES, parsePublicRequest, passTurnstile } from "@/lib/newsletter/publicRequest";
import { checkNewsletterRateLimit } from "@/lib/newsletter/rateLimit";
import { normalizeNewsletterEmail, unsubscribeRequestSchema } from "@/lib/newsletter/schemas";
import { requestUnsubscribeLink } from "@/lib/newsletter/service";
import { createServiceClient } from "@/lib/supabase/server";

// Pedido público de novo link de descadastro (RF-NL-04; SDD §7.4).
// NUNCA altera o status pelo e-mail digitado: só enfileira o link para quem já é assinante.
// NÃO depende de NEWSLETTER_SIGNUP_ENABLED: é endpoint de manutenção e permanece ativo com a
// newsletter desligada ou em rollback (SDD §18.5). Resposta uniforme 202.

export async function POST(req: NextRequest) {
  const parsed = await parsePublicRequest(req, unsubscribeRequestSchema);
  if (!parsed.ok) return parsed.response;
  const { data, ip, honeypot } = parsed;

  if (honeypot) return acceptedResponse();

  if (!(await passTurnstile(data.turnstileToken, ip))) return errorResponse(400, MESSAGES.turnstile);

  try {
    const client = createServiceClient();
    const emailNormalized = normalizeNewsletterEmail(data.email);

    let allowed: boolean;
    try {
      ({ allowed } = await checkNewsletterRateLimit(client, "unsubscribe_request", { email: emailNormalized, ip }));
    } catch {
      console.error("[newsletter] unsubscribe-request: rate limit indisponivel");
      return errorResponse(429, MESSAGES.rateLimited);
    }
    if (!allowed) return errorResponse(429, MESSAGES.rateLimited);

    await requestUnsubscribeLink(client, emailNormalized);
  } catch {
    console.error("[newsletter] unsubscribe-request: falha ao gravar");
    return errorResponse(500, MESSAGES.internal);
  }

  return acceptedResponse();
}
