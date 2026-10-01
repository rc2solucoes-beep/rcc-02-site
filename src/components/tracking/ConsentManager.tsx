"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  type ConsentPreference,
  publishConsentUpdate,
  readConsentPreference,
  saveConsentPreference,
} from "@/lib/consent";

const OPEN_EVENT = "rc2:open-consent-preferences";
const choiceButtonClass = "ui-focus-ring min-h-11 rounded-lg border border-rc2-border px-5 text-sm font-semibold text-rc2-heading hover:bg-rc2-bg-alt";

export function ConsentPreferencesButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
      className="ui-focus-ring rounded-sm text-xs text-rc2-dark-text-secondary underline-offset-4 hover:text-rc2-dark-text hover:underline"
    >
      Preferências de cookies
    </button>
  );
}

export function ConsentManager() {
  const [preference, setPreference] = useState<ConsentPreference | null | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [configuring, setConfiguring] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    // Read after hydration so the server and first client render match.
    queueMicrotask(() => setPreference(readConsentPreference()));
    const reopen = () => {
      const saved = readConsentPreference();
      setAnalytics(saved?.analytics ?? false);
      setMarketing(saved?.marketing ?? false);
      setConfiguring(true);
      setOpen(true);
    };
    window.addEventListener(OPEN_EVENT, reopen);
    return () => window.removeEventListener(OPEN_EVENT, reopen);
  }, []);

  const choose = (nextAnalytics: boolean, nextMarketing: boolean) => {
    const saved = saveConsentPreference(nextAnalytics, nextMarketing);
    publishConsentUpdate(saved);
    setPreference(saved);
    setOpen(false);
    setConfiguring(false);
  };

  if (preference === undefined || (preference !== null && !open)) return null;

  return (
    <section
      aria-labelledby="consent-heading"
      className="fixed inset-x-3 bottom-3 z-[90] mx-auto max-w-3xl rounded-lg border border-rc2-border bg-rc2-surface p-5 shadow-[var(--shadow-soft)] sm:inset-x-6 sm:bottom-6 sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="consent-heading" className="text-lg font-semibold text-rc2-heading">
            Preferências de cookies
          </h2>
          <p className="mt-2 text-base leading-relaxed text-rc2-text">
            Cookies essenciais mantêm o site funcionando. Você escolhe se permite Analytics e Marketing.
            Consulte a <Link href="/privacidade" className="ui-focus-ring rounded-sm text-rc2-brand-text underline underline-offset-2">Política de Privacidade</Link>.
          </p>
        </div>
        {preference && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="ui-focus-ring shrink-0 rounded-sm px-2 py-1 text-sm text-rc2-text-secondary hover:text-rc2-heading"
            aria-label="Fechar preferências"
          >
            Fechar
          </button>
        )}
      </div>

      {configuring && (
        <div className="mt-5 space-y-3 border-t border-rc2-border-soft pt-4">
          <p className="text-base font-medium text-rc2-heading">Essenciais <span className="font-normal text-rc2-text-secondary">— sempre ativos</span></p>
          <label className="flex min-h-11 items-center gap-3 text-base text-rc2-text">
            <input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} className="ui-focus-ring size-5 accent-rc2-brand-text" />
            Analytics
          </label>
          <label className="flex min-h-11 items-center gap-3 text-base text-rc2-text">
            <input type="checkbox" checked={marketing} onChange={(event) => setMarketing(event.target.checked)} className="ui-focus-ring size-5 accent-rc2-brand-text" />
            Marketing
          </label>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {configuring ? (
          <button type="button" onClick={() => choose(analytics, marketing)} className={buttonVariants({ variant: "brand", size: "brand-md" })}>
            Salvar preferências
          </button>
        ) : (
          <>
            <button type="button" onClick={() => choose(true, true)} className={choiceButtonClass}>
              Aceitar todos
            </button>
            <button type="button" onClick={() => choose(false, false)} className={choiceButtonClass}>
              Rejeitar opcionais
            </button>
            <button type="button" onClick={() => setConfiguring(true)} className="ui-focus-ring min-h-11 rounded-lg px-5 text-sm font-semibold text-rc2-brand-text underline-offset-4 hover:underline">
              Configurar
            </button>
          </>
        )}
      </div>
    </section>
  );
}
