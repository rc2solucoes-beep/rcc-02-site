"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
          ? "bg-rc2-orange text-rc2-heading"
          : "text-rc2-ebony/70 hover:text-rc2-ebony hover:bg-zinc-100"
      )}
    >
      {children}
    </button>
  );
}

interface EditorToolbarProps {
  editor: ReturnType<typeof useEditor>;
  onLinkClick: () => void;
}

function EditorToolbar({ editor, onLinkClick }: EditorToolbarProps) {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-2 border-border bg-zinc-50">
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

      <ToolbarButton onClick={onLinkClick} active={editor.isActive("link")} title="Link">
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
  );
}

interface DialogState {
  isOpen: boolean;
  selectedText: string;
  initialUrl: string;
}

export function RichEditor({
  content,
  onChange,
  placeholder = "Escreva o conteúdo do post...",
}: RichEditorProps) {
  const [dialog, setDialog] = useState<DialogState>({
    isOpen: false,
    selectedText: "",
    initialUrl: "",
  });

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

    // Update all dialog state in one call to prevent re-render issues
    setDialog({
      isOpen: true,
      selectedText: text || "",
      initialUrl: currentLink,
    });
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

  const linkDialog = (
    <LinkEditorDialog
      isOpen={dialog.isOpen}
      onClose={() => setDialog(prev => ({ ...prev, isOpen: false }))}
      onSave={handleSaveLink}
      onRemove={handleRemoveLink}
      onDelete={handleDeleteAll}
      initialUrl={dialog.initialUrl}
      selectedText={dialog.selectedText}
    />
  );

  return (
    <>
      {/* Portal: renders dialog in document.body, completely outside TipTap's DOM tree */}
      {typeof document !== "undefined" && createPortal(linkDialog, document.body)}
      <div className="border border-border rounded overflow-hidden">
        {/* Top Toolbar */}
        <div className="border-b border-border">
          <EditorToolbar editor={editor} onLinkClick={openLinkDialog} />
        </div>

        {/* Editor area */}
        <EditorContent editor={editor} />

        {/* Bottom Toolbar */}
        <div className="border-t border-border">
          <EditorToolbar editor={editor} onLinkClick={openLinkDialog} />
        </div>
      </div>
    </>
  );
}
