import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/admin/(protected)/leads/actions", () => ({
  updateLeadStatus: vi.fn(),
  setLeadNextAction: vi.fn(),
  addLeadNote: vi.fn(),
  archiveLead: vi.fn(),
  restoreLead: vi.fn(),
  deleteLead: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { DeleteLeadDialog } from "@/components/admin/leads/DeleteLeadDialog";
import { LeadNotes } from "@/components/admin/leads/LeadNotes";
import { LeadTimeline, describeActivity } from "@/components/admin/leads/LeadTimeline";
import { LeadsList } from "@/components/admin/leads/LeadsList";
import type { LeadActivity, LeadListItem, LeadNote } from "@/lib/types/lead";

const now = new Date("2026-10-20T12:00:00.000Z");

function lead(overrides: Partial<LeadListItem>): LeadListItem {
  return {
    id: "450ceabd-d97d-484a-b927-00bce606e87a",
    name: "Lead Sintético",
    company: "RC2 Teste",
    email: "sintetico@example.invalid",
    whatsapp: "0000000000",
    segment: "teste",
    size: "teste",
    solution: "E-commerce",
    created_at: "2026-01-15T12:00:00.000Z",
    status: "new",
    next_action: null,
    next_action_at: null,
    archived_at: null,
    updated_at: "2026-01-15T12:00:00.000000+00:00",
    ...overrides,
  };
}

describe("LeadsList", () => {
  it("mostra status por texto, link para o detalhe e solução; sem e-mail nem telefone na lista", () => {
    const { container } = render(<LeadsList items={[lead({ status: "contacted" })]} now={now} />);
    expect(screen.getAllByText("Contatado").length).toBeGreaterThan(0);
    const links = screen.getAllByRole("link", { name: "Lead Sintético" });
    expect(links[0]).toHaveAttribute("href", "/admin/leads/450ceabd-d97d-484a-b927-00bce606e87a");
    expect(container.textContent).not.toContain("sintetico@example.invalid");
    expect(container.textContent).not.toContain("0000000000");
  });

  it("solução histórica aparece como Outros", () => {
    render(<LeadsList items={[lead({ solution: "Opção antiga" })]} now={now} />);
    expect(screen.getAllByText("Outros").length).toBeGreaterThan(0);
  });

  it("próxima ação vencida é sinalizada por texto; arquivado também", () => {
    render(
      <LeadsList
        items={[lead({ next_action: "Ligar", next_action_at: "2026-10-19T12:00:00.000Z" }), lead({ id: "b", name: "B", archived_at: "2026-10-01T00:00:00Z" })]}
        now={now}
      />,
    );
    expect(screen.getAllByText("Vencida").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Arquivado").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ligar").length).toBeGreaterThan(0);
  });

  it("próxima ação futura não é vencida", () => {
    render(<LeadsList items={[lead({ next_action: "Ligar", next_action_at: "2026-10-25T12:00:00.000Z" })]} now={now} />);
    expect(screen.queryByText("Vencida")).toBeNull();
  });
});

describe("LeadNotes e LeadTimeline", () => {
  const note = (over: Partial<LeadNote>): LeadNote => ({
    id: "n1",
    lead_id: "l1",
    author_id: "u1",
    body: "<script>alert(1)</script>\nlinha 2",
    created_at: "2026-10-20T12:00:00.000Z",
    ...over,
  });

  it("renderiza o corpo da nota como texto (nunca HTML) e identifica o autor sem dados pessoais", () => {
    const { container } = render(
      <LeadNotes
        leadId="l1"
        notes={[note({}), note({ id: "n2", author_id: "u2" }), note({ id: "n3", author_id: null })]}
        truncated={false}
        currentUserId="u1"
      />,
    );
    expect(container.querySelector("script")).toBeNull();
    expect(screen.getAllByText(/<script>alert\(1\)<\/script>/).length).toBe(3);
    expect(screen.getByText(/Você ·/)).toBeInTheDocument();
    expect(screen.getByText(/Outro administrador ·/)).toBeInTheDocument();
    expect(screen.getByText(/Usuário removido ·/)).toBeInTheDocument();
  });

  it("lista vazia e aviso de truncamento", () => {
    render(<LeadNotes leadId="l1" notes={[]} truncated currentUserId={null} />);
    expect(screen.getByText("Nenhuma nota ainda.")).toBeInTheDocument();
    expect(screen.getByText(/há notas mais antigas/)).toBeInTheDocument();
  });

  it("histórico descreve cada tipo de evento e nunca mostra texto de próxima ação", () => {
    const base = { lead_id: "l1", actor_id: "u1", created_at: "2026-10-20T12:00:00.000Z" };
    const events: LeadActivity[] = [
      { ...base, id: "1", kind: "status_changed", from_value: "new", to_value: "qualified" },
      { ...base, id: "2", kind: "next_action_changed", from_value: null, to_value: null },
      { ...base, id: "3", kind: "archived", from_value: null, to_value: null },
      { ...base, id: "4", kind: "restored", from_value: null, to_value: null },
    ];
    expect(events.map(describeActivity)).toEqual([
      "Status alterado de Novo para Qualificado",
      "Próxima ação alterada",
      "Lead arquivado",
      "Lead restaurado",
    ]);
    render(<LeadTimeline activity={events} truncated={false} currentUserId="u1" />);
    expect(within(screen.getByRole("region", { name: "Histórico" })).getAllByRole("listitem")).toHaveLength(4);
  });
});

describe("DeleteLeadDialog (RF-LEAD-07)", () => {
  it("o botão de confirmar só habilita com a palavra EXCLUIR literal", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    render(<DeleteLeadDialog leadId="l1" leadLabel="Lead Sintético" />);
    const input = screen.getByLabelText(/Digite EXCLUIR/, { selector: "input" });
    const confirm = screen.getAllByRole("button", { name: "Excluir permanentemente", hidden: true }).at(-1)!;
    expect(confirm).toBeDisabled();
    const user = userEvent.setup();
    await user.type(input, "excluir");
    expect(confirm).toBeDisabled();
    await user.clear(input);
    await user.type(input, "EXCLUIR");
    expect(confirm).toBeEnabled();
  });
});
