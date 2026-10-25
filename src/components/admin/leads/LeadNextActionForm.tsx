"use client";

import { useState, useTransition } from "react";
import { setLeadNextAction } from "@/app/admin/(protected)/leads/actions";
import { utcIsoToSaoPauloInput } from "@/lib/datetime";
import { LEAD_NEXT_ACTION_MAX_LENGTH, type LeadMutationResult } from "@/lib/types/lead";
import { LeadFeedback, leadFieldClass, leadLabelClass, leadPrimaryButtonClass } from "./LeadFeedback";

export function LeadNextActionForm({
  leadId,
  nextAction,
  nextActionAt,
  expectedUpdatedAt,
}: {
  leadId: string;
  nextAction: string | null;
  nextActionAt: string | null;
  expectedUpdatedAt: string;
}) {
  const [action, setAction] = useState(nextAction ?? "");
  const [at, setAt] = useState(nextActionAt ? utcIsoToSaoPauloInput(nextActionAt) : "");
  const [result, setResult] = useState<LeadMutationResult | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        setResult(null);
        start(async () =>
          setResult(await setLeadNextAction({ id: leadId, nextAction: action, nextActionAt: at, expectedUpdatedAt })),
        );
      }}
    >
      <div>
        <label htmlFor="lead-next-action" className={leadLabelClass}>
          Próxima ação
        </label>
        <input
          id="lead-next-action"
          value={action}
          onChange={(event) => setAction(event.target.value)}
          maxLength={LEAD_NEXT_ACTION_MAX_LENGTH}
          placeholder="Ex.: ligar para agendar a conversa"
          disabled={pending}
          className={leadFieldClass}
        />
      </div>
      <div>
        <label htmlFor="lead-next-action-at" className={leadLabelClass}>
          Quando (horário de Brasília)
        </label>
        <input
          id="lead-next-action-at"
          type="datetime-local"
          value={at}
          onChange={(event) => setAt(event.target.value)}
          disabled={pending}
          className={leadFieldClass}
        />
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={leadPrimaryButtonClass}>
          {pending ? "Salvando…" : "Salvar próxima ação"}
        </button>
        <LeadFeedback result={result} />
      </div>
    </form>
  );
}
