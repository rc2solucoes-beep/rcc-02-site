import type { QueueHealth } from "@/lib/newsletter/health";
import type { OutboxStore } from "@/lib/newsletter/processor";
import type { TemplateKind } from "@/lib/newsletter/templates";

// Contrato do "banco" da homologação LC-01. Os sete cenários (scenarios.ts) só conhecem esta
// interface, então rodam IGUAIS contra:
//   * FakeBackend (memória, relógio simulado): ensaio no conjunto unitário, sem rede além do loopback;
//   * SupabaseBackend (isolado, RPCs reais da 018): execução futura, com autorização do operador.
// Os dois usam o MESMO processador e o MESMO simulador do Resend.

export type ItemSnapshot = {
  status: string;
  attempts: number;
  outcomeUnknown: boolean;
  deadReason: string | null;
  lastErrorCode: string | null;
  providerMessageId: string | null;
  hasPayload: boolean;
};

export interface Lc01Backend {
  readonly store: OutboxStore;
  /** Relógio do backend (real no Supabase, simulado no ensaio). */
  now(): Date;
  /** Cria um assinante sintético e um item no outbox; devolve o id do item. */
  enqueue(kind: TemplateKind): Promise<string>;
  snapshot(id: string): Promise<ItemSnapshot>;
  /** Vence o lease do item `sending` (simula o tempo passando ou a queda do worker). */
  expireLease(id: string): Promise<void>;
  /** Vence o prazo de 20 h do item. */
  elapseDeadline(id: string): Promise<void>;
  /** Pula a espera do backoff de um item em `retry`. */
  releaseBackoff(id: string): Promise<void>;
  /** Deixa o item pronto há `seconds` segundos (envelhece a fila para a sonda). */
  ageReady(id: string, seconds: number): Promise<void>;
  health(): Promise<QueueHealth>;
  /** Remove SOMENTE o que este backend criou. */
  cleanup(): Promise<void>;
}
