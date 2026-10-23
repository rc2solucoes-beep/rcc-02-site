import { beforeEach, describe, expect, it, vi } from "vitest";

// Server Actions de posts: agendamento futuro (RF-CMS-10), exclusão verificada (RF-CMS-11)
// e atualização com zero linhas (D8). Tudo com dublês: nenhum banco é acessado.

const audit = vi.fn();
const redirectMock = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
const state = {
  existing: null as null | Record<string, unknown>,
  updateRows: [{ id: "p1" }] as Array<{ id: string }>,
  updateError: null as null | { code: string },
  deleteRows: [{ id: "p1" }] as Array<{ id: string }>,
  deleteError: null as null | { code: string },
  calls: [] as string[],
};

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => redirectMock(url) }));
vi.mock("@/lib/admin/requireAdmin", () => ({
  requireAdmin: async () => ({ ok: true, status: 200, userId: "u1", email: "admin@example.test" }),
}));
vi.mock("@/lib/admin/auditLog", () => ({ writeAdminAuditLog: (input: unknown) => audit(input) }));
vi.mock("@/lib/authors/server", () => ({ updateAuthorRecord: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createSessionClient: async () => ({
    from: () => {
      let op = "select";
      const builder: Record<string, unknown> = {};
      const result = () => {
        if (op === "select") return { data: state.existing, error: null };
        if (op === "update") return { data: state.updateRows, error: state.updateError };
        if (op === "delete") return { data: state.deleteRows, error: state.deleteError };
        return { data: null, error: null };
      };
      for (const method of ["select", "eq", "update", "delete", "insert"]) {
        builder[method] = () => {
          if (["update", "delete", "insert"].includes(method)) {
            op = method;
            state.calls.push(method);
          }
          return builder;
        };
      }
      builder.maybeSingle = async () => result();
      builder.then = (resolve: (v: unknown) => unknown) => resolve(result());
      return builder;
    },
  }),
}));

import { createPost, deletePost, updatePost } from "@/app/admin/(protected)/posts/actions";

const FUTURE = "2099-01-01T10:00";
const PAST = "2020-01-01T10:00";

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  const base: Record<string, string> = {
    title: "Título do post",
    slug: "titulo-do-post",
    summary: "Um resumo com mais de dez caracteres.",
    content: "<p>Conteúdo com bem mais de vinte caracteres no total.</p>",
    status: "draft",
  };
  for (const [k, v] of Object.entries({ ...base, ...fields })) fd.append(k, v);
  return fd;
}
const events = () => audit.mock.calls.map(([input]) => (input as { event: string }).event);

beforeEach(() => {
  audit.mockClear();
  redirectMock.mockClear();
  Object.assign(state, {
    existing: { status: "draft", published_at: null, scheduled_publish_at: null },
    updateRows: [{ id: "p1" }],
    updateError: null,
    deleteRows: [{ id: "p1" }],
    deleteError: null,
    calls: [],
  });
});

describe("createPost — agendamento (RF-CMS-10, T-CMS-E04 em nível de action)", () => {
  it("agendado sem data é rejeitado e nada é gravado", async () => {
    const result = await createPost({}, form({ status: "scheduled" }));
    expect(result.errors?.scheduled_publish_at?.[0]).toBe("Informe a data do agendamento.");
    expect(state.calls).not.toContain("insert");
  });

  it("agendado com data passada é rejeitado", async () => {
    const result = await createPost({}, form({ status: "scheduled", scheduled_publish_at: PAST }));
    expect(result.errors?.scheduled_publish_at?.[0]).toBe("A data de agendamento deve estar no futuro.");
    expect(state.calls).not.toContain("insert");
  });

  it("agendado com data futura é aceito", async () => {
    await expect(createPost({}, form({ status: "scheduled", scheduled_publish_at: FUTURE }))).rejects.toThrow("NEXT_REDIRECT:/admin/posts");
    expect(state.calls).toContain("insert");
    expect(events()).toContain("admin_post_created");
  });

  it("rascunho e publicado não exigem data de agendamento", async () => {
    await expect(createPost({}, form({ status: "draft" }))).rejects.toThrow("NEXT_REDIRECT");
    await expect(createPost({}, form({ status: "published" }))).rejects.toThrow("NEXT_REDIRECT");
  });
});

describe("updatePost — agendamento e linhas afetadas", () => {
  it("rascunho -> agendado com data passada é rejeitado sem atualizar", async () => {
    const result = await updatePost("p1", {}, form({ status: "scheduled", scheduled_publish_at: PAST }));
    expect(result.errors?.scheduled_publish_at?.[0]).toBe("A data de agendamento deve estar no futuro.");
    expect(state.calls).not.toContain("update");
  });

  it("já agendado com data inalterada e vencida (histórico) é aceito", async () => {
    // O banco devolve +00:00; o formulário envia o horário de Brasília sem segundos (D1).
    state.existing = { status: "scheduled", published_at: null, scheduled_publish_at: "2020-01-01T13:00:00+00:00" };
    await expect(
      updatePost("p1", {}, form({ status: "scheduled", scheduled_publish_at: PAST })),
    ).rejects.toThrow("NEXT_REDIRECT:/admin/posts");
    expect(state.calls).toContain("update");
    expect(events()).toContain("admin_post_updated");
  });

  it("já agendado com data alterada para o passado é rejeitado", async () => {
    state.existing = { status: "scheduled", published_at: null, scheduled_publish_at: "2099-01-01T13:00:00+00:00" };
    const result = await updatePost("p1", {}, form({ status: "scheduled", scheduled_publish_at: PAST }));
    expect(result.errors?.scheduled_publish_at).toBeDefined();
    expect(state.calls).not.toContain("update");
  });

  it("D8: post inexistente devolve erro e NÃO audita sucesso", async () => {
    state.existing = null;
    const result = await updatePost("p1", {}, form({}));
    expect(result.message).toMatch(/não encontrado/i);
    expect(events()).toContain("admin_post_update_not_found");
    expect(events()).not.toContain("admin_post_updated");
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("D8: UPDATE com zero linhas afetadas devolve erro e NÃO audita sucesso", async () => {
    state.updateRows = [];
    const result = await updatePost("p1", {}, form({}));
    expect(result.message).toMatch(/não encontrado/i);
    expect(events()).not.toContain("admin_post_updated");
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("atualização normal com uma linha audita sucesso e redireciona", async () => {
    await expect(updatePost("p1", {}, form({}))).rejects.toThrow("NEXT_REDIRECT:/admin/posts");
    expect(events()).toEqual(["admin_post_updated"]);
  });
});

describe("deletePost — só audita sucesso com a linha removida (RF-CMS-11, T-CMS-U06)", () => {
  it("zero linhas: erro, sem admin_post_deleted e sem redirecionar", async () => {
    state.deleteRows = [];
    const result = await deletePost("p1");
    expect(result).toEqual({ ok: false, message: expect.stringMatching(/não encontrado/i) });
    expect(events()).toEqual(["admin_post_delete_not_found"]);
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("erro do banco: admin_post_delete_error e nenhum sucesso", async () => {
    state.deleteRows = [];
    state.deleteError = { code: "42501" };
    const result = await deletePost("p1");
    expect(result).toEqual({ ok: false, message: expect.stringMatching(/erro ao excluir/i) });
    expect(events()).toEqual(["admin_post_delete_error"]);
  });

  it("uma linha: audita admin_post_deleted e redireciona", async () => {
    await expect(deletePost("p1")).rejects.toThrow("NEXT_REDIRECT:/admin/posts");
    expect(events()).toEqual(["admin_post_deleted"]);
  });
});
