import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Pagination } from "@/components/admin/Pagination";
import { PostsList } from "@/components/admin/posts/PostsList";
import type { PostListItem } from "@/lib/admin/postList";

const now = new Date("2026-10-13T12:00:00.000Z");

function post(overrides: Partial<PostListItem>): PostListItem {
  return {
    id: "id-1",
    slug: "slug-1",
    title: "Título 1",
    status: "draft",
    published_at: null,
    scheduled_publish_at: null,
    created_at: "2026-01-01T12:00:00.000Z",
    updated_at: "2026-10-02T12:00:00.000Z",
    sort_at: "2026-10-02T12:00:00.000Z",
    ...overrides,
  };
}

describe("PostsList (RF-CMS-04, 06, 13)", () => {
  it("agrupa por mês com cabeçalho e repete meses em grupos separados", () => {
    render(
      <PostsList
        now={now}
        items={[
          post({ id: "a", title: "A", sort_at: "2026-11-02T12:00:00.000Z", updated_at: "2026-11-02T12:00:00.000Z" }),
          post({ id: "b", title: "B" }),
        ]}
      />,
    );
    expect(screen.getByRole("heading", { name: "Novembro de 2026" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Outubro de 2026" })).toBeInTheDocument();
  });

  it("publicado com data mostra 'Publicado em' e a data de Brasília", () => {
    render(
      <PostsList
        now={now}
        items={[post({ status: "published", published_at: "2026-10-14T02:30:00.000Z", sort_at: "2026-10-14T02:30:00.000Z" })]}
      />,
    );
    expect(screen.getByText(/Publicado em/)).toBeInTheDocument();
    expect(screen.getByText("13/10/2026 23:30")).toBeInTheDocument();
    expect(screen.queryByText(/sem data/i)).not.toBeInTheDocument();
  });

  it("publicado sem published_at mostra 'Criado em' e o aviso, nunca 'Publicado em' como data", () => {
    render(
      <PostsList
        now={now}
        items={[post({ status: "published", sort_at: "2026-01-01T12:00:00.000Z" })]}
      />,
    );
    expect(screen.getByText(/Criado em/)).toBeInTheDocument();
    expect(screen.getByText("Publicado sem data de publicação")).toBeInTheDocument();
    expect(screen.queryByText(/Publicado em/)).not.toBeInTheDocument();
  });

  it("agendado sem data mostra 'Atualizado em' e o aviso, nunca 'Agendado para'", () => {
    render(<PostsList now={now} items={[post({ status: "scheduled" })]} />);
    expect(screen.getByText(/Atualizado em/)).toBeInTheDocument();
    expect(screen.getByText("Agendado sem data: não será publicado")).toBeInTheDocument();
    expect(screen.queryByText(/Agendado para/)).not.toBeInTheDocument();
  });

  it("agendamento vencido há mais de 15 min é sinalizado", () => {
    render(
      <PostsList
        now={now}
        items={[post({ status: "scheduled", scheduled_publish_at: "2026-10-13T11:00:00.000Z", sort_at: "2026-10-13T11:00:00.000Z" })]}
      />,
    );
    expect(screen.getByText(/Agendado para/)).toBeInTheDocument();
    expect(screen.getByText("Agendamento vencido")).toBeInTheDocument();
  });

  it("cada linha tem links de edição e preview com nome acessível", () => {
    render(<PostsList now={now} items={[post({ id: "xyz", slug: "meu-slug", title: "Meu post" })]} />);
    const group = screen.getByRole("region", { name: "Outubro de 2026" });
    expect(within(group).getByRole("link", { name: /Editar: Meu post/ })).toHaveAttribute("href", "/admin/posts/xyz");
    expect(within(group).getByRole("link", { name: /Visualizar: Meu post/ })).toHaveAttribute("href", "/blog/meu-slug/preview");
  });
});

describe("Pagination (RF-CMS-07)", () => {
  const hrefFor = (p: number) => `/x?page=${p}`;

  it("primeira página: Anterior desabilitado, Próxima é link", () => {
    render(<Pagination page={1} pageCount={3} total={45} hrefFor={hrefFor} noun={{ singular: "post", plural: "posts" }} />);
    expect(screen.getByText("Página 1 de 3 · 45 posts")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Próxima/ })).toHaveAttribute("href", "/x?page=2");
    expect(screen.queryByRole("link", { name: /Anterior/ })).not.toBeInTheDocument();
  });

  it("última página: Próxima desabilitada", () => {
    render(<Pagination page={3} pageCount={3} total={45} hrefFor={hrefFor} />);
    expect(screen.getByRole("link", { name: /Anterior/ })).toHaveAttribute("href", "/x?page=2");
    expect(screen.queryByRole("link", { name: /Próxima/ })).not.toBeInTheDocument();
  });

  it("não renderiza sem itens", () => {
    const { container } = render(<Pagination page={1} pageCount={1} total={0} hrefFor={hrefFor} />);
    expect(container).toBeEmptyDOMElement();
  });
});
