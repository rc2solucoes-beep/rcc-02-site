"use client";

import { useId, useState } from "react";
import { RichEditor } from "@/components/admin/RichEditor";

interface PostContentEditorProps {
  content: string;
  onChange: (value: string) => void;
  error?: string;
}

const htmlModeWarning =
  "Use este modo para colar HTML do corpo do artigo. Não inclua html, head, body, script, style, iframe, form ou inputs. O conteúdo publicado continuará sujeito à sanitização pública.";

export function PostContentEditor({
  content,
  onChange,
  error,
}: PostContentEditorProps) {
  const [mode, setMode] = useState<"visual" | "html">("visual");
  const textareaId = useId();
  const labelId = `${textareaId}-label`;
  const warningId = `${textareaId}-warning`;
  const errorId = `${textareaId}-error`;
  const visualDescribedBy = error ? errorId : undefined;
  const textareaDescribedBy = [warningId, error ? errorId : null].filter(Boolean).join(" ");

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label id={labelId} htmlFor={mode === "html" ? textareaId : undefined} className="text-sm font-medium">
          Conteúdo do Artigo
        </label>
      </div>

      <div
        className="inline-flex rounded-md border border-border p-1"
        role="group"
        aria-label="Modo do editor de conteúdo"
      >
        <button
          type="button"
          aria-pressed={mode === "visual"}
          className="rounded px-3 py-1.5 text-sm"
          onClick={() => setMode("visual")}
        >
          Visual
        </button>
        <button
          type="button"
          aria-pressed={mode === "html"}
          className="rounded px-3 py-1.5 text-sm"
          onClick={() => setMode("html")}
        >
          HTML
        </button>
      </div>

      {mode === "visual" ? (
        <RichEditor
          content={content}
          onChange={onChange}
          ariaLabelledBy={labelId}
          ariaDescribedBy={visualDescribedBy}
          ariaInvalid={Boolean(error)}
        />
      ) : (
        <div className="space-y-2">
          <p id={warningId} className="text-sm text-amber-700">
            {htmlModeWarning}
          </p>
          <textarea
            id={textareaId}
            value={content}
            onChange={(event) => onChange(event.target.value)}
            className="min-h-64 w-full rounded-md border border-border px-3 py-2 font-mono text-sm"
            aria-invalid={error ? "true" : "false"}
            aria-labelledby={labelId}
            aria-describedby={textareaDescribedBy}
          />
        </div>
      )}

      {error ? (
        <p id={errorId} className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
