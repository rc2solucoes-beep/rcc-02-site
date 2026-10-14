import type { SupabaseClient } from "@supabase/supabase-js";

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

  /** Remove tudo, em ordem inversa, e devolve as falhas. */
  async run(service: SupabaseClient): Promise<string[]> {
    const failures: string[] = [];
    for (const item of [...this.items].reverse()) {
      const { error } = await service.from(item.table).delete().eq(item.idColumn, item.id);
      if (error) {
        failures.push(`${item.table}.${item.idColumn}=${item.id.slice(0, 12)}: ${error.code ?? error.message}`);
      }
    }
    return failures;
  }

  /** Inspeção final: nada do que foi registrado pode continuar existindo. */
  async inspectResidue(service: SupabaseClient): Promise<string[]> {
    const residue: string[] = [];
    for (const item of this.items) {
      const { data, error } = await service.from(item.table).select(item.idColumn).eq(item.idColumn, item.id);
      if (error) {
        residue.push(`inspeção falhou em ${item.table}: ${error.code ?? error.message}`);
      } else if ((data?.length ?? 0) > 0) {
        residue.push(`remanescente em ${item.table}: ${item.id.slice(0, 12)}`);
      }
    }
    return residue;
  }
}
