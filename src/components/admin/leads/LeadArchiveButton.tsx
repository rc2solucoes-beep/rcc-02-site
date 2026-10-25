"use client";

import { useState, useTransition } from "react";
import { archiveLead, restoreLead } from "@/app/admin/(protected)/leads/actions";
import type { LeadMutationResult } from "@/lib/types/lead";
import { LeadFeedback, leadSecondaryButtonClass } from "./LeadFeedback";

export function LeadArchiveButton({
  leadId,
  archived,
  expectedUpdatedAt,
}: {
  leadId: string;
  archived: boolean;
  expectedUpdatedAt: string;
}) {
  const [result, setResult] = useState<LeadMutationResult | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending}
        className={leadSecondaryButtonClass}
        onClick={() => {
          setResult(null);
          start(async () => {
            const input = { id: leadId, expectedUpdatedAt };
            setResult(await (archived ? restoreLead(input) : archiveLead(input)));
          });
        }}
      >
        {pending ? "Aguarde…" : archived ? "Restaurar lead" : "Arquivar lead"}
      </button>
      <LeadFeedback result={result} />
    </div>
  );
}
