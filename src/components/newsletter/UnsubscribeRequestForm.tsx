"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { useState, type FormEvent } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Pedido de novo link de descadastro (SDD §7.4). Renderizado SOMENTE no ramo sem token da página,
// depois de a ausência de token ser confirmada: o Turnstile (serviço de segurança, não de
// medição) só carrega aqui. Resposta uniforme: nunca revela se o endereço é assinante.

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const hasSiteKey = Boolean(SITE_KEY && SITE_KEY !== "xxxx");

export function UnsubscribeRequestForm() {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [token, setToken] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (hasSiteKey && !token) {
      setState("error");
      setMessage("Aguarde a verificação de segurança e tente novamente.");
      return;
    }
    setState("sending");
    try {
      const response = await fetch("/api/newsletter/unsubscribe-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, website, turnstileToken: token }),
      });
      if (response.status === 202) {
        setState("done");
        setMessage("Se o endereço estiver inscrito, você receberá um e-mail com o link para se descadastrar.");
      } else {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setState("error");
        setMessage(payload.error ?? "Não foi possível concluir agora. Tente novamente.");
      }
    } catch {
      setState("error");
      setMessage("Não foi possível concluir agora. Tente novamente.");
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4" aria-describedby="unsub-request-status">
      <p className="text-base leading-[1.75] text-rc2-text">
        Se você ainda recebe e-mails da RC2, informe seu endereço para receber um novo link de descadastro.
      </p>
      <div>
        <label htmlFor="unsub-email" className="mb-1 block text-sm font-medium text-rc2-heading">
          E-mail
        </label>
        <input
          id="unsub-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-rc2-border bg-rc2-surface px-3 py-2 text-base text-rc2-text"
        />
      </div>
      {/* Honeypot: invisível para pessoas e leitores de tela. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="unsub-website">Website</label>
        <input id="unsub-website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>
      {hasSiteKey ? <Turnstile siteKey={SITE_KEY as string} onSuccess={setToken} onExpire={() => setToken("")} /> : null}
      <div id="unsub-request-status" aria-live="polite" role="status">
        {state === "done" || state === "error" ? (
          <p className={cn("text-base leading-[1.75]", state === "error" ? "text-rc2-error" : "text-rc2-heading")}>{message}</p>
        ) : null}
      </div>
      <button
        type="submit"
        disabled={state === "sending" || state === "done"}
        className={cn(buttonVariants({ variant: "default" }), "font-semibold px-8 bg-rc2-orange text-rc2-heading hover:bg-rc2-orange/90")}
      >
        {state === "sending" ? "Enviando…" : "Receber link de descadastro"}
      </button>
    </form>
  );
}
