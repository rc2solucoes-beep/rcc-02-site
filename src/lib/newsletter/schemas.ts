import { z } from "zod";

// Esquemas das rotas públicas da newsletter (SDD §5.1 e §7). Mensagens genéricas: nenhuma
// resposta revela o motivo por endereço.

const email = z.string().trim().min(3).max(254).email();

export const MAX_JSON_BODY_BYTES = 4096;

export const subscribeSchema = z.object({
  email,
  /** Checkbox de consentimento: precisa ser exatamente `true`. */
  consent: z.literal(true),
  /** Versão do texto que o formulário renderizou; o servidor compara com a vigente. */
  consentTextVersion: z.string().max(40),
  sourcePath: z.string().max(200).optional(),
  website: z.string().max(200).optional(),
  turnstileToken: z.string().max(4096).optional().default(""),
});
export type SubscribeInput = z.infer<typeof subscribeSchema>;

export const unsubscribeRequestSchema = z.object({
  email,
  website: z.string().max(200).optional(),
  turnstileToken: z.string().max(4096).optional().default(""),
});
export type UnsubscribeRequestInput = z.infer<typeof unsubscribeRequestSchema>;

export function normalizeNewsletterEmail(value: string): string {
  return value.trim().toLowerCase();
}
