import { createHash, randomUUID } from "node:crypto";
import { resolve } from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CleanupRegistry } from "./cleanup";
import { HarnessError, describeError } from "./errors";
import type { Fixture } from "./probes";

// Fixtures da E2 (Gestão de Leads). ESCRITAS, NÃO EXECUTADAS. Apenas dados
// sintéticos (domínio example.test). Todo recurso é registrado ANTES de criado;
// notas e atividades também saem por CASCADE quando o lead é removido.

/** Fases da suíte E2: nenhuma roda sem a variável explícita (evita execução acidental). */
export const E2_PHASE_ENV = "RC2_E2_PHASE";
export type E2Phase = "pre015" | "post015";
export const e2PhaseIs = (phase: E2Phase): boolean => process.env[E2_PHASE_ENV] === phase;

/**
 * Fase EXPLÍCITA para as suítes legadas (baseline, e0b-security) nos pontos em que a 015 muda
 * a matriz de `leads`. Sem a variável, ou com valor desconhecido, falha: nunca assume uma fase
 * nem detecta permissões para escolher a expectativa (isso esconderia um estado divergente).
 */
export function requireLegacyLeadPhase(): E2Phase {
  const value = process.env[E2_PHASE_ENV];
  if (value === "pre015" || value === "post015") return value;
  throw new HarnessError(
    `${E2_PHASE_ENV} ausente ou inválida: informe pre015 (015 NÃO aplicada) ou post015 (015 aplicada). Esta suíte não adivinha a fase.`,
  );
}

/** Manifesto da fase pré-015, lido pelo T-LEAD-I07 depois do apply. Fica em test-results/ (ignorado pelo Git). */
export const LEGACY_MANIFEST_PATH = resolve(process.cwd(), "test-results/integration/e2-legacy-seed.json");
export const LEGACY_SEED_SOURCE = "e2-legacy-seed";

export const LEGACY_COLUMNS = [
  "id", "name", "company", "email", "whatsapp", "segment", "size",
  "solution", "message", "source", "ip_hash", "created_at",
] as const;
export const LEGACY_SELECT = LEGACY_COLUMNS.join(",");

const MANAGEMENT_SELECT =
  "id,status,status_updated_at,next_action,next_action_at,archived_at,updated_at,created_at";

export type ManagementSnapshot = {
  id: string;
  status: string;
  status_updated_at: string | null;
  next_action: string | null;
  next_action_at: string | null;
  archived_at: string | null;
  updated_at: string;
  created_at: string;
};

export type ActivityRow = {
  id: string;
  lead_id: string;
  actor_id: string | null;
  kind: string;
  from_value: string | null;
  to_value: string | null;
  created_at: string;
};

/** Impressão estável das colunas históricas (a mesma função nas duas fases). */
export function legacyFingerprint(row: Record<string, unknown>): string {
  const ordered = LEGACY_COLUMNS.map((column) => [column, row[column] ?? null]);
  return createHash("sha256").update(JSON.stringify(ordered)).digest("hex");
}

export const sleep = (ms: number): Promise<void> => new Promise((done) => setTimeout(done, ms));

/** Lê o estado de gestão de UM lead. Lança se a leitura falhar ou não devolver exatamente 1 linha. */
export async function readLead(client: SupabaseClient, id: string): Promise<ManagementSnapshot> {
  const { data, error } = await client.from("leads").select(MANAGEMENT_SELECT).eq("id", id);
  if (error) throw new HarnessError(`Leitura de leads falhou: ${describeError(error)}`);
  if (!data || data.length !== 1) throw new HarnessError(`Leitura de leads devolveu ${data?.length ?? 0} linhas (esperado 1)`);
  return data[0] as ManagementSnapshot;
}

export async function activityOf(client: SupabaseClient, leadId: string): Promise<ActivityRow[]> {
  const { data, error } = await client
    .from("lead_activity")
    .select("id,lead_id,actor_id,kind,from_value,to_value,created_at")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });
  if (error) throw new HarnessError(`Leitura de lead_activity falhou: ${describeError(error)}`);
  return (data ?? []) as ActivityRow[];
}

export async function notesOf(client: SupabaseClient, leadId: string): Promise<Array<{ id: string; author_id: string | null; body: string }>> {
  const { data, error } = await client.from("lead_notes").select("id,author_id,body").eq("lead_id", leadId);
  if (error) throw new HarnessError(`Leitura de lead_notes falhou: ${describeError(error)}`);
  return (data ?? []) as Array<{ id: string; author_id: string | null; body: string }>;
}

/** Nota sintética criada pelo service_role (o RLS não se aplica a ele). */
export async function makeNote(
  service: SupabaseClient,
  registry: CleanupRegistry,
  leadId: string,
  authorId: string | null,
  body = "nota sintética da suíte E2",
): Promise<Fixture> {
  const id = randomUUID();
  registry.track("lead_notes", "id", id);
  const { error } = await service.from("lead_notes").insert({ id, lead_id: leadId, author_id: authorId, body });
  if (error) throw new HarnessError(`Falha ao semear lead_notes: ${describeError(error)}`);
  return { table: "lead_notes", idColumn: "id", id };
}

/** Linha de histórico sintética (válida) criada pelo service_role; o trigger não é usado aqui. */
export async function makeActivity(
  service: SupabaseClient,
  registry: CleanupRegistry,
  leadId: string,
  actorId: string | null = null,
): Promise<Fixture> {
  const id = randomUUID();
  registry.track("lead_activity", "id", id);
  const { error } = await service
    .from("lead_activity")
    .insert({ id, lead_id: leadId, actor_id: actorId, kind: "archived" });
  if (error) throw new HarnessError(`Falha ao semear lead_activity: ${describeError(error)}`);
  return { table: "lead_activity", idColumn: "id", id };
}

/** Usuário sintético descartável com o prefixo da execução, para a reconciliação do cleanup() removê-lo se sobrar. */
export async function makeDisposableUser(
  service: SupabaseClient,
  tag: string,
  label: string,
): Promise<{ id: string; email: string }> {
  const email = `e0a-${tag}-${label}@example.test`;
  const { data, error } = await service.auth.admin.createUser({
    email,
    password: `${randomUUID()}Aa1!`,
    email_confirm: true,
  });
  if (error || !data.user) throw new HarnessError(`Falha ao criar usuário descartável: ${describeError(error)}`);
  return { id: data.user.id, email };
}
