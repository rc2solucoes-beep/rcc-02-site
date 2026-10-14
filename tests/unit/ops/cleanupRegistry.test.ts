import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { CleanupRegistry } from "../../integration/support/cleanup";

type Row = { table: string; id: string };

// Cliente falso mínimo: guarda linhas e permite forçar erros.
function fakeService(options: { rows?: Row[]; deleteErrorFor?: string; selectError?: boolean } = {}) {
  const rows: Row[] = options.rows ?? [];
  const deleted: string[] = [];
  const service = {
    from: (table: string) => ({
      delete: () => ({
        eq: async (_column: string, id: string) => {
          deleted.push(`${table}:${id}`);
          if (options.deleteErrorFor === id) return { error: { code: "23503", message: "fk" } };
          return { error: null };
        },
      }),
      select: () => ({
        eq: async (_column: string, id: string) => {
          if (options.selectError) return { data: null, error: { code: "XX000", message: "boom" } };
          return { data: rows.filter((row) => row.table === table && row.id === id), error: null };
        },
      }),
    }),
  } as unknown as SupabaseClient;
  return { service, deleted };
}

describe("CleanupRegistry", () => {
  it("remove os recursos em ordem inversa e não duplica registros", async () => {
    const registry = new CleanupRegistry();
    registry.track("posts", "id", "a");
    registry.track("settings", "key", "b");
    registry.track("posts", "id", "a");
    expect(registry.size).toBe(2);
    const { service, deleted } = fakeService();
    expect(await registry.run(service)).toEqual([]);
    expect(deleted).toEqual(["settings:b", "posts:a"]);
  });

  it("não silencia erro de exclusão: devolve a falha", async () => {
    const registry = new CleanupRegistry();
    registry.track("posts", "id", "falha-1234567890");
    const { service } = fakeService({ deleteErrorFor: "falha-1234567890" });
    const failures = await registry.run(service);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain("posts.id=falha-123456");
    expect(failures[0]).toContain("23503");
  });

  it("a inspeção final aponta recursos que continuam existindo", async () => {
    const registry = new CleanupRegistry();
    registry.track("leads", "id", "resto");
    const { service } = fakeService({ rows: [{ table: "leads", id: "resto" }] });
    const residue = await registry.inspectResidue(service);
    expect(residue).toHaveLength(1);
    expect(residue[0]).toContain("remanescente em leads");
  });

  it("a inspeção final reporta falha de leitura em vez de assumir que está limpo", async () => {
    const registry = new CleanupRegistry();
    registry.track("leads", "id", "x");
    const { service } = fakeService({ selectError: true });
    const residue = await registry.inspectResidue(service);
    expect(residue).toHaveLength(1);
    expect(residue[0]).toContain("inspeção falhou");
  });
});
