import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { CleanupRegistry, runTeardownPhases } from "../../integration/support/cleanup";

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


describe("CleanupRegistry resiliente a exceções (B-02)", () => {
  function throwingService(throwOn: "delete" | "select") {
    return {
      from: () => ({
        delete: () => ({
          eq: async (_c: string, id: string) => {
            if (throwOn === "delete" && id === "a") throw new Error("rede caiu");
            return { error: null };
          },
        }),
        select: () => ({
          eq: async (_c: string, id: string) => {
            if (throwOn === "select" && id === "a") throw new Error("rede caiu");
            return { data: [{ id }], error: null };
          },
        }),
      }),
    } as unknown as SupabaseClient;
  }

  it("exceção ao excluir um item: acumula e continua com os demais", async () => {
    const registry = new CleanupRegistry();
    registry.track("posts", "id", "a");
    registry.track("posts", "id", "b");
    const failures = await registry.run(throwingService("delete"));
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatch(/exceção rede caiu/);
  });

  it("exceção na inspeção de um item: reporta e ainda inspeciona os outros", async () => {
    const registry = new CleanupRegistry();
    registry.track("posts", "id", "a");
    registry.track("posts", "id", "b");
    const residue = await registry.inspectResidue(throwingService("select"));
    expect(residue.some((r) => r.includes("lançou exceção"))).toBe(true);
    expect(residue.some((r) => r.includes("remanescente em posts"))).toBe(true);
  });

  it("describePending lista tudo o que foi registrado (evidência)", () => {
    const registry = new CleanupRegistry();
    registry.track("posts", "id", "a");
    registry.track("settings", "key", "k");
    expect(registry.describePending()).toEqual(["posts.id=a", "settings.key=k"]);
  });
});

describe("runTeardownPhases (B-02)", () => {
  it("fase que lança exceção não impede as demais, e o resultado nunca é 'limpo'", async () => {
    const ran: string[] = [];
    const problems = await runTeardownPhases([
      { name: "um", run: async () => (ran.push("um"), ["falha-1"]) },
      {
        name: "dois",
        run: async () => {
          ran.push("dois");
          throw new Error("explodiu");
        },
        evidence: () => ["posts.id=a"],
      },
      { name: "três", run: async () => (ran.push("três"), []) },
    ]);
    expect(ran).toEqual(["um", "dois", "três"]);
    expect(problems).toEqual([
      "falha-1",
      'fase "dois" lançou exceção: explodiu',
      "não removidos (evidência): posts.id=a",
    ]);
  });

  it("evidência que também falha é registrada e não interrompe", async () => {
    const problems = await runTeardownPhases([
      {
        name: "x",
        run: async () => {
          throw new Error("e1");
        },
        evidence: () => {
          throw new Error("e2");
        },
      },
      { name: "y", run: async () => ["ok-y"] },
    ]);
    expect(problems).toContain('fase "x": evidência indisponível');
    expect(problems).toContain("ok-y");
  });

  it("tudo limpo: lista vazia", async () => {
    await expect(runTeardownPhases([{ name: "a", run: async () => [] }])).resolves.toEqual([]);
  });
});
