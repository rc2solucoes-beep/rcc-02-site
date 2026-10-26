"use client";

import { useState, useTransition } from "react";
import { addLeadNote } from "@/app/admin/(protected)/leads/actions";
import { LEAD_NOTE_MAX_LENGTH, type LeadMutationResult } from "@/lib/types/lead";
import { LeadFeedback, leadFieldClass, leadLabelClass, leadPrimaryButtonClass } from "./LeadFeedback";

/** Nota append-only: sem edição nem exclusão (a RLS e os privilégios impedem). */
export function LeadNoteForm({ leadId }: { leadId: string }) {
  const [body, setBody] = useState("");
  const [result, setResult] = useState<LeadMutationResult | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        setResult(null);
        start(async () => {
          const outcome = await addLeadNote({ id: leadId, body });
          setResult(outcome);
          if (outcome.ok) setBody("");
        });
      }}
    >
      <label htmlFor="lead-note" className={leadLabelClass}>
        Nova nota
      </label>
      <textarea
        id="lead-note"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        maxLength={LEAD_NOTE_MAX_LENGTH}
        rows={3}
        disabled={pending}
        className={leadFieldClass}
      />
      <div className="flex items-center justify-between gap-3">
        <button type="submit" disabled={pending || body.trim() === ""} className={leadPrimaryButtonClass}>
          {pending ? "Salvando…" : "Adicionar nota"}
        </button>
        <span className="text-xs text-rc2-text-secondary">
          {Array.from(body).length}/{LEAD_NOTE_MAX_LENGTH}
        </span>
      </div>
      <LeadFeedback result={result} />
    </form>
  );
}
