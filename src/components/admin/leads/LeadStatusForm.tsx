"use client";

import { useState, useTransition } from "react";
import { updateLeadStatus } from "@/app/admin/(protected)/leads/actions";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type LeadMutationResult, type LeadStatus } from "@/lib/types/lead";
import { LeadFeedback, leadFieldClass, leadLabelClass, leadPrimaryButtonClass } from "./LeadFeedback";

export function LeadStatusForm({
  leadId,
  status,
  expectedUpdatedAt,
}: {
  leadId: string;
  status: LeadStatus;
  expectedUpdatedAt: string;
}) {
  const [value, setValue] = useState<LeadStatus>(status);
  const [result, setResult] = useState<LeadMutationResult | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        setResult(null);
        start(async () => setResult(await updateLeadStatus({ id: leadId, status: value, expectedUpdatedAt })));
      }}
    >
      <label htmlFor="lead-status" className={leadLabelClass}>
        Status
      </label>
      <div className="flex gap-2">
        <select
          id="lead-status"
          value={value}
          onChange={(event) => setValue(event.target.value as LeadStatus)}
          disabled={pending}
          className={leadFieldClass}
        >
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {LEAD_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <button type="submit" disabled={pending || value === status} className={leadPrimaryButtonClass}>
          {pending ? "Salvando…" : "Salvar"}
        </button>
      </div>
      <LeadFeedback result={result} />
    </form>
  );
}
