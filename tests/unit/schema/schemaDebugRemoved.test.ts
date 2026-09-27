import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * SDD Schema.org — Fase 7.1: `/api/schema-debug` removido.
 *
 * O endpoint de diagnóstico era público (HTTP 200 em produção) e sem
 * consumidor. Foi removido — não protegido nem movido. A validação de schema
 * segue pelos builders e pelos testes em `tests/unit/schema/`.
 */

const root = process.cwd();

function filesUnder(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) filesUnder(full, acc);
    else if (/\.(ts|tsx)$/.test(entry)) acc.push(full);
  }
  return acc;
}

describe("/api/schema-debug removido", () => {
  it("T01 — a rota não existe mais", () => {
    expect(existsSync(join(root, "src/app/api/schema-debug"))).toBe(false);
  });

  it("T02 — nenhuma referência funcional em src/", () => {
    const ofensores = filesUnder(join(root, "src"))
      .filter((f) => /schema-debug|schemaDebug/.test(readFileSync(f, "utf-8")))
      .map((f) => relative(root, f));
    expect(ofensores).toEqual([]);
  });

  it("nenhuma rota substituta de debug de schema foi criada", () => {
    const rotas = filesUnder(join(root, "src/app/api"))
      .map((f) => relative(join(root, "src/app/api"), f).replaceAll("\\", "/"));
    expect(rotas.filter((r) => /schema/i.test(r))).toEqual([]);
  });

  // `google/debug` saiu desta lista na Fase 7.2 (`googleDebugRemoved.test.ts`).
  it("T04 — as demais rotas /api continuam existindo", () => {
    for (const rota of [
      "admin/init",
      "contact",
      "google/places",
      "posts",
      "upload",
    ]) {
      expect(existsSync(join(root, "src/app/api", rota, "route.ts"))).toBe(true);
    }
  });
});
