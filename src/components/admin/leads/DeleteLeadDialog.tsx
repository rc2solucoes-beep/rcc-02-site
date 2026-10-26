"use client";

import { useRef, useState, useTransition } from "react";
import { deleteLead } from "@/app/admin/(protected)/leads/actions";
import { LEAD_DELETE_CONFIRMATION, type LeadMutationResult } from "@/lib/types/lead";
import { LeadFeedback, leadFieldClass, leadLabelClass, leadSecondaryButtonClass } from "./LeadFeedback";

const dangerButtonClass =
  "inline-flex items-center justify-center px-4 py-2 border border-rc2-error bg-rc2-surface text-rc2-error text-sm font-medium hover:bg-rc2-surface-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

/** Exclusão permanente: exige digitar EXCLUIR (e o servidor confere de novo). Sucesso redireciona à lista. */
export function DeleteLeadDialog({ leadId, leadLabel }: { leadId: string; leadLabel: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState<LeadMutationResult | null>(null);
  const [pending, start] = useTransition();

  const close = () => {
    dialog.current?.close();
    setTyped("");
    setResult(null);
  };

  return (
    <>
      <button type="button" className={dangerButtonClass} onClick={() => dialog.current?.showModal()}>
        Excluir permanentemente
      </button>
      <dialog
        ref={dialog}
        aria-labelledby="delete-lead-title"
        className="w-[min(32rem,calc(100vw-2rem))] border border-rc2-border bg-rc2-surface p-6 text-rc2-text backdrop:bg-rc2-dark/60"
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setResult(null);
            start(async () => {
              const outcome = await deleteLead({ id: leadId, confirmation: typed });
              // Em sucesso o servidor redireciona; só chegam aqui as falhas.
              if (outcome) setResult(outcome);
            });
          }}
        >
          <h2 id="delete-lead-title" className="text-lg font-semibold text-rc2-heading">
            Excluir lead permanentemente
          </h2>
          <p className="text-sm">
            Você vai excluir <strong>{leadLabel}</strong>. As notas e o histórico deste lead também serão apagados.
            Esta ação não pode ser desfeita.
          </p>
          <div>
            <label htmlFor="delete-lead-confirmation" className={leadLabelClass}>
              Digite {LEAD_DELETE_CONFIRMATION} para confirmar
            </label>
            <input
              id="delete-lead-confirmation"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoComplete="off"
              disabled={pending}
              className={leadFieldClass}
            />
          </div>
          <LeadFeedback result={result} />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={close} disabled={pending} className={leadSecondaryButtonClass}>
              Cancelar
            </button>
            <button type="submit" disabled={pending || typed !== LEAD_DELETE_CONFIRMATION} className={dangerButtonClass}>
              {pending ? "Excluindo…" : "Excluir permanentemente"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
