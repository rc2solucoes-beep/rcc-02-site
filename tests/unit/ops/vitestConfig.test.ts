import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// RF-OPS-03 / T-OPS-U02: o `npm test` padrão precisa descobrir testes .tsx.
// Lemos o arquivo como texto: o que importa é o contrato declarado no config.
const config = readFileSync(resolve(process.cwd(), "vitest.config.ts"), "utf8");

describe("vitest.config.ts (RF-OPS-03)", () => {
  it("descobre testes .ts e .tsx em tests/unit", () => {
    expect(config).toContain('include: ["tests/unit/**/*.test.{ts,tsx}"]');
    // o teste .tsx que motivou a correção continua no repositório
    expect(
      existsSync(
        resolve(process.cwd(), "tests/unit/admin/security-page-sanitization.test.tsx"),
      ),
    ).toBe(true);
  });

  it("mantém e2e e integração fora do npm test padrão", () => {
    expect(config).toContain('"tests/e2e/**"');
    expect(config).toContain('"tests/integration/**"');
  });
});
