import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Fase 7.2: `/api/google/debug` removido.
 *
 * Endpoint de diagnóstico público (HTTP 200 em produção), sem consumidor, que
 * a cada requisição chamava a Google Places API com a chave do servidor. Foi
 * removido — não protegido nem movido. `/api/google/places`, que alimenta as
 * avaliações do site, segue intacto.
 */

const root = process.cwd();
const apiDir = join(root, "src/app/api");

function filesUnder(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) filesUnder(full, acc);
    else if (/\.(ts|tsx)$/.test(entry)) acc.push(full);
  }
  return acc;
}

const apiRoutes = () =>
  filesUnder(apiDir)
    .filter((f) => f.endsWith("route.ts"))
    .map((f) => relative(apiDir, f).replaceAll("\\", "/").replace(/\/route\.ts$/, ""))
    .sort();

describe("/api/google/debug removido", () => {
  it("T01 — a rota não existe mais", () => {
    expect(existsSync(join(apiDir, "google/debug"))).toBe(false);
  });

  it("T02 — nenhuma referência funcional em src/", () => {
    const ofensores = filesUnder(join(root, "src"))
      .filter((f) => /google\/debug|googleDebug/.test(readFileSync(f, "utf-8")))
      .map((f) => relative(root, f));
    expect(ofensores).toEqual([]);
  });

  it("nenhuma rota de debug/diagnóstico sobrou ou foi criada em /api", () => {
    expect(apiRoutes().filter((r) => /debug|diagnostic|test/i.test(r))).toEqual([]);
  });

  it("T05 — /api/google/places continua existindo e é o que o site consome", () => {
    expect(existsSync(join(apiDir, "google/places/route.ts"))).toBe(true);
    const reviews = readFileSync(join(root, "src/components/GoogleReviews.tsx"), "utf-8");
    expect(reviews).toContain('fetch("/api/google/places")');
  });

  it("T06 — só as rotas de debug aprovadas saíram; as demais seguem", () => {
    expect(apiRoutes()).toEqual([
      "admin/init",
      "contact",
      "google/places",
      "posts",
      "upload",
    ]);
  });
});
