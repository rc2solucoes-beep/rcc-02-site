// Adaptador de e-mail da newsletter (SDD Newsletter §8.3 e §9).
//
// A interface é pequena e testável: o processador só conhece `EmailProvider`. A implementação do
// Resend traduz erros do SDK para códigos de uma lista FECHADA (os mesmos aceitos por
// `newsletter_outbox.last_error_code`) e a classificação decide a ação do processador.
// Nada aqui registra e-mail, token, URL, cabeçalhos ou corpo.

import { Resend } from "resend";

/** Códigos aceitos pelo CHECK de `newsletter_outbox.last_error_code` (migration 018). */
export const PROVIDER_ERROR_CODES = [
  "validation_error", "invalid_from_address", "invalid_parameter", "missing_required_field",
  "missing_api_key", "invalid_api_key", "restricted_api_key", "invalid_access", "security_error",
  "rate_limit_exceeded", "daily_quota_exceeded", "monthly_quota_exceeded",
  "concurrent_idempotent_requests", "invalid_idempotent_request",
  "application_error", "internal_server_error", "network_error", "timeout", "aborted",
  "process_crash", "unknown",
] as const;
export type ProviderErrorCode = (typeof PROVIDER_ERROR_CODES)[number];

/** Ação do processador (SDD §8.3). */
export type FailureClass =
  | "permanent" //  dead(permanent_error) + alerta de configuração
  | "transient" //  retry respeitando o backoff (rate limit e cotas, com alerta de cota)
  | "concurrent" // retry curto: outra tentativa com a mesma chave está em voo
  | "bug" //        dead(invalid_state) + alerta
  | "ambiguous"; // retry com a MESMA chave e outcome_unknown = true

const CLASSIFICATION: Record<ProviderErrorCode, FailureClass> = {
  validation_error: "permanent",
  invalid_from_address: "permanent",
  invalid_parameter: "permanent",
  missing_required_field: "permanent",
  missing_api_key: "permanent",
  invalid_api_key: "permanent",
  restricted_api_key: "permanent",
  invalid_access: "permanent",
  security_error: "permanent",
  rate_limit_exceeded: "transient",
  daily_quota_exceeded: "transient",
  monthly_quota_exceeded: "transient",
  concurrent_idempotent_requests: "concurrent",
  invalid_idempotent_request: "bug",
  application_error: "ambiguous",
  internal_server_error: "ambiguous",
  network_error: "ambiguous",
  timeout: "ambiguous",
  aborted: "ambiguous",
  process_crash: "ambiguous",
  unknown: "ambiguous",
};

export function classifyProviderError(code: ProviderErrorCode): FailureClass {
  return CLASSIFICATION[code];
}

/** Normaliza o nome de erro do SDK para a lista fechada. Desconhecido ou 5xx = ambíguo. */
export function toProviderErrorCode(name: unknown, statusCode?: number | null): ProviderErrorCode {
  if (typeof name === "string" && (PROVIDER_ERROR_CODES as readonly string[]).includes(name)) {
    return name as ProviderErrorCode;
  }
  if (typeof statusCode === "number") {
    if (statusCode === 429) return "rate_limit_exceeded";
    if (statusCode >= 500) return "internal_server_error";
  }
  return "unknown";
}

export type OutgoingEmail = {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  html: string;
  text: string;
  headers: Record<string, string>;
};

export type SendOptions = {
  /** Estável entre tentativas da mesma linha do outbox (`nl-<id>`). */
  idempotencyKey: string;
  timeoutMs: number;
};

export type SendResult =
  | { ok: true; messageId: string }
  | { ok: false; code: ProviderErrorCode; failure: FailureClass };

export interface EmailProvider {
  send(message: OutgoingEmail, options: SendOptions): Promise<SendResult>;
}

export const failure = (code: ProviderErrorCode): SendResult => ({ ok: false, code, failure: classifyProviderError(code) });

type ResendLike = { emails: { send: (payload: never, options?: { idempotencyKey?: string }) => Promise<{ data: { id?: string } | null; error: { name?: unknown; statusCode?: number | null } | null }> } };

/**
 * Provedor real. NÃO é chamado em teste: os testes usam `ScriptedProvider`. O envio de verdade só
 * acontece com RESEND_API_KEY configurada e o dispatch ligado, o que ainda não ocorre.
 */
export class ResendProvider implements EmailProvider {
  private readonly client: ResendLike;

  constructor(apiKey: string, client?: ResendLike) {
    this.client = client ?? (new Resend(apiKey) as unknown as ResendLike);
  }

  async send(message: OutgoingEmail, options: SendOptions): Promise<SendResult> {
    const call = this.client.emails
      .send(
        {
          from: message.from,
          to: message.to,
          replyTo: message.replyTo,
          subject: message.subject,
          html: message.html,
          text: message.text,
          headers: message.headers,
        } as never,
        { idempotencyKey: options.idempotencyKey },
      )
      .then<SendResult>(({ data, error }) => {
        if (error) return failure(toProviderErrorCode(error.name, error.statusCode));
        if (!data?.id) return failure("unknown");
        return { ok: true, messageId: data.id };
      })
      // Falha de rede ou exceção do SDK: o resultado é desconhecido (a mensagem pode ter saído).
      .catch<SendResult>(() => failure("network_error"));

    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<SendResult>((resolve) => {
      timer = setTimeout(() => resolve(failure("timeout")), options.timeoutMs);
    });
    try {
      return await Promise.race([call, timeout]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}

/** Resultado programado para testes; cada `send` consome o próximo (o último se repete). */
export type ScriptedStep = SendResult | { throws: true } | { hangs: true };

export class ScriptedProvider implements EmailProvider {
  readonly calls: Array<{ message: OutgoingEmail; options: SendOptions }> = [];

  constructor(private readonly steps: ScriptedStep[] = [{ ok: true, messageId: "simulated-id" }]) {}

  async send(message: OutgoingEmail, options: SendOptions): Promise<SendResult> {
    this.calls.push({ message, options });
    const step = this.steps[Math.min(this.calls.length - 1, this.steps.length - 1)];
    if ("throws" in step) throw new Error("falha simulada do provedor");
    if ("hangs" in step) return new Promise<SendResult>(() => {}); // o processador deve impor o timeout
    return step;
  }
}

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]", "::1"]);

/**
 * O SDK do Resend lê `RESEND_BASE_URL` UMA vez, na carga do módulo, e passa a mandar TUDO (e-mail
 * do contato, alertas de segurança, newsletter) para esse endereço. Por isso a variável é só do
 * simulador de homologação (LC-01) e fica sob trava:
 *   * em Production ela é proibida (qualquer valor);
 *   * fora dela só vale um endereço de loopback (o simulador roda na própria máquina);
 *   * nunca `resend.com` nem outro host remoto.
 * Devolve o motivo do bloqueio, ou `null` quando a configuração é segura (inclusive "não definida").
 */
export function resendBaseUrlProblem(env: Record<string, string | undefined> = process.env): string | null {
  const raw = env.RESEND_BASE_URL?.trim();
  if (!raw) return null;
  if (env.VERCEL_ENV === "production") return "RESEND_BASE_URL é proibida em Production";
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return "RESEND_BASE_URL inválida";
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return "RESEND_BASE_URL com protocolo inesperado";
  if (!LOOPBACK_HOSTS.has(url.hostname)) return "RESEND_BASE_URL só pode apontar para loopback (simulador local)";
  return null;
}

/**
 * Provedor de produção a partir do ambiente; `null` quando a chave não existe OU quando
 * `RESEND_BASE_URL` está definida de forma insegura (o dispatch recusa antes de reivindicar).
 */
export function createProviderFromEnv(env: Record<string, string | undefined> = process.env): EmailProvider | null {
  const apiKey = env.RESEND_API_KEY?.trim();
  if (!apiKey || apiKey === "xxxx") return null;
  if (resendBaseUrlProblem(env) !== null) return null;
  return new ResendProvider(apiKey);
}
