"use server";

import { headers } from "next/headers";
import { consentIpHash } from "@/lib/newsletter/consent";
import { recordInvalidTokenAttempt } from "@/lib/newsletter/rateLimit";
import { confirmSubscription as confirmRpc, unsubscribeByToken } from "@/lib/newsletter/service";
import { hashToken, isWellFormedToken } from "@/lib/newsletter/tokens";
import { getClientIp } from "@/lib/security/clientIp";
import { createServiceClient } from "@/lib/supabase/server";

// Server Actions das páginas de token (RF-NL-02, RF-NL-05; SDD §7.2 e §7.3). O token chega no CORPO
// (POST) depois de o cliente removê-lo do fragmento da URL; nunca é registrado em log. Token
// encontrado NUNCA é limitado por IP; só malformado ou não encontrado conta em `nl:tok:ip`.
// Não dependem de NEWSLETTER_SIGNUP_ENABLED: confirmar e descadastrar são operações de manutenção.

export type TokenActionStatus = "confirmed" | "unsubscribed" | "already_unsubscribed" | "invalid" | "rate_limited" | "error";
export type TokenActionResult = { status: TokenActionStatus };

async function clientIp(): Promise<string | null> {
  return getClientIp(await headers(), { trustCloudflare: process.env.TRUST_CLOUDFLARE_PROXY === "true" });
}

/** Conta a tentativa inválida; acima do limite devolve `rate_limited`, senão `invalid`. */
async function invalidAttempt(client: ReturnType<typeof createServiceClient>, ip: string | null): Promise<TokenActionResult> {
  const decision = await recordInvalidTokenAttempt(client, ip);
  return { status: decision && !decision.allowed ? "rate_limited" : "invalid" };
}

export async function confirmSubscriptionAction(token: string): Promise<TokenActionResult> {
  try {
    const client = createServiceClient();
    const ip = await clientIp();
    if (!isWellFormedToken(token)) return await invalidAttempt(client, ip);

    // A RPC não recebe versão de consentimento: usa a do token (a do pedido original).
    const result = await confirmRpc(client, hashToken(token), ip ? consentIpHash(ip) : null);
    if (result === "invalid") return await invalidAttempt(client, ip);
    return { status: "confirmed" };
  } catch {
    console.error("[newsletter] confirmar: falha");
    return { status: "error" };
  }
}

export async function unsubscribeAction(token: string): Promise<TokenActionResult> {
  try {
    const client = createServiceClient();
    const ip = await clientIp();
    if (!isWellFormedToken(token)) return await invalidAttempt(client, ip);

    const result = await unsubscribeByToken(client, hashToken(token), "link");
    if (result === "not_found") return await invalidAttempt(client, ip);
    return { status: result };
  } catch {
    console.error("[newsletter] descadastrar: falha");
    return { status: "error" };
  }
}
