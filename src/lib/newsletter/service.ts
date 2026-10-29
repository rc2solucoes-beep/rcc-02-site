// Camada fina sobre as RPCs da migration 018. Toda regra transacional vive no banco (SDD §7);
// aqui só se traduz resultado e erro. Nenhum valor de e-mail, token ou hash entra em log ou erro.

import type { SupabaseClient } from "@supabase/supabase-js";

export type NewsletterClient = Pick<SupabaseClient, "rpc">;

/** Falha ao chamar o banco. Sem detalhes: o chamador decide o status HTTP. */
export class NewsletterStoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NewsletterStoreError";
  }
}

async function call(client: NewsletterClient, fn: string, args: Record<string, unknown>): Promise<unknown> {
  let result: { data: unknown; error: unknown };
  try {
    result = await client.rpc(fn, args);
  } catch {
    throw new NewsletterStoreError(`falha de rede em ${fn}`);
  }
  if (result.error) throw new NewsletterStoreError(`erro do banco em ${fn}`);
  return result.data;
}

export type RequestSubscriptionArgs = {
  email: string;
  emailNormalized: string;
  consentTextVersion: string;
  policyVersion: string;
  sourcePath: string | null;
  ipHash: string | null;
};

export async function requestSubscription(client: NewsletterClient, a: RequestSubscriptionArgs): Promise<void> {
  await call(client, "newsletter_request_subscription", {
    p_email: a.email,
    p_email_normalized: a.emailNormalized,
    p_consent_text_version: a.consentTextVersion,
    p_policy_version: a.policyVersion,
    p_source_path: a.sourcePath,
    p_ip_hash: a.ipHash,
  });
}

export async function requestUnsubscribeLink(client: NewsletterClient, emailNormalized: string): Promise<void> {
  await call(client, "newsletter_request_unsubscribe_link", { p_email_normalized: emailNormalized });
}

export type ConfirmResult = "confirmed" | "invalid";

export async function confirmSubscription(
  client: NewsletterClient,
  tokenHash: string,
  ipHash: string | null,
): Promise<ConfirmResult> {
  const data = await call(client, "newsletter_confirm", { p_token_hash: tokenHash, p_ip_hash: ipHash });
  if (data === "confirmed" || data === "invalid") return data;
  throw new NewsletterStoreError("resposta inesperada de newsletter_confirm");
}

export type UnsubscribeResult = "unsubscribed" | "already_unsubscribed" | "not_found";
export type UnsubscribeChannel = "link" | "one_click";

export async function unsubscribeByToken(
  client: NewsletterClient,
  tokenHash: string,
  channel: UnsubscribeChannel,
): Promise<UnsubscribeResult> {
  const data = await call(client, "newsletter_unsubscribe", { p_token_hash: tokenHash, p_channel: channel });
  if (data === "unsubscribed" || data === "already_unsubscribed" || data === "not_found") return data;
  throw new NewsletterStoreError("resposta inesperada de newsletter_unsubscribe");
}
