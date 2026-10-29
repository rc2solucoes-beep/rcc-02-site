// Processador do outbox da newsletter (SDD Newsletter §8.1 a §8.8).
//
// A lógica TRANSACIONAL (claim com SKIP LOCKED e recuperação de lease, prepare idempotente,
// conclusão por comparação e troca, expiração) vive nas RPCs da migration 018. Este módulo só
// ORQUESTRA: pede o lote, revalida, prepara, renderiza, envia pelo adaptador e devolve o
// resultado à RPC `complete`. Não reimplementa estado de fila em TypeScript.
//
// Nada aqui registra e-mail, token, URL, cabeçalho ou corpo; o resumo devolvido só tem contagens.

import {
  classifyProviderError,
  failure,
  type EmailProvider,
  type ProviderErrorCode,
  type SendResult,
} from "@/lib/newsletter/provider";
import { CURRENT_TEMPLATE_VERSION, renderEmail, type TemplateKind } from "@/lib/newsletter/templates";
import { generateTokenPair } from "@/lib/newsletter/tokens";

// ─── Parâmetros e invariantes (SDD §8.5, PRP-11: provisórios, calibrar em LC-01) ──────────────────
export const PROCESSOR_PARAMS = {
  /** T: timeout de cada chamada ao provedor. */
  timeoutMs: 15_000,
  /** B: itens por lote, processados em sequência. */
  batch: 5,
  /** D: maxDuration da rota de dispatch. */
  maxDurationSeconds: 120,
  /** L: lease concedido a cada item. */
  leaseSeconds: 180,
  /** P: período da varredura (pg_cron, futura migration N2). */
  sweepSeconds: 60,
  /** M: margem. */
  marginSeconds: 30,
  /** Teto de tentativas no total (incluindo recuperações de lease). */
  maxAttempts: 12,
  /** deadline_at = created_at + 20 h (default do banco). */
  deadlineHours: 20,
  /** Janela de idempotência do provedor (PV-12). */
  idempotencyWindowHours: 24,
} as const;

export type ProcessorParams = { -readonly [K in keyof typeof PROCESSOR_PARAMS]: number };

/** Devolve as violações dos invariantes do §8.5 (lista vazia = íntegro). */
export function checkProcessorInvariants(p: ProcessorParams = PROCESSOR_PARAMS): string[] {
  const problems: string[] = [];
  const budget = (p.batch * p.timeoutMs) / 1000 + p.marginSeconds;
  if (p.maxDurationSeconds < budget) problems.push("D >= B*T + M violado: a invocação pode ser encerrada no meio do lote");
  if (p.leaseSeconds <= p.maxDurationSeconds) problems.push("L > D violado: um item pode perder o lease com a invocação ainda viva");
  if (p.deadlineHours >= p.idempotencyWindowHours) problems.push("deadline < janela de idempotência violado: poderia haver duplicação");
  if (p.deadlineHours * 3600 <= p.leaseSeconds + p.sweepSeconds) problems.push("deadline >> L + P violado");
  return problems;
}

/** Orçamento mínimo (ms) para reivindicar um novo lote. */
export const BATCH_BUDGET_MS = PROCESSOR_PARAMS.batch * PROCESSOR_PARAMS.timeoutMs + PROCESSOR_PARAMS.marginSeconds * 1000;

// ─── Backoff (SDD §8.4) ──────────────────────────────────────────────────────
const BACKOFF_SECONDS = [60, 5 * 60, 15 * 60, 60 * 60, 3 * 60 * 60] as const;
const CONCURRENT_RETRY_SECONDS = 30;

/** Atraso após a falha da tentativa `attempt` (1-based): 1 min, 5 min, 15 min, 1 h, 3 h, depois a cada 3 h, ±10%. */
export function backoffSeconds(attempt: number, rng: () => number = Math.random): number {
  const base = BACKOFF_SECONDS[Math.min(Math.max(attempt, 1), BACKOFF_SECONDS.length) - 1];
  return Math.round(base * (0.9 + 0.2 * rng()));
}

// ─── Armazenamento (implementado sobre as RPCs da 018 em `store.ts`) ─────────
export type ClaimedItem = {
  id: string;
  subscriberId: string;
  kind: TemplateKind;
  attempts: number;
  consentTextVersion: string | null;
  policyVersion: string | null;
  idempotencyKey: string;
  outcomeUnknown: boolean;
};

export type ItemContext = {
  subscriber: { email: string; status: "pending" | "active" | "unsubscribed"; unsubscribedAt: string | null } | null;
  outboxCreatedAt: string;
  payload: { confirmToken: string | null; unsubscribeToken: string; templateVersion: string } | null;
  /** Token C vinculado a este item (existe só depois do prepare). */
  confirmTokenExpiresAt: string | null;
};

export type CompleteArgs =
  | { id: string; attempt: number; outcome: "sent"; providerMessageId: string }
  | { id: string; attempt: number; outcome: "retry"; nextAttemptAt: Date; errorCode: ProviderErrorCode; outcomeUnknown: boolean }
  | { id: string; attempt: number; outcome: "dead"; deadReason: DeadReason; errorCode: ProviderErrorCode | null; outcomeUnknown: boolean };

export type DeadReason = "permanent_error" | "invalid_state" | "superseded";

export interface OutboxStore {
  claim(batch: number, leaseSeconds: number, kinds: TemplateKind[]): Promise<ClaimedItem[]>;
  loadContext(item: ClaimedItem): Promise<ItemContext>;
  prepare(args: {
    id: string;
    attempt: number;
    confirm: { hash: string; raw: string } | null;
    unsubscribe: { hash: string; raw: string };
    templateVersion: string;
  }): Promise<"prepared" | "already_prepared" | "stale">;
  complete(args: CompleteArgs): Promise<"applied" | "stale">;
  expire(): Promise<number>;
}

// ─── Resultado ───────────────────────────────────────────────────────────────
export type DispatchSummary = {
  claimed: number;
  sent: number;
  retried: number;
  dead: number;
  superseded: number;
  /** Conclusão ou preparação descartada: outro worker reivindicou depois do vencimento do lease. */
  stale: number;
  expired: number;
  /** Falhas do armazenamento (a invocação para; os leases vencem e a recuperação reconcilia). */
  storeErrors: number;
  /** Para alertas (sem dados pessoais): quantos itens morreram por causa. */
  deadByReason: Record<DeadReason, number>;
  /** Cota do provedor esgotada em alguma tentativa. */
  quotaHit: boolean;
  /** Confirmações ficaram de fora do claim porque o dispatch de confirmação está desligado. */
  confirmationPaused: boolean;
};

export const emptySummary = (): DispatchSummary => ({
  claimed: 0, sent: 0, retried: 0, dead: 0, superseded: 0, stale: 0, expired: 0, storeErrors: 0,
  deadByReason: { permanent_error: 0, invalid_state: 0, superseded: 0 }, quotaHit: false, confirmationPaused: false,
});

export type DispatchDeps = {
  store: OutboxStore;
  provider: EmailProvider;
  /** Só `unsubscribe_link` é reivindicado quando falso (NEWSLETTER_CONFIRMATION_DISPATCH_ENABLED). */
  confirmationEnabled: boolean;
  now?: () => Date;
  rng?: () => number;
  params?: ProcessorParams;
};

// ─── Revalidação antes do envio (SDD §8.2) ───────────────────────────────────
function sendable(item: ClaimedItem, ctx: ItemContext, now: Date): boolean {
  const sub = ctx.subscriber;
  if (!sub) return false;
  if (item.kind === "unsubscribe_link") return sub.status === "pending" || sub.status === "active";
  // confirmation
  if (sub.status !== "pending" && sub.status !== "unsubscribed") return false;
  // Quem se descadastrou DEPOIS do pedido não recebe a confirmação.
  if (sub.unsubscribedAt && new Date(sub.unsubscribedAt) >= new Date(ctx.outboxCreatedAt)) return false;
  // Já preparado: o token C vinculado precisa existir e não ter expirado (consumo ou remoção = superado).
  if (ctx.payload) {
    if (!ctx.confirmTokenExpiresAt || new Date(ctx.confirmTokenExpiresAt) <= now) return false;
  }
  return true;
}

function withTimeout(promise: Promise<SendResult>, ms: number): Promise<SendResult> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<SendResult>((resolve) => {
    timer = setTimeout(() => resolve(failure("timeout")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

type ItemResult = "sent" | "retry" | "dead" | "superseded" | "stale";

/** Processa UM item já reivindicado. Lança apenas por falha do armazenamento. */
async function processItem(item: ClaimedItem, deps: Required<Pick<DispatchDeps, "store" | "provider">> & { now: () => Date; rng: () => number; params: ProcessorParams }, summary: DispatchSummary): Promise<ItemResult> {
  const { store, provider, now, rng, params } = deps;
  const dead = async (reason: DeadReason, errorCode: ProviderErrorCode | null): Promise<ItemResult> => {
    const applied = await store.complete({ id: item.id, attempt: item.attempts, outcome: "dead", deadReason: reason, errorCode, outcomeUnknown: item.outcomeUnknown });
    if (applied === "stale") return "stale";
    summary.deadByReason[reason] += 1;
    return reason === "superseded" ? "superseded" : "dead";
  };

  let ctx = await store.loadContext(item);
  if (!sendable(item, ctx, now())) return dead("superseded", null);
  const subscriber = ctx.subscriber;
  if (!subscriber) return dead("superseded", null);

  // Prepare idempotente: a retentativa REUTILIZA o payload; nunca gera tokens novos.
  if (!ctx.payload) {
    const unsubscribe = generateTokenPair();
    const confirm = item.kind === "confirmation" ? generateTokenPair() : null;
    const prepared = await store.prepare({
      id: item.id,
      attempt: item.attempts,
      confirm: confirm && { hash: confirm.hash, raw: confirm.raw },
      unsubscribe: { hash: unsubscribe.hash, raw: unsubscribe.raw },
      templateVersion: CURRENT_TEMPLATE_VERSION[item.kind],
    });
    if (prepared === "stale") return "stale";
    ctx = await store.loadContext(item); // lê o payload gravado (o da corrida, se já existia)
    if (!ctx.payload) return dead("invalid_state", null);
    if (!sendable(item, ctx, now())) return dead("superseded", null);
  }

  let message;
  try {
    message = renderEmail(item.kind, ctx.payload!.templateVersion, subscriber.email, {
      confirmToken: ctx.payload!.confirmToken,
      unsubscribeToken: ctx.payload!.unsubscribeToken,
    });
  } catch {
    // Template desconhecido ou token malformado no payload: é defeito de código/dados, não do provedor.
    return dead("invalid_state", null);
  }

  // Última leitura ANTES de chamar o provedor. O descadastro administrativo
  // pode ocorrer depois do prepare e da renderização, inclusive com item "sending".
  // Isso reduz a janela de corrida; uma revogação APÓS esta leitura e DURANTE
  // provider.send não pode ser garantida atomicamente com a API externa.
  const latest = await store.loadContext(item);
  if (!sendable(item, latest, now()) ||
      !latest.subscriber || latest.subscriber.email !== subscriber.email ||
      !latest.payload ||
      latest.payload.confirmToken !== ctx.payload!.confirmToken ||
      latest.payload.unsubscribeToken !== ctx.payload!.unsubscribeToken) {
    return dead("superseded", null);
  }

  let result: SendResult;
  try {
    result = await withTimeout(provider.send(message, { idempotencyKey: item.idempotencyKey, timeoutMs: params.timeoutMs }), params.timeoutMs);
  } catch {
    // Exceção do adaptador: resultado desconhecido (a mensagem pode ter saído).
    result = failure("unknown");
  }

  if (result.ok) {
    const applied = await store.complete({ id: item.id, attempt: item.attempts, outcome: "sent", providerMessageId: result.messageId });
    return applied === "stale" ? "stale" : "sent";
  }

  const action = classifyProviderError(result.code);
  if (result.code === "daily_quota_exceeded" || result.code === "monthly_quota_exceeded") summary.quotaHit = true;

  if (action === "permanent") return dead("permanent_error", result.code);
  if (action === "bug") return dead("invalid_state", result.code);

  const delay = action === "concurrent" ? Math.round(CONCURRENT_RETRY_SECONDS * (0.9 + 0.2 * rng())) : backoffSeconds(item.attempts, rng);
  const applied = await store.complete({
    id: item.id,
    attempt: item.attempts,
    outcome: "retry",
    nextAttemptAt: new Date(now().getTime() + delay * 1000),
    errorCode: result.code,
    // Ambíguo (e a repetição concorrente) significa que a mensagem pode ter sido aceita.
    outcomeUnknown: action === "ambiguous" || action === "concurrent" ? true : item.outcomeUnknown,
  });
  return applied === "stale" ? "stale" : "retry";
}

/**
 * Uma invocação do processador: expira o que venceu, reivindica lotes enquanto o orçamento de tempo
 * permitir (`restante >= B*T + M`, §8.5) e processa cada item em sequência.
 */
export async function dispatchOnce(deps: DispatchDeps): Promise<DispatchSummary> {
  const now = deps.now ?? (() => new Date());
  const rng = deps.rng ?? Math.random;
  const params = deps.params ?? PROCESSOR_PARAMS;
  const summary = emptySummary();
  const started = now().getTime();
  const budgetMs = params.maxDurationSeconds * 1000;
  const batchBudgetMs = params.batch * params.timeoutMs + params.marginSeconds * 1000;
  const kinds: TemplateKind[] = deps.confirmationEnabled ? ["confirmation", "unsubscribe_link"] : ["unsubscribe_link"];
  summary.confirmationPaused = !deps.confirmationEnabled;

  try {
    summary.expired = await deps.store.expire();

    for (let lot = 0; lot < 10; lot += 1) {
      if (budgetMs - (now().getTime() - started) < batchBudgetMs) break;
      const items = await deps.store.claim(params.batch, params.leaseSeconds, kinds);
      if (items.length === 0) break;
      summary.claimed += items.length;

      for (const item of items) {
        const outcome = await processItem(item, { store: deps.store, provider: deps.provider, now, rng, params }, summary);
        if (outcome === "sent") summary.sent += 1;
        else if (outcome === "retry") summary.retried += 1;
        else if (outcome === "dead") summary.dead += 1;
        else if (outcome === "superseded") summary.superseded += 1;
        else summary.stale += 1;
      }
      if (items.length < params.batch) break; // fila esgotada
    }
  } catch {
    // Falha do armazenamento: para. Itens reivindicados ficam em `sending` até o lease vencer; o
    // próximo claim os recupera como ambíguos e a chave de idempotência reconcilia com o provedor.
    summary.storeErrors += 1;
  }
  return summary;
}
