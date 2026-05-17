import { createElement, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PostContentEditor } from "@/components/admin/PostContentEditor";

vi.mock("@/components/admin/RichEditor", () => ({
  RichEditor: ({
    content,
    onChange,
  }: {
    content: string;
    onChange: (value: string) => void;
  }) =>
    createElement(
      "div",
      { "data-testid": "rich-editor" },
      createElement("output", { "data-testid": "rich-editor-content" }, content),
      createElement(
        "button",
        {
          type: "button",
          onClick: () => onChange("<p>updated in visual mode</p>"),
        },
        "Mock RichEditor change"
      )
    ),
}));

const htmlModeWarning =
  "Use este modo para colar HTML do corpo do artigo. Não inclua html, head, body, script, style, iframe, form ou inputs. O conteúdo publicado continuará sujeito à sanitização pública.";
const contentLabel = "Conteúdo do Artigo";

describe("PostContentEditor", () => {
  it("renders in Visual mode by default", () => {
    const handleChange = vi.fn();

    render(createElement(PostContentEditor, { content: "<p>Conteudo inicial</p>", onChange: handleChange }));

    expect(screen.getByRole("button", { name: "Visual" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "HTML" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("rich-editor")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Visual" })).toHaveClass("bg-rc2-orange", "text-white");
    expect(screen.getByRole("button", { name: "HTML" })).not.toHaveClass("bg-rc2-orange", "text-white");
    expect(screen.getByTestId("rich-editor-content")).toHaveTextContent("<p>Conteudo inicial</p>");
    expect(screen.queryByDisplayValue("<p>Conteudo inicial</p>")).not.toBeInTheDocument();

    screen.getByRole("button", { name: "Mock RichEditor change" }).click();

    expect(handleChange).toHaveBeenCalledWith("<p>updated in visual mode</p>");
  });

  it("switches to HTML mode and preserves the controlled content string", async () => {
    const user = userEvent.setup();
    const content = "<h2>Titulo</h2><p>Corpo <strong>rico</strong></p>";

    render(createElement(PostContentEditor, { content, onChange: vi.fn() }));

    await user.click(screen.getByRole("button", { name: "HTML" }));

    const textarea = screen.getByRole("textbox", { name: contentLabel });
    const warning = screen.getByText(htmlModeWarning);

    expect(screen.getByRole("button", { name: "HTML" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "HTML" })).toHaveClass("bg-rc2-orange", "text-white");
    expect(screen.getByRole("button", { name: "Visual" })).not.toHaveClass("bg-rc2-orange", "text-white");
    expect(textarea).toHaveValue(content);
    expect(textarea).toHaveAccessibleName(contentLabel);
    expect(textarea).toHaveAttribute("aria-describedby", warning.id);
    expect(textarea).toHaveAttribute("aria-invalid", "false");
    expect(textarea).toHaveClass("min-h-[520px]", "resize-y", "font-mono", "leading-relaxed", "bg-rc2-sand");
    expect(screen.queryByTestId("rich-editor")).not.toBeInTheDocument();
  });

  it("feeds edited HTML back into Visual mode after a mode round-trip", async () => {
    const user = userEvent.setup();
    const editedContent = "<section><h2>Novo bloco</h2><p>HTML editado</p></section>";

    const { rerender } = render(
      createElement(PostContentEditor, { content: "<p>Inicial</p>", onChange: vi.fn() })
    );

    await user.click(screen.getByRole("button", { name: "HTML" }));
    await user.clear(screen.getByRole("textbox"));
    await user.type(screen.getByRole("textbox"), editedContent);

    rerender(createElement(PostContentEditor, { content: editedContent, onChange: vi.fn() }));

    await user.click(screen.getByRole("button", { name: "Visual" }));

    expect(screen.getByTestId("rich-editor")).toBeInTheDocument();
    expect(screen.getByTestId("rich-editor-content")).toHaveTextContent(editedContent);
  });

  it("propagates raw HTML textarea changes", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    const rawHtml = "<section><h2>Novo bloco</h2><script>alert('xss')</script></section>";

    function ControlledHarness() {
      const [content, setContent] = useState("<p>Inicial</p>");

      return createElement(PostContentEditor, {
        content,
        onChange: (value) => {
          handleChange(value);
          setContent(value);
        },
      });
    }

    render(createElement(ControlledHarness));

    await user.click(screen.getByRole("button", { name: "HTML" }));
    await user.clear(screen.getByRole("textbox"));
    await user.type(screen.getByRole("textbox"), rawHtml);

    expect(screen.getByRole("textbox")).toHaveValue(rawHtml);
    expect(handleChange).toHaveBeenLastCalledWith(rawHtml);
  });

  it("renders an optional error message and exposes HTML-mode error accessibility state", async () => {
    const user = userEvent.setup();

    render(
      createElement(PostContentEditor, {
        content: "<p>Conteudo inicial</p>",
        onChange: vi.fn(),
        error: "Conteúdo é obrigatório.",
      })
    );

    const error = screen.getByText("Conteúdo é obrigatório.");

    expect(error).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "HTML" }));

    const textarea = screen.getByRole("textbox", { name: contentLabel });
    const warning = screen.getByText(htmlModeWarning);

    expect(textarea).toHaveAttribute("aria-describedby", `${warning.id} ${error.id}`);
    expect(textarea).toHaveAttribute("aria-invalid", "true");
  });

  it("shows the exact HTML mode warning copy", async () => {
    const user = userEvent.setup();

    render(createElement(PostContentEditor, { content: "<p>Conteudo inicial</p>", onChange: vi.fn() }));

    expect(screen.queryByText(htmlModeWarning)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "HTML" }));

    expect(screen.getByText(htmlModeWarning)).toBeInTheDocument();
  });
});
