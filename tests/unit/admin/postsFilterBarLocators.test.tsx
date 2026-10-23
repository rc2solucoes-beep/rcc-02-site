import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Os locators do E2E (E01) são conferidos aqui contra a marcação REAL do formulário, sem navegador.
vi.mock("next/form", () => ({
  default: ({ children, ...props }: { children: React.ReactNode } & Record<string, unknown>) => <form {...props}>{children}</form>,
}));
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string } & Record<string, unknown>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { PostsFilterBar } from "@/components/admin/posts/PostsFilterBar";
import { parsePostListParams } from "@/lib/admin/postList";

describe("locators do E2E sobre o formulário de filtros real", () => {
  it("o formulário é localizável por role=search e cada campo é único dentro dele", () => {
    render(<PostsFilterBar params={parsePostListParams({})} />);
    const filters = screen.getByRole("search", { name: "Filtrar posts" });
    for (const label of ["Status", "De", "Até"]) {
      expect(within(filters).getAllByLabelText(label, { exact: true }), label).toHaveLength(1);
    }
    expect(within(filters).getAllByLabelText(/Buscar por título/i)).toHaveLength(1);
    expect(within(filters).getAllByRole("button", { name: "Filtrar" })).toHaveLength(1);
  });

  it("o spec usa os locators escopados e não os genéricos que falharam", () => {
    const spec = readFileSync(resolve(process.cwd(), "tests/e2e/admin-posts-list.spec.ts"), "utf8");
    expect(spec).toContain('getByRole("search", { name: "Filtrar posts" })');
    expect(spec).toContain('filters.getByLabel("De", { exact: true })');
    expect(spec).toContain('filters.getByLabel("Até", { exact: true })');
    expect(spec).toContain('filters.getByLabel("Status", { exact: true })');
    expect(spec).not.toMatch(/page\.getByLabel\("(De|Até|Status)"\)/);
    // todo getByRole("alert") precisa ser filtrado por texto da aplicação
    for (const line of spec.split(/\r?\n/).filter((l) => l.includes('getByRole("alert")') && !l.trim().startsWith("//"))) {
      expect(line).toContain(".filter(");
    }
  });
});
