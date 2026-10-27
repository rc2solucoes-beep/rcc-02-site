"use client";

import { useState, useSyncExternalStore, useTransition, type ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  confirmSubscriptionAction,
  unsubscribeAction,
  type TokenActionStatus,
} from "@/app/(newsletter)/newsletter/actions";

// Painel das páginas de token (SDD §6.4). Lê o token do fragmento `#t=`, guarda em memória e
// REMOVE o fragmento da URL imediatamente (history.replaceState). GET nunca altera estado: só o
// clique no botão chama a Server Action (POST). Nenhum evento de analytics é emitido aqui, e o
// token não vai para estado persistente, log ou terceiros.

type Mode = "confirm" | "unsubscribe";

const COPY: Record<Mode, { title: string; lead: string; button: string; working: string }> = {
  confirm: {
    title: "Confirmar inscrição",
    lead: "Confirme que este endereço de e-mail deve receber a newsletter da RC2 Soluções.",
    button: "Confirmar inscrição",
    working: "Confirmando…",
  },
  unsubscribe: {
    title: "Descadastrar da newsletter",
    lead: "Confirme que este endereço não deve mais receber a newsletter da RC2 Soluções.",
    button: "Confirmar descadastro",
    working: "Descadastrando…",
  },
};

const RESULT: Record<TokenActionStatus, { tone: "ok" | "info" | "error"; text: string }> = {
  confirmed: { tone: "ok", text: "Inscrição confirmada. Obrigado." },
  unsubscribed: { tone: "ok", text: "Descadastro concluído. Você não receberá mais a newsletter." },
  already_unsubscribed: { tone: "ok", text: "Este endereço já está descadastrado." },
  invalid: { tone: "info", text: "Este link está inativo ou já foi utilizado." },
  rate_limited: { tone: "error", text: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
  error: { tone: "error", text: "Não foi possível concluir agora. Tente novamente em alguns instantes." },
};

const primary = cn(buttonVariants({ variant: "default" }), "font-semibold px-8 bg-rc2-orange text-rc2-heading hover:bg-rc2-orange/90");

// O fragmento é lido UMA vez por caminho e removido da URL na hora; o token fica só neste módulo,
// em memória. Durante a hidratação o snapshot do servidor é "reading".
let captured: { path: string; token: string | null } | undefined;

function readToken(): string | null {
  const path = window.location.pathname;
  if (!captured || captured.path !== path) {
    const token = new URLSearchParams(window.location.hash.replace(/^#/, "")).get("t");
    captured = { path, token };
    if (token) window.history.replaceState(null, "", path + window.location.search);
  }
  return captured.token;
}

const subscribe = () => () => {};
const clientPhase = (): "ready" | "none" => (readToken() ? "ready" : "none");
const serverPhase = (): "reading" => "reading";

export function TokenActionPanel({ mode, noTokenSlot }: { mode: Mode; noTokenSlot?: ReactNode }) {
  const copy = COPY[mode];
  const phase = useSyncExternalStore(subscribe, clientPhase, serverPhase);
  const [status, setStatus] = useState<TokenActionStatus | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    const token = readToken();
    if (!token) return;
    startTransition(async () => {
      const result = await (mode === "confirm" ? confirmSubscriptionAction(token) : unsubscribeAction(token));
      if (result.status !== "error" && result.status !== "rate_limited" && captured) captured.token = null;
      setStatus(result.status);
    });
  }

  const result = status ? RESULT[status] : null;

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <h1 className="rc2-h1 mb-4">{copy.title}</h1>

      <div aria-live="polite" role="status" className="mb-6">
        {result ? (
          <p
            className={cn(
              "rounded-md border p-4 text-base leading-[1.75]",
              result.tone === "ok" && "border-rc2-border bg-rc2-surface text-rc2-heading",
              result.tone === "info" && "border-rc2-border bg-rc2-surface text-rc2-text",
              result.tone === "error" && "border-rc2-border bg-rc2-surface text-rc2-error",
            )}
          >
            {result.text}
          </p>
        ) : null}
      </div>

      {phase === "ready" && !result ? (
        <>
          <p className="mb-6 text-base leading-[1.75] text-rc2-text">{copy.lead}</p>
          <button type="button" onClick={submit} disabled={pending} className={primary}>
            {pending ? copy.working : copy.button}
          </button>
        </>
      ) : null}

      {phase === "ready" && (status === "error" || status === "rate_limited") ? (
        <button type="button" onClick={submit} disabled={pending} className={cn(primary, "mt-4")}>
          {copy.button}
        </button>
      ) : null}

      {phase === "none" && !result ? (
        <>
          <p className="mb-6 text-base leading-[1.75] text-rc2-text">
            Este link está inativo ou já foi utilizado.
            {mode === "confirm" ? " Para receber um novo e-mail de confirmação, inscreva-se novamente pela página inicial." : ""}
          </p>
          {noTokenSlot}
        </>
      ) : null}

      {status === "invalid" ? noTokenSlot : null}

      {phase === "reading" ? <noscript>É necessário habilitar o JavaScript para concluir esta ação.</noscript> : null}
    </div>
  );
}
