import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PublicationTab } from "@/components/admin/PostFormTabs/PublicationTab";

const formData = {
  status: "draft",
  scheduled_publish_at: "",
  category: "",
  content_type: "",
  tags: "",
  reading_time_minutes: "",
};

// T-CMS-U09 (RF-CMS-12): published_at e updated_at são informação, não campos de formulário.
describe("PublicationTab — datas somente leitura", () => {
  it("não renderiza nenhum input/campo nomeado published_at ou updated_at", () => {
    const { container } = render(
      <PublicationTab formData={formData} onChange={() => {}} publishedAt="13/10/2026 14:30" updatedAt="14/10/2026 09:00" />,
    );
    expect(container.querySelector('[name="published_at"]')).toBeNull();
    expect(container.querySelector('[name="updated_at"]')).toBeNull();
    expect(container.querySelector("#published_at")).toBeNull();
    expect(container.querySelector("#updated_at")).toBeNull();
  });

  it("mostra os valores quando existem", () => {
    render(<PublicationTab formData={formData} onChange={() => {}} publishedAt="13/10/2026 14:30" updatedAt="14/10/2026 09:00" />);
    expect(screen.getByText("Publicado em")).toBeInTheDocument();
    expect(screen.getByText("13/10/2026 14:30")).toBeInTheDocument();
    expect(screen.getByText("Atualizado em")).toBeInTheDocument();
    expect(screen.getByText("14/10/2026 09:00")).toBeInTheDocument();
  });

  it("omite 'Publicado em' enquanto o post nunca foi publicado e tudo na criação", () => {
    const { rerender } = render(<PublicationTab formData={formData} onChange={() => {}} publishedAt={null} updatedAt="14/10/2026 09:00" />);
    expect(screen.queryByText("Publicado em")).not.toBeInTheDocument();
    expect(screen.getByText("Atualizado em")).toBeInTheDocument();
    rerender(<PublicationTab formData={formData} onChange={() => {}} />);
    expect(screen.queryByText("Atualizado em")).not.toBeInTheDocument();
  });

  it("o agendamento continua editável e o texto auxiliar descreve a regra real", () => {
    render(<PublicationTab formData={formData} onChange={() => {}} />);
    expect(screen.getByLabelText(/Agendar Publicação Para/i)).toHaveAttribute("name", "scheduled_publish_at");
    expect(screen.getByText(/deve estar no futuro/i)).toBeInTheDocument();
    expect(screen.queryByText(/publicar manualmente/i)).not.toBeInTheDocument();
  });
});
