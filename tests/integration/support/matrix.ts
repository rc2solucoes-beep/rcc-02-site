import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

export type Role = "anon" | "authenticated_non_admin" | "authenticated_admin" | "service_role";
export type Operation = "SELECT" | "INSERT" | "UPDATE" | "DELETE";
export type Outcome = "allow" | "deny";
export type MatrixEntry = {
  table: string;
  role: Role;
  operation: Operation;
  expected: Outcome;
  observed: Outcome | "error";
};

const entries: MatrixEntry[] = [];

export function recordEntry(entry: MatrixEntry): void {
  entries.push(entry);
}

export function matrixEntries(): MatrixEntry[] {
  return [...entries];
}

/** Divergências: inclui qualquer `error`, pois o esperado nunca é "error". */
export function mismatches(): MatrixEntry[] {
  return entries.filter((entry) => entry.expected !== entry.observed);
}

function renderMarkdown(list: MatrixEntry[]): string {
  const rows = list.map(
    (e) =>
      `| ${e.table} | ${e.role} | ${e.operation} | ${e.expected} | ${e.observed} | ${
        e.expected === e.observed ? "ok" : "**DIVERGE**"
      } |`,
  );
  const divergent = list.filter((e) => e.expected !== e.observed).length;
  const inconclusive = list.filter((e) => e.observed === "error").length;
  return [
    "# Matriz de RLS: tabela × papel × operação",
    "",
    `Total: ${list.length} · divergências: ${divergent} · inconclusivos (error): ${inconclusive}`,
    "",
    "| Tabela | Papel | Operação | Esperado | Observado | Resultado |",
    "|---|---|---|---|---|---|",
    ...rows,
    "",
  ].join("\n");
}

export function writeMatrixReport(
  name: string,
  dir = "test-results/integration",
): { json: string; md: string } {
  const folder = resolve(process.cwd(), dir);
  mkdirSync(folder, { recursive: true });
  const json = join(folder, `rls-matrix-${name}.json`);
  const md = join(folder, `rls-matrix-${name}.md`);
  writeFileSync(json, JSON.stringify(entries, null, 2));
  writeFileSync(md, renderMarkdown(entries));
  return { json, md };
}
