import type { NextRequest } from "next/server";
import { consentIpHash, CONSENT_TEXT_VERSION, isCurrentConsentVersion, POLICY_VERSION, sanitizeSourcePath } from "@/lib/newsletter/consent";
import { acceptedResponse, errorResponse, MESSAGES, parsePublicRequest, passTurnstile } from "@/lib/newsletter/publicRequest";
import { checkNewsletterRateLimit } from "@/lib/newsletter/rateLimit";
import { normalizeNewsletterEmail, subscribeSchema } from "@/lib/newsletter/schemas";
import { requestSubscription } from "@/lib/newsletter/service";
import { createServiceClient } from "@/lib/supabase/server";

// Inscrição com double opt-in (RF-NL-01, RF-NL-03; SDD §5.1 e §7.1).
// Ordem: sinalizador → origem → corpo/Zod → honeypot → versão do consentimento → Turnstile →
// rate limit → RPC → resposta uniforme 202. Desligada por padrão (NEWSLETTER_SIGNUP_ENABLED).
// Nunca registra e-mail, IP, token nem corpo.

export async function POST(req: NextRequest) {
  if (process.env.NEWSLETTER_SIGNUP_ENABLED !== "true") {
    return errorResponse(503, MESSAGES.disabled);
  }

  const parsed = await parsePublicRequest(req, subscribeSchema);
  if (!parsed.ok) return parsed.response;
  const { data, ip, honeypot } = parsed;

  // Honeypot: mesma resposta uniforme, sem fazer nada.
  if (honeypot) return acceptedResponse();

  // A versão gravada é a do servidor; formulário em cache com versão antiga é recusado sem gravar.
  if (!isCurrentConsentVersion(data.consentTextVersion)) return errorResponse(400, MESSAGES.stale);

  if (!(await passTurnstile(data.turnstileToken, ip))) return errorResponse(400, MESSAGES.turnstile);

  try {
    const client = createServiceClient();
    const emailNormalized = normalizeNewsletterEmail(data.email);

    let allowed: boolean;
    try {
      ({ allowed } = await checkNewsletterRateLimit(client, "subscribe", { email: emailNormalized, ip }));
    } catch {
      // Falha fechada: configuração ou banco do rate limit indisponível.
      console.error("[newsletter] subscribe: rate limit indisponivel");
      return errorResponse(429, MESSAGES.rateLimited);
    }
    if (!allowed) return errorResponse(429, MESSAGES.rateLimited);

    await requestSubscription(client, {
      email: data.email.trim(),
      emailNormalized,
      consentTextVersion: CONSENT_TEXT_VERSION,
      policyVersion: POLICY_VERSION,
      sourcePath: data.sourcePath ? sanitizeSourcePath(data.sourcePath) : null,
      ipHash: ip ? consentIpHash(ip) : null,
    });
  } catch {
    console.error("[newsletter] subscribe: falha ao gravar");
    return errorResponse(500, MESSAGES.internal);
  }

  return acceptedResponse();
}
