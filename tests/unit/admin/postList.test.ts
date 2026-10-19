import { describe, expect, it } from "vitest";
import {
  computeSortAt,
  describePostDate,
  detectPostAnomalies,
  groupByMonth,
  hasActivePostFilters,
  parsePostListParams,
  postListDateBounds,
  postListHref,
  type PostListItem,
} from "@/lib/admin/postList";

function item(overrides: Partial<PostListItem> = {}): PostListItem {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    slug: "post",
    title: "Post",
    status: "draft",
    published_at: null,
    scheduled_publish_at: null,
    created_at: "2026-01-01T12:00:00.000Z",
    updated_at: "2026-02-01T12:00:00.000Z",
    sort_at: "2026-02-01T12:00:00.000Z",
    ...overrides,
  };
}

describe("parsePostListParams (T-CMS-U01)", () => {
  it("devolve padrões para entrada vazia", () => {
    expect(parsePostListParams({})).toEqual({
      q: "",
      status: null,
      from: null,
      to: null,
      page: 1,
      dir: "desc",
      rangeIgnored: false,
    });
  });
  it("ignora status inválido e aceita os válidos", () => {
    expect(parsePostListParams({ status: "archived" }).status).toBeNull();
    expect(parsePostListParams({ status: "scheduled" }).status).toBe("scheduled");
  });
  it("ignora datas inexistentes", () => {
    const p = parsePostListParams({ from: "2026-02-30", to: "2026-13-01" });
    expect(p.from).toBeNull();
    expect(p.to).toBeNull();
    expect(p.rangeIgnored).toBe(false);
  });
  it("descarta o período e avisa quando from > to", () => {
    const p = parsePostListParams({ from: "2026-05-10", to: "2026-05-01" });
    expect(p.from).toBeNull();
    expect(p.to).toBeNull();
    expect(p.rangeIgnored).toBe(true);
  });
  it("aceita from == to", () => {
    const p = parsePostListParams({ from: "2026-05-10", to: "2026-05-10" });
    expect(p.from).toBe("2026-05-10");
    expect(p.rangeIgnored).toBe(false);
  });
  it("dir só aceita asc", () => {
    expect(parsePostListParams({ dir: "asc" }).dir).toBe("asc");
    expect(parsePostListParams({ dir: "up" }).dir).toBe("desc");
  });
  it("hasActivePostFilters", () => {
    expect(hasActivePostFilters(parsePostListParams({}))).toBe(false);
    expect(hasActivePostFilters(parsePostListParams({ q: "ab" }))).toBe(true);
    expect(hasActivePostFilters(parsePostListParams({ page: "3", dir: "asc" }))).toBe(false);
  });
});

describe("postListHref", () => {
  it("omite padrões e preserva filtros", () => {
    const p = parsePostListParams({ q: "erp", status: "draft", page: "3", dir: "asc" });
    expect(postListHref(p)).toBe("/admin/posts?q=erp&status=draft&dir=asc&page=3");
    expect(postListHref(p, { page: 1 })).toBe("/admin/posts?q=erp&status=draft&dir=asc");
    expect(postListHref(parsePostListParams({}))).toBe("/admin/posts");
  });
});

describe("postListDateBounds / dias de Brasília (T-CMS-U03)", () => {
  it("converte o dia de Brasília em [gte, lt) UTC", () => {
    expect(postListDateBounds({ from: "2026-10-13", to: "2026-10-13" })).toEqual({
      gte: "2026-10-13T03:00:00.000Z",
      lt: "2026-10-14T03:00:00.000Z",
    });
  });
  it("um post às 23:30 de Brasília cai no próprio dia, não no seguinte", () => {
    const { gte, lt } = postListDateBounds({ from: "2026-10-13", to: "2026-10-13" });
    const at2330 = new Date("2026-10-14T02:30:00.000Z").getTime(); // 23:30 BRT de 13/10
    expect(at2330).toBeGreaterThanOrEqual(new Date(gte!).getTime());
    expect(at2330).toBeLessThan(new Date(lt!).getTime());
  });
  it("sem datas, sem limites", () => {
    expect(postListDateBounds({ from: null, to: null })).toEqual({ gte: null, lt: null });
  });
  it("virada de mês e de ano no fim do período", () => {
    expect(postListDateBounds({ from: null, to: "2026-12-31" }).lt).toBe("2027-01-01T03:00:00.000Z");
  });
});

describe("groupByMonth (T-CMS-U03)", () => {
  it("agrupa por mês de Brasília preservando a ordem e repete cabeçalhos não contíguos", () => {
    const groups = groupByMonth([
      item({ id: "a", sort_at: "2026-11-02T10:00:00.000Z" }),
      item({ id: "b", sort_at: "2026-10-20T10:00:00.000Z" }),
      item({ id: "c", sort_at: "2026-10-03T10:00:00.000Z" }),
      item({ id: "d", sort_at: "2026-09-30T10:00:00.000Z" }),
    ]);
    expect(groups.map((g) => [g.key, g.label, g.items.map((i) => i.id)])).toEqual([
      ["2026-11", "Novembro de 2026", ["a"]],
      ["2026-10", "Outubro de 2026", ["b", "c"]],
      ["2026-09", "Setembro de 2026", ["d"]],
    ]);
  });
  it("usa o mês de Brasília: 31/10 às 23:30 BRT (UTC já em novembro) fica em outubro", () => {
    const [g] = groupByMonth([item({ sort_at: "2026-11-01T02:30:00.000Z" })]);
    expect(g.key).toBe("2026-10");
  });
  it("1º do mês às 00:30 BRT já é o mês novo", () => {
    const [g] = groupByMonth([item({ sort_at: "2026-11-01T03:30:00.000Z" })]);
    expect(g.key).toBe("2026-11");
  });
  it("lista vazia", () => {
    expect(groupByMonth([])).toEqual([]);
  });
});

describe("origem da data e rótulo (T-CMS-U04, RN-15)", () => {
  it("publicado com published_at", () => {
    const i = item({ status: "published", published_at: "2026-03-01T10:00:00.000Z" });
    expect(describePostDate(i)).toMatchObject({ source: "published_at", label: "Publicado em" });
  });
  it("publicado SEM published_at usa created_at e nunca diz 'Publicado em'", () => {
    const d = describePostDate(item({ status: "published" }));
    expect(d.source).toBe("created_at");
    expect(d.label).toBe("Criado em");
    expect(d.iso).toBe("2026-01-01T12:00:00.000Z");
  });
  it("agendado com data", () => {
    const i = item({ status: "scheduled", scheduled_publish_at: "2026-12-01T10:00:00.000Z" });
    expect(describePostDate(i)).toMatchObject({ source: "scheduled_publish_at", label: "Agendado para" });
  });
  it("agendado SEM data usa updated_at e nunca diz 'Agendado para'", () => {
    const d = describePostDate(item({ status: "scheduled" }));
    expect(d.source).toBe("updated_at");
    expect(d.label).toBe("Atualizado em");
  });
  it("rascunho usa updated_at", () => {
    expect(describePostDate(item())).toMatchObject({ source: "updated_at", label: "Atualizado em" });
  });
  it("espelho da tabela de verdade de sort_at nunca é nulo", () => {
    const statuses = ["draft", "scheduled", "published"] as const;
    for (const status of statuses) {
      for (const pub of [null, "2026-03-01T00:00:00.000Z"]) {
        for (const sch of [null, "2026-04-01T00:00:00.000Z"]) {
          const v = computeSortAt(item({ status, published_at: pub, scheduled_publish_at: sch }));
          expect(v.value).toBeTruthy();
        }
      }
    }
  });
});

describe("anomalias (T-CMS-U08, RF-CMS-13)", () => {
  const now = new Date("2026-10-13T12:00:00.000Z");
  it("publicado sem data", () => {
    expect(detectPostAnomalies(item({ status: "published" }), now)).toEqual(["published_without_date"]);
  });
  it("agendado sem data", () => {
    expect(detectPostAnomalies(item({ status: "scheduled" }), now)).toEqual(["scheduled_without_date"]);
  });
  it("agendamento vencido só depois de 15 minutos", () => {
    const at = (min: number) =>
      item({ status: "scheduled", scheduled_publish_at: new Date(now.getTime() - min * 60_000).toISOString() });
    expect(detectPostAnomalies(at(10), now)).toEqual([]);
    expect(detectPostAnomalies(at(15), now)).toEqual([]);
    expect(detectPostAnomalies(at(16), now)).toEqual(["scheduled_overdue"]);
  });
  it("agendado no futuro, publicado com data e rascunho: sem anomalia", () => {
    expect(
      detectPostAnomalies(item({ status: "scheduled", scheduled_publish_at: "2026-12-01T00:00:00.000Z" }), now),
    ).toEqual([]);
    expect(detectPostAnomalies(item({ status: "published", published_at: "2026-03-01T00:00:00.000Z" }), now)).toEqual([]);
    expect(detectPostAnomalies(item(), now)).toEqual([]);
  });
});
