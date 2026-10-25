"use client";

import { useRouter } from "next/navigation";
import { leadMutationMessage } from "@/lib/admin/leadMessages";
import type { LeadMutationResult } from "@/lib/types/lead";

/** Resultado de uma action de leads. Em conflito oferece "Recarregar" (busca a versão atual do lead). */
export function LeadFeedback({ result }: { result: LeadMutationResult | null }) {
  const router = useRouter();
  if (!result) return <p className="min-h-5 text-xs" aria-live="polite" />;
  const { tone, text } = leadMutationMessage(result);
  const conflict = !result.ok && result.error === "conflict";
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`min-h-5 text-xs ${tone === "error" ? "text-rc2-error" : "text-rc2-text"}`}
    >
      {text}
      {conflict && (
        <button type="button" onClick={() => router.refresh()} className="ml-2 font-medium text-rc2-brand-text underline">
          Recarregar
        </button>
      )}
    </p>
  );
}

export const leadFieldClass =
  "w-full border border-rc2-border bg-rc2-surface px-3 py-2 text-sm text-rc2-text placeholder:text-rc2-text-muted disabled:opacity-60";
export const leadLabelClass = "block text-xs font-medium text-rc2-text-secondary mb-1";
export const leadPrimaryButtonClass =
  "inline-flex items-center justify-center px-4 py-2 bg-rc2-brand text-rc2-heading text-sm font-medium hover:bg-rc2-brand-hover active:bg-rc2-brand-active transition-colors disabled:opacity-60 disabled:cursor-not-allowed";
export const leadSecondaryButtonClass =
  "inline-flex items-center justify-center px-4 py-2 border border-rc2-border bg-rc2-surface text-rc2-heading text-sm font-medium hover:border-rc2-brand-text hover:text-rc2-brand-text transition-colors disabled:opacity-60 disabled:cursor-not-allowed";
