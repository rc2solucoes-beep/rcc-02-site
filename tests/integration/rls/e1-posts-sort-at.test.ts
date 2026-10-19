import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CleanupRegistry, runTeardownPhases } from "../support/cleanup";
import { createRoleClients, type RoleClients } from "../support/clients";
import { HarnessError, describeError, sanitizeThrown } from "../support/errors";
import { buildSearchOrFilter } from "../../../src/lib/admin/listParams";
import { POST_LIST_COLUMNS, POST_SEARCH_COLUMNS } from "../../../src/lib/admin/postList";

// E1 (CMS) — T-CMS-I01 a I08. ESCRITO, NÃO EXECUTADO.
//
// Só faz sentido DEPOIS de aplicar a migration 014 no ambiente isolado
// (docs/runbooks/migrations/014-posts-sort-at/). Roda sob `npm run test:integration`, com a
// guarda anti-produção ativa e autorização expressa da execução (ambiente-supabase-isolado.md).
// Todo recurso é registrado ANTES de ser criado e removido no afterAll.

const registry = new CleanupRegistry();
let c: RoleClients | undefined;
let tearing: Promise<string[]> | undefined;

function clients(): RoleClients {
  if (!c) throw new Error("clientes não inicializados");
  return c;
}
const svc = (): SupabaseClient => clients().service;
const tag = (): string => clients().tag;
const prefix = (): string => `e0a-e1-${tag()}`;

function teardown(): Promise<string[]> {
  const current = c;
  if (!current) return Promise.resolve([]);
  tearing ??= runTeardownPhases([
    { name: "remoção dos recursos registrados", run: async () => registry.run(current.service), evidence: () => registry.describePending() },
    { name: "inspeção de resíduos", run: async () => registry.inspectResidue(current.service), evidence: () => registry.describePending() },
    { name: "usuários sintéticos", run: () => current.cleanup() },
  ]);
  return tearing;
}

type Seed = {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "scheduled" | "published";
  published_at: string | null;
  scheduled_publish_at: string | null;
  created_at: string;
  updated_at: string;
  summary: string;
};

let counter = 0;
async function seedPost(overrides: Partial<Seed> & { title?: string }): Promise<Seed> {
  const id = randomUUID();
  registry.track("posts", "id", id);
  counter += 1;
  const row: Seed = {
    id,
    slug: `${prefix()}-${counter}-${id.slice(0, 6)}`,
    title: `${prefix()}-titulo-${counter}`,
    status: "draft",
    published_at: null,
    scheduled_publish_at: null,
    created_at: "2026-01-01T12:00:00.000Z",
    updated_at: "2026-02-01T12:00:00.000Z",
    summary: "",
    ...overrides,
  };
  const { error } = await svc().from("posts").insert(row);
  if (error) throw new HarnessError(`Falha ao semear posts: ${describeError(error)}`);
  return row;
}

beforeAll(async () => {
  try {
    c = await createRoleClients();
  } catch (error) {
    const problems = [...(await teardown())];
    if (problems.length > 0) {
      throw new AggregateError([sanitizeThrown(error, "setup"), new Error(problems.join(" | "))], "O setup falhou e a limpeza também");
    }
    throw sanitizeThrown(error, "setup");
  }
});

afterAll(async () => {
  const problems = [...(await teardown())];
  if (problems.length > 0) throw new Error(`Falha de limpeza (${problems.length}): ${problems.join(" | ")}`);
});

async function sortAtOf(id: string): Promise<string | null> {
  const { data, error } = await svc().from("posts").select("sort_at").eq("id", id).single();
  if (error) throw new HarnessError(`Falha ao ler sort_at: ${describeError(error)}`);
  return (data as { sort_at: string | null }).sort_at;
}
const ms = (iso: string | null) => (iso ? new Date(iso).getTime() : Number.NaN);

describe("T-CMS-I01 — sort_at conforme a tabela de verdade, nunca nula (PV-17)", () => {
  it("cobre todos os status e os nulos legados", async () => {
    const pub = await seedPost({ status: "published", published_at: "2026-03-01T10:00:00.000Z" });
    const pubNull = await seedPost({ status: "published", published_at: null });
    const sch = await seedPost({ status: "scheduled", scheduled_publish_at: "2026-12-01T10:00:00.000Z" });
    const schNull = await seedPost({ status: "scheduled", scheduled_publish_at: null });
    const draft = await seedPost({ status: "draft" });

    expect(ms(await sortAtOf(pub.id))).toBe(ms(pub.published_at));
    expect(ms(await sortAtOf(pubNull.id))).toBe(ms(pubNull.created_at));
    expect(ms(await sortAtOf(sch.id))).toBe(ms(sch.scheduled_publish_at));
    expect(ms(await sortAtOf(schNull.id))).toBe(ms(schNull.updated_at));
    expect(ms(await sortAtOf(draft.id))).toBe(ms(draft.updated_at));
  });
});

describe("T-CMS-I02 — ordem determinística com sort_at idêntico", () => {
  it("desempata por id na mesma direção, em execuções repetidas", async () => {
    const same = "2026-05-05T10:00:00.000Z";
    const created = await Promise.all([1, 2, 3, 4].map(() => seedPost({ status: "published", published_at: same })));
    const ids = created.map((p) => p.id);
    const list = async (asc: boolean) => {
      const { data, error } = await svc()
        .from("posts")
        .select("id")
        .in("id", ids)
        .order("sort_at", { ascending: asc })
        .order("id", { ascending: asc });
      if (error) throw new HarnessError(`Falha ao listar: ${describeError(error)}`);
      return (data as { id: string }[]).map((r) => r.id);
    };
    const first = await list(false);
    expect(await list(false)).toEqual(first);
    expect(first).toEqual([...ids].sort().reverse());
    expect(await list(true)).toEqual([...ids].sort());
  });
});

describe("T-CMS-I03 — busca literal com entradas hostis (PRP-07, D2)", () => {
  // Cada caractere hostil é pesquisado no formato real do app (buildSearchOrFilter). O resultado
  // deve conter SOMENTE os posts cujo título/slug/resumo contém o termo literalmente.
  const hostile = ["%", "_", "\\", '"', ",", "(", ")", ".", "*", "--", "a b", "ação ñ 日本", "x),title.eq.1,(y", '"),or=(id.neq.0'];
  // Ramo imatch (termos com `*`): metacaracteres de regex combinados com `*`. Sem escape, casariam as iscas.
  const hostileRegex = [".*", "a*b", "[a-z]*", "(x|y)*", "^*$", "{1}*", "\\*", "+*", "?*"];

  it.each([...hostile, ...hostileRegex])("termo %j devolve só correspondências literais", async (h) => {
    const term = `${prefix()}-${h}`;
    const hit = await seedPost({ title: `${term}-hit` });
    // Iscas: casariam se `%`, `_` ou `*` fossem curingas, ou se a sintaxe vazasse.
    await seedPost({ title: `${prefix()}-Zdecoy` });
    await seedPost({ title: `${prefix()}-decoy` });
    await seedPost({ title: `${prefix()}-b` });
    await seedPost({ title: `${prefix()}-ab` });

    const { data, error } = await svc()
      .from("posts")
      .select("id,title,slug,summary")
      .or(buildSearchOrFilter(term, POST_SEARCH_COLUMNS));
    if (error) throw new HarnessError(`Busca falhou para ${JSON.stringify(h)}: ${describeError(error)}`);

    const rows = data as { id: string; title: string; slug: string; summary: string }[];
    const needle = term.toLowerCase();
    for (const r of rows) {
      const literal = [r.title, r.slug, r.summary].some((v) => v.toLowerCase().includes(needle));
      expect(literal, `resultado não literal para ${JSON.stringify(h)}`).toBe(true);
    }
    expect(rows.map((r) => r.id)).toContain(hit.id);
  });
});

describe("T-CMS-I04 — a seleção da listagem não devolve content", () => {
  it("devolve exatamente as colunas da listagem", async () => {
    const p = await seedPost({ status: "published", published_at: "2026-06-01T10:00:00.000Z" });
    const { data, error } = await svc().from("posts").select(POST_LIST_COLUMNS).eq("id", p.id).single();
    if (error) throw new HarnessError(`Falha: ${describeError(error)}`);
    expect(Object.keys(data as object).sort()).toEqual(POST_LIST_COLUMNS.split(",").sort());
    expect(data).not.toHaveProperty("content");
  });
});

describe("T-CMS-I05 — o UPDATE do cron recalcula sort_at (PV-14)", () => {
  // O SQL do job (011) não é executável pelo supabase-js; reproduzimos o efeito do mesmo UPDATE
  // (status -> published, published_at = scheduled_publish_at). A execução do job real fica
  // para a homologação manual no SQL Editor.
  it("agendado vencido vira publicado com sort_at = data agendada", async () => {
    const when = "2026-04-01T09:00:00.000Z";
    const p = await seedPost({ status: "scheduled", scheduled_publish_at: when });
    const { error } = await svc().from("posts").update({ status: "published", published_at: when }).eq("id", p.id);
    if (error) throw new HarnessError(`Falha: ${describeError(error)}`);
    expect(ms(await sortAtOf(p.id))).toBe(ms(when));
  });
});

describe("T-CMS-I06 — RLS de posts com a coluna nova", () => {
  it("anon lê só publicados; admin lê tudo; não-admin não lê rascunho", async () => {
    const pub = await seedPost({ status: "published", published_at: "2026-06-01T10:00:00.000Z" });
    const draft = await seedPost({ status: "draft" });
    const k = clients();
    const ids = (rows: { id: string }[] | null) => (rows ?? []).map((r) => r.id);

    const anon = await k.anon.from("posts").select("id,sort_at").in("id", [pub.id, draft.id]);
    expect(anon.error).toBeNull();
    expect(ids(anon.data)).toEqual([pub.id]);

    const nonAdmin = await k.nonAdmin.from("posts").select("id").in("id", [pub.id, draft.id]);
    expect(ids(nonAdmin.data)).not.toContain(draft.id);

    const admin = await k.admin.from("posts").select("id,sort_at").in("id", [pub.id, draft.id]);
    expect(admin.error).toBeNull();
    expect(ids(admin.data).sort()).toEqual([pub.id, draft.id].sort());
  });
});

describe("T-CMS-I07 — sort_at não é gravável", () => {
  it("INSERT e UPDATE com sort_at são rejeitados", async () => {
    const p = await seedPost({});
    const upd = await svc().from("posts").update({ sort_at: "2030-01-01T00:00:00.000Z" }).eq("id", p.id);
    expect(upd.error).not.toBeNull();

    const id = randomUUID();
    registry.track("posts", "id", id);
    const ins = await svc()
      .from("posts")
      .insert({ id, slug: `${prefix()}-w-${id.slice(0, 6)}`, title: `${prefix()}-w`, sort_at: "2030-01-01T00:00:00.000Z" });
    expect(ins.error).not.toBeNull();
  });
});

describe("T-CMS-I08 — página além do total (D3)", () => {
  it("devolve PGRST103 (416) ou lista vazia; o app trata os dois", async () => {
    const { data, error } = await svc()
      .from("posts")
      .select(POST_LIST_COLUMNS, { count: "exact" })
      .like("slug", `${prefix()}-%`)
      .order("sort_at", { ascending: false })
      .order("id", { ascending: false })
      .range(100_000, 100_019);
    const rangeError = error?.code === "PGRST103";
    const empty = !error && (data ?? []).length === 0;
    expect(rangeError || empty, "comportamento inesperado fora do alcance").toBe(true);
  });
});
