import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useEditorMock = vi.fn();

vi.mock("@tiptap/react", () => ({
  useEditor: (...args: unknown[]) => useEditorMock(...args),
  EditorContent: ({ editor }: { editor: { options: { editorProps?: { attributes?: Record<string, string> } } } }) =>
    createElement("div", {
      "data-testid": "editor-content",
      ...(editor.options.editorProps?.attributes ?? {}),
    }),
}));

vi.mock("@tiptap/starter-kit", () => ({
  default: {
    configure: vi.fn(() => ({ name: "starter-kit" })),
  },
}));

vi.mock("@tiptap/extension-placeholder", () => ({
  default: {
    configure: vi.fn(() => ({ name: "placeholder" })),
  },
}));

vi.mock("@tiptap/extension-image", () => ({
  default: { name: "image" },
}));

vi.mock("@/components/admin/LinkEditorDialog", () => ({
  LinkEditorDialog: () => createElement("div", { "data-testid": "link-editor-dialog" }),
}));

import { RichEditor } from "@/components/admin/RichEditor";

type EditorOptions = {
  editorProps?: {
    attributes?: Record<string, string>;
  };
};

function createEditorMock() {
  const chain = {
    focus: vi.fn(() => chain),
    toggleBold: vi.fn(() => chain),
    toggleItalic: vi.fn(() => chain),
    toggleStrike: vi.fn(() => chain),
    toggleCode: vi.fn(() => chain),
    toggleHeading: vi.fn(() => chain),
    toggleBulletList: vi.fn(() => chain),
    toggleOrderedList: vi.fn(() => chain),
    toggleBlockquote: vi.fn(() => chain),
    setHorizontalRule: vi.fn(() => chain),
    undo: vi.fn(() => chain),
    redo: vi.fn(() => chain),
    extendMarkRange: vi.fn(() => chain),
    setLink: vi.fn(() => chain),
    unsetLink: vi.fn(() => chain),
    deleteSelection: vi.fn(() => chain),
    run: vi.fn(() => true),
  };

  return {
    options: {
      editorProps: {
        attributes: {} as Record<string, string>,
      },
    },
    chain: vi.fn(() => chain),
    commands: {
      setContent: vi.fn(),
    },
    state: {
      selection: { from: 0, to: 0 },
      doc: { textBetween: vi.fn(() => "") },
    },
    getAttributes: vi.fn(() => ({ href: "" })),
    getHTML: vi.fn(() => "<p>Conteudo inicial</p>"),
    isActive: vi.fn((name: string, attrs?: { level?: number }) => {
      if (name === "bold" || name === "link") return true;
      if (name === "heading" && attrs?.level === 2) return true;
      return false;
    }),
    setOptions: vi.fn((options: EditorOptions) => {
      if (options.editorProps?.attributes) {
        editor.options.editorProps = { attributes: options.editorProps.attributes };
      }
    }),
  };
}

let editor: ReturnType<typeof createEditorMock>;

beforeEach(() => {
  editor = createEditorMock();
  useEditorMock.mockReset();
  useEditorMock.mockImplementation((options?: EditorOptions) => {
    if (options?.editorProps) {
      editor.options.editorProps = {
        attributes: options.editorProps.attributes ?? {},
      };
    }
    return editor;
  });
});

describe("RichEditor", () => {
  it("exposes pressed state for active formatting controls", () => {
    render(
      createElement(RichEditor, {
        content: "<p>Conteudo inicial</p>",
        onChange: vi.fn(),
      })
    );

    expect(screen.getAllByRole("button", { name: "Negrito" })[0]).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByRole("button", { name: "Itálico" })[0]).toHaveAttribute("aria-pressed", "false");
    expect(screen.getAllByRole("button", { name: "Título H2" })[0]).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByRole("button", { name: "Link" })[0]).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByRole("button", { name: "Desfazer" })[0]).not.toHaveAttribute("aria-pressed");
  });

  it("applies aria props through the editor attributes path and updates them", () => {
    const { rerender } = render(
      createElement(RichEditor, {
        content: "<p>Conteudo inicial</p>",
        onChange: vi.fn(),
        ariaLabelledBy: "editor-label",
        ariaDescribedBy: "editor-help",
        ariaInvalid: true,
      })
    );

    expect(useEditorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        editorProps: {
          attributes: expect.objectContaining({
            "aria-labelledby": "editor-label",
            "aria-describedby": "editor-help",
            "aria-invalid": "true",
          }),
        },
      })
    );
    expect(screen.getByTestId("editor-content")).toHaveAttribute("aria-labelledby", "editor-label");
    expect(screen.getByTestId("editor-content")).toHaveAttribute("aria-describedby", "editor-help");
    expect(screen.getByTestId("editor-content")).toHaveAttribute("aria-invalid", "true");

    rerender(
      createElement(RichEditor, {
        content: "<p>Conteudo inicial</p>",
        onChange: vi.fn(),
        ariaLabelledBy: "editor-label-next",
        ariaInvalid: false,
      })
    );

    expect(editor.setOptions).toHaveBeenLastCalledWith({
      editorProps: {
        attributes: expect.objectContaining({
          "aria-labelledby": "editor-label-next",
          "aria-invalid": "false",
        }),
      },
    });
    expect(editor.setOptions).toHaveBeenLastCalledWith(
      expect.objectContaining({
        editorProps: {
          attributes: expect.not.objectContaining({
            "aria-describedby": expect.anything(),
          }),
        },
      })
    );
  });
});
