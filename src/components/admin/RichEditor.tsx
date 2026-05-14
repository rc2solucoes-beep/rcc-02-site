"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import { useEffect, useState } from "react";
import {
  Bold, Italic, Strikethrough, Code, Heading2, Heading3,
  List, ListOrdered, Quote, Minus, Undo, Redo, Link as LinkIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LinkEditorDialog } from "./LinkEditorDialog";

interface RichEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

function ToolbarButton({
  onClick,
  active,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "p-1.5 rounded text-sm transition-colors",
        active
          ? "bg-rc2-orange text-white"
          : "text-rc2-ebony/70 hover:text-rc2-ebony hover:bg-zinc-100"
      )}
    >
      {children}
    </button>
  );
}

export function RichEditor({ content, onChange, placeholder = "Escreva o conteúdo do post..." }: RichEditorProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [initialUrl, setInitialUrl] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false },
      }),
      Placeholder.configure({ placeholder }),
      Image,
    ],
    content,
    immediatelyRender: false,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-64 px-4 py-3 focus:outline-none text-rc2-ebony",
      },
    },
  });

  // Sync external content changes (e.g., loading from DB)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [editor, content]);

  if (!editor) return null;

  const openLinkDialog = () => {
    // Get selected text or current link
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to);
    const isLink = editor.isActive("link");
    const currentLink = isLink ? editor.getAttributes("link").href : "";

    setSelectedText(text || "");
    setInitialUrl(currentLink);
    setDialogOpen(true);
  };

  const handleSaveLink = (url: string, openInNewTab: boolean) => {
    const linkAttrs = {
      href: url,
      ...(openInNewTab && { target: "_blank", rel: "noopener noreferrer" }),
    };

    editor.chain().focus().extendMarkRange("link").setLink(linkAttrs).run();
  };

  const handleRemoveLink = () => {
    editor.chain().focus().unsetLink().run();
  };

  const handleDeleteAll = () => {
    editor.chain().focus().unsetLink().run();
    editor.chain().focus().deleteSelection().run();
  };

  return (
    <>
      <LinkEditorDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveLink}
        onRemove={handleRemoveLink}
        onDelete={handleDeleteAll}
        initialUrl={initialUrl}
        selectedText={selectedText}
      />
      <div className="border border-border rounded-none overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-border bg-zinc-50">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Negrito">
          <Bold size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Itálico">
          <Italic size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Tachado">
          <Strikethrough size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Código inline">
          <Code size={15} />
        </ToolbarButton>

        <span className="w-px h-5 bg-border mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Título H2">
          <Heading2 size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Título H3">
          <Heading3 size={15} />
        </ToolbarButton>

        <span className="w-px h-5 bg-border mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Lista">
          <List size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Lista numerada">
          <ListOrdered size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Citação">
          <Quote size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divisor">
          <Minus size={15} />
        </ToolbarButton>

        <span className="w-px h-5 bg-border mx-1" />

        <ToolbarButton onClick={openLinkDialog} active={editor.isActive("link")} title="Link">
          <LinkIcon size={15} />
        </ToolbarButton>

        <span className="w-px h-5 bg-border mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Desfazer">
          <Undo size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Refazer">
          <Redo size={15} />
        </ToolbarButton>
      </div>

        {/* Editor area */}
        <EditorContent editor={editor} />
      </div>
    </>
  );
}
