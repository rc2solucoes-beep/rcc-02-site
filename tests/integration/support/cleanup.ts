import type { SupabaseClient } from "@supabase/supabase-js";
import { describeError } from "./errors";

export type TeardownPhase = {
  name: string;
  run: () => Promise<string[]>;
  /** Evidência a preservar se a fase lançar exceção (por exemplo, o que ficou sem remover). */
  evidence?: () => string[];
};

/**
 * Executa TODAS as fases, mesmo quando uma falha ou lança exceção, e acumula o
 * resultado. Lista vazia = limpo e verificado; nunca declara conclusão antecipada.
 */
export async function runTeardownPhases(phases: TeardownPhase[]): Promise<string[]> {
  const problems: string[] = [];
  for (const phase of phases) {
    try {
      problems.push(...(await phase.run()));
    } catch (thrown) {
      problems.push(`fase "${phase.name}" lançou exceção: ${describeError(thrown)}`);
      try {
        const evidence = phase.evidence?.() ?? [];
        if (evidence.length > 0) problems.push(`não removidos (evidência): ${evidence.join(", ")}`);
      } catch {
        problems.push(`fase "${phase.name}": evidência indisponível`);
      }
    }
  }
  return problems;
}

export type Tracked = { table: string; idColumn: string; id: string };

// Registro de recursos sintéticos. Registre ANTES de criar ou tentar, para que
// uma falha parcial nunca deixe um recurso sem dono. Nenhum método engole erro.
export class CleanupRegistry {
  private readonly items: Tracked[] = [];

  track(table: string, idColumn: string, id: string): void {
    const known = this.items.some((i) => i.table === table && i.idColumn === idColumn && i.id === id);
    if (!known) this.items.push({ table, idColumn, id });
  }

  get size(): number {
    return this.items.length;
  }

  /** Evidência: tudo o que foi registrado (para preservar o rastro quando a limpeza não consegue rodar). */
  describePending(): string[] {
    return this.items.map((item) => `${item.table}.${item.idColumn}=${item.id}`);
  }

  /**
   * Remove tudo, em ordem inversa, e devolve as falhas. Exceções lançadas e erros
   * devolvidos pela API são acumulados; um item com falha não impede os demais.
   */
  async run(service: SupabaseClient): Promise<string[]> {
    const failures: string[] = [];
    for (const item of [...this.items].reverse()) {
      try {
        const { error } = await service.from(item.table).delete().eq(item.idColumn, item.id);
        if (error) {
          failures.push(`${item.table}.${item.idColumn}=${item.id.slice(0, 12)}: ${describeError(error)}`);
        }
      } catch (thrown) {
        failures.push(`${item.table}.${item.idColumn}=${item.id.slice(0, 12)}: exceção ${describeError(thrown)}`);
      }
    }
    return failures;
  }

  /** Inspeção final: nada do que foi registrado pode continuar existindo. */
  async inspectResidue(service: SupabaseClient): Promise<string[]> {
    const residue: string[] = [];
    for (const item of this.items) {
      try {
        const { data, error } = await service.from(item.table).select(item.idColumn).eq(item.idColumn, item.id);
        if (error) {
          residue.push(`inspeção falhou em ${item.table}: ${describeError(error)}`);
        } else if ((data?.length ?? 0) > 0) {
          residue.push(`remanescente em ${item.table}: ${item.id.slice(0, 12)}`);
        }
      } catch (thrown) {
        residue.push(`inspeção lançou exceção em ${item.table}: ${describeError(thrown)}`);
      }
    }
    return residue;
  }
}
