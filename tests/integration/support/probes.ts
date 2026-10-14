import type { SupabaseClient } from "@supabase/supabase-js";
import type { CleanupRegistry } from "./cleanup";
import { HarnessError, describeError, safeCode, sanitizeThrown } from "./errors";
import { recordEntry, type Operation, type Outcome, type Role } from "./matrix";

export type Fixture = { table: string; idColumn: string; id: string };

export type WriteObservation = {
  operation: "INSERT" | "UPDATE" | "DELETE";
  /** UPDATE/DELETE: o cliente privilegiado confirmou que a linha existia antes da operação. */
  fixtureConfirmed: boolean;
  /** Código de erro devolvido ao cliente sob teste (null se não houve erro). */
  errorCode: string | null;
  /** O cliente privilegiado confirmou a mudança efetiva (linha inserida, coluna alterada, linha removida). */
  changed: boolean;
};

// Decisão pura sobre o EFEITO REAL. Zero linhas afetadas, sozinho, nunca é negação.
export function classifyWrite(o: WriteObservation): Outcome | "error" {
  if (o.operation !== "INSERT" && !o.fixtureConfirmed) return "error";
  if (o.changed) return o.errorCode ? "error" : "allow";
  if (o.errorCode === "42501") return "deny";
  if (o.errorCode) return "error";
  // Sem erro e sem mudança: num INSERT isso é inconsistente; em UPDATE/DELETE
  // com fixture confirmada e filtro por chave primária, só a RLS pode ter
  // ocultado a linha.
  return o.operation === "INSERT" ? "error" : "deny";
}

type DbError = { code?: string; message?: string } | null;

function errorCodeOf(error: DbError): string | null {
  return error ? (safeCode(error.code) ?? "unknown") : null;
}

// Leituras privilegiadas lançam em caso de erro: nunca viram "deny" por engano.
async function rowExists(service: SupabaseClient, fx: Fixture): Promise<boolean> {
  const { data, error } = await service.from(fx.table).select(fx.idColumn).eq(fx.idColumn, fx.id);
  if (error) throw new HarnessError(`Leitura privilegiada falhou em ${fx.table}: ${describeError(error)}`);
  return (data?.length ?? 0) > 0;
}

async function columnValue(service: SupabaseClient, fx: Fixture, column: string): Promise<unknown> {
  const { data, error } = await service.from(fx.table).select(column).eq(fx.idColumn, fx.id);
  if (error) throw new HarnessError(`Leitura privilegiada falhou em ${fx.table}.${column}: ${describeError(error)}`);
  const rows = data as unknown as Array<Record<string, unknown>> | null;
  return rows?.[0]?.[column] ?? null;
}

export async function observeSelect(
  client: SupabaseClient,
  service: SupabaseClient,
  fx: Fixture,
): Promise<Outcome | "error"> {
  const existed = await rowExists(service, fx);
  const { data, error } = await client.from(fx.table).select(fx.idColumn).eq(fx.idColumn, fx.id);
  if (!existed) return "error"; // sem fixture confirmada, "zero linhas" não prova negação
  if (error) return error.code === "42501" ? "deny" : "error";
  return (data?.length ?? 0) > 0 ? "allow" : "deny";
}

export async function observeInsert(
  client: SupabaseClient,
  service: SupabaseClient,
  registry: CleanupRegistry,
  table: string,
  idColumn: string,
  row: Record<string, unknown>,
): Promise<Outcome | "error"> {
  const id = String(row[idColumn]);
  registry.track(table, idColumn, id); // registrado ANTES de tentar
  // Sem .select(): a autorização de INSERT não pode depender de política de SELECT.
  const { error } = await client.from(table).insert(row);
  const changed = await rowExists(service, { table, idColumn, id });
  return classifyWrite({ operation: "INSERT", fixtureConfirmed: true, errorCode: errorCodeOf(error), changed });
}

export async function observeUpdate(
  client: SupabaseClient,
  service: SupabaseClient,
  fx: Fixture,
  column: string,
  newValue: string,
): Promise<Outcome | "error"> {
  const fixtureConfirmed = await rowExists(service, fx);
  const before = fixtureConfirmed ? await columnValue(service, fx, column) : null;
  const { error } = await client.from(fx.table).update({ [column]: newValue }).eq(fx.idColumn, fx.id);
  const after = fixtureConfirmed ? await columnValue(service, fx, column) : null;
  const changed = fixtureConfirmed && after === newValue && before !== newValue;
  return classifyWrite({ operation: "UPDATE", fixtureConfirmed, errorCode: errorCodeOf(error), changed });
}

export async function observeDelete(
  client: SupabaseClient,
  service: SupabaseClient,
  fx: Fixture,
): Promise<Outcome | "error"> {
  const fixtureConfirmed = await rowExists(service, fx);
  const { error } = await client.from(fx.table).delete().eq(fx.idColumn, fx.id);
  const changed = fixtureConfirmed && !(await rowExists(service, fx));
  return classifyWrite({ operation: "DELETE", fixtureConfirmed, errorCode: errorCodeOf(error), changed });
}

export async function check(args: {
  table: string;
  role: Role;
  operation: Operation;
  expected: Outcome;
  observe: () => Promise<Outcome | "error">;
}): Promise<Outcome | "error"> {
  let observed: Outcome | "error";
  try {
    observed = await args.observe();
  } catch (thrown) {
    // Registra como inconclusivo e propaga uma versão sanitizada (sem conteúdo externo).
    recordEntry({ table: args.table, role: args.role, operation: args.operation, expected: args.expected, observed: "error" });
    throw sanitizeThrown(thrown, `observação falhou em ${args.table}/${args.role}/${args.operation}`);
  }
  recordEntry({
    table: args.table,
    role: args.role,
    operation: args.operation,
    expected: args.expected,
    observed,
  });
  return observed;
}
