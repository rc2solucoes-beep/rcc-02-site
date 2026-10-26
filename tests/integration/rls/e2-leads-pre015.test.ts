import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createRoleClients, type RoleClients } from "../support/clients";
import { HarnessError, describeError, sanitizeThrown } from "../support/errors";
import {
  LEGACY_MANIFEST_PATH,
  LEGACY_SEED_SOURCE,
  LEGACY_SELECT,
  e2PhaseIs,
  legacyFingerprint,
} from "../support/e2Fixtures";

// E2 — FASE PRÉ-015 do T-LEAD-I07 (migration sobre linhas existentes). ESCRITO, NÃO EXECUTADO.
//
// Por que existe: o harness só fala PostgREST e não executa SQL, então a migration não
// pode ser aplicada por teste. A sequência, no ambiente ISOLADO e com autorização expressa:
//   1. RC2_E2_PHASE=pre015  → este arquivo semeia leads históricos sintéticos (antes da 015)
//                             e grava o manifesto com a impressão das colunas históricas.
//   2. O operador aplica a 015 manualmente (runbook; preflight antes, verify depois).
//   3. RC2_E2_PHASE=post015 → e2-leads.test.ts prova, no T-LEAD-I07, que as linhas viraram
//                             status `new`, updated_at = created_at e colunas antigas intactas,
//                             e remove os leads semeados.
// Sem RC2_E2_PHASE=pre015 a suíte inteira é ignorada. Os leads semeados NÃO são removidos
// aqui de propósito: precisam sobreviver à migration. Só dados sintéticos (example.test).

const CREATED_AT = ["2020-03-04T05:06:07.123456+00:00", "2020-03-04T05:06:08.000001+00:00", "2021-11-12T13:14:15.999999+00:00"];

let c: RoleClients | undefined;
const svc = (): SupabaseClient => {
  if (!c) throw new Error("clientes não inicializados");
  return c.service;
};

describe.skipIf(!e2PhaseIs("pre015"))("E2 — fase pré-015 (semeadura de leads históricos para o T-LEAD-I07)", () => {
  beforeAll(async () => {
    try {
      c = await createRoleClients();
    } catch (error) {
      throw sanitizeThrown(error, "setup");
    }
  });

  afterAll(async () => {
    // Só os usuários sintéticos são removidos; os leads semeados ficam para o I07.
    const current = c;
    if (!current) return;
    const problems = await current.cleanup();
    if (problems.length > 0) throw new Error(`Falha de limpeza (${problems.length}): ${problems.join(" | ")}`);
  });

  it("confirma que a 015 AINDA NÃO foi aplicada (colunas de gestão ausentes)", async () => {
    const { error } = await svc().from("leads").select("status").limit(1);
    expect(error, "a coluna `status` já existe: a 015 foi aplicada, esta fase não faz mais sentido").not.toBeNull();
    expect(["42703", "PGRST204", "PGRST100"]).toContain(error?.code);
  });

  it("semeia leads históricos sintéticos com created_at antigo e grava o manifesto", async () => {
    const tag = c?.tag ?? randomUUID().slice(0, 8);
    const rows = CREATED_AT.map((created_at, index) => {
      const id = randomUUID();
      return {
        id,
        name: "Teste E2 legado",
        company: "Sintético",
        email: `e2-legacy-${tag}-${index}@example.test`,
        whatsapp: "5500000000000",
        segment: "teste",
        size: "1",
        solution: "teste",
        message: `dado sintético histórico ${index}`,
        source: LEGACY_SEED_SOURCE,
        ip_hash: index === 0 ? null : `e2hash${index}`,
        created_at,
      };
    });

    const inserted = await svc().from("leads").insert(rows);
    if (inserted.error) throw new HarnessError(`Falha ao semear leads históricos: ${describeError(inserted.error)}`);

    const { data, error } = await svc()
      .from("leads")
      .select(LEGACY_SELECT)
      .in("id", rows.map((row) => row.id));
    if (error || !data || data.length !== rows.length) {
      throw new HarnessError(`Releitura dos leads semeados falhou: ${describeError(error)}`);
    }

    const seeded = (data as unknown as Array<Record<string, unknown>>).map((row) => ({
      id: String(row.id),
      created_at: String(row.created_at),
      fingerprint: legacyFingerprint(row),
    }));
    mkdirSync(dirname(LEGACY_MANIFEST_PATH), { recursive: true });
    writeFileSync(LEGACY_MANIFEST_PATH, JSON.stringify({ phase: "pre015", source: LEGACY_SEED_SOURCE, seeded }, null, 2));

    expect(seeded).toHaveLength(rows.length);
    expect(new Set(seeded.map((row) => row.created_at)).size).toBe(rows.length);
  });
});
