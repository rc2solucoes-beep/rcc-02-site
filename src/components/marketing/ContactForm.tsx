"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Turnstile } from "@marsidev/react-turnstile";
import { contactSchema, type ContactFormData } from "@/lib/validations/contact";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { trackLeadEvent, trackWhatsappClick } from "@/lib/tracking";

const solutionOptions = [
  "Automações com IA",
  "Agentes de IA internos",
  "Integrações com n8n/APIs",
  "E-commerce",
  "Site ou landing page",
  "Ainda não sei",
];

const sizeOptions = [
  "1–10 colaboradores",
  "11–50 colaboradores",
  "51–200 colaboradores",
  "Mais de 200 colaboradores",
];

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-destructive font-medium" role="alert">{message}</p>;
}

function Label({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-rc2-ebony mb-1.5">
      {children}
      {required && <span className="text-rc2-orange ml-0.5" aria-hidden>*</span>}
    </label>
  );
}

const inputBase =
  "w-full rounded-md border border-border bg-white px-4 py-3 text-sm text-rc2-ebony placeholder:text-rc2-placeholder outline-none focus:border-rc2-orange focus:ring-2 focus:ring-rc2-orange/20 transition-colors shadow-sm";

const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA";

type CompanySegmentCategory =
  | "varejo"
  | "saude"
  | "logistica"
  | "servicos"
  | "educacao"
  | "industria"
  | "tecnologia"
  | "financeiro"
  | "alimentacao"
  | "outro";

function categorizeCompanySegment(segment: string): CompanySegmentCategory {
  const normalizedSegment = segment
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (!normalizedSegment.trim()) return "outro";

  const categoryKeywords: Array<{
    category: CompanySegmentCategory;
    keywords: string[];
  }> = [
    { category: "varejo", keywords: ["varejo", "loja", "comercio", "retail"] },
    { category: "saude", keywords: ["saude", "clinica", "medico", "hospital"] },
    { category: "logistica", keywords: ["logistica", "transporte", "frete", "entrega"] },
    { category: "servicos", keywords: ["servico", "consultoria", "agencia", "prestador"] },
    { category: "educacao", keywords: ["educacao", "escola", "curso", "ensino"] },
    { category: "industria", keywords: ["industria", "fabrica", "manufatura", "producao"] },
    { category: "tecnologia", keywords: ["tecnologia", "software", "ti", "startup"] },
    { category: "financeiro", keywords: ["financeiro", "financas", "contabil", "banco"] },
    { category: "alimentacao", keywords: ["alimentacao", "restaurante", "comida", "food"] },
  ];

  return (
    categoryKeywords.find(({ keywords }) =>
      keywords.some((keyword) => normalizedSegment.includes(keyword))
    )?.category ?? "outro"
  );
}

function ProgressBar({ step }: { step: 1 | 2 }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn("text-sm font-semibold", step === 1 ? "text-rc2-orange" : "text-rc2-ebony/40")}>
            Etapa 1
          </div>
          <div className={cn("w-24 h-1 rounded-full", step >= 1 ? "bg-rc2-orange" : "bg-rc2-ebony/10")} />
          <div className={cn("text-sm font-semibold", step === 2 ? "text-rc2-orange" : "text-rc2-ebony/40")}>
            Etapa 2
          </div>
        </div>
        <span className="text-xs text-rc2-ebony/60">~1 min</span>
      </div>
      <p className="text-xs text-rc2-ebony/70">{step === 1 ? "Informações iniciais" : "Detalhes da empresa"}</p>
    </div>
  );
}

export function ContactForm() {
  const [step, setStep] = useState<1 | 2>(1);
  const [submitted, setSubmitted] = useState(false);
  const [step1Started, setStep1Started] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    trigger,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    mode: "onBlur",
  });

  const handleStep1Next = async () => {
    const isValid = await trigger(["name", "email", "whatsapp", "message", "website"]);
    if (isValid) {
      trackLeadEvent(
        "generate_lead_step_1",
        { form_name: "diagnostico_gratuito" }
      );
      setStep(2);
    }
  };

  const handleStep1Back = () => {
    setStep(1);
  };

  const onSubmit = async (data: ContactFormData) => {
    setServerError(null);

    if (!turnstileToken) {
      setTurnstileError("Complete a verificação de segurança antes de enviar.");
      return;
    }
    setTurnstileError(null);
    trackLeadEvent(
      "generate_lead_submit",
      { form_name: "diagnostico_gratuito" }
    );

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, turnstileToken: turnstileToken ?? "" }),
      });

      const json = await res.json() as { success?: boolean; error?: string };

      if (!res.ok) {
        setServerError(json.error ?? "Erro inesperado. Tente novamente.");
        return;
      }

      const companySegmentCategory = categorizeCompanySegment(data.segment);

      trackLeadEvent("generate_lead_success", {
        form_name: "diagnostico_gratuito",
        lead_source: "website",
        solution_interest: data.solution,
        company_size: data.size,
        company_segment: companySegmentCategory,
      });
      setSubmitted(true);
    } catch {
      setServerError("Falha de conexão. Verifique sua internet e tente novamente.");
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="inline-block rounded-full bg-rc2-orange/10 p-3 mb-4">
          <span className="text-3xl">✓</span>
        </div>
        <span className="rc2-label block mb-4 text-rc2-orange">Recebido</span>
        <h2 className="text-2xl font-semibold text-rc2-ebony mb-3">
          Diagnóstico solicitado com sucesso!
        </h2>
        <p className="text-rc2-ebony/70 max-w-md">
          Recebemos suas informações e entraremos em contato em breve pelo e-mail
          ou WhatsApp informado.
        </p>
        <a
          href="https://wa.me/5511988028550"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            trackWhatsappClick({
              location: "contact_form_success",
              label: "prefere_falar_agora_whatsapp",
              destination: "https://wa.me/5511988028550",
            })
          }
          className="mt-6 text-sm font-medium text-rc2-orange underline underline-offset-4"
        >
          Prefere falar agora? Chama no WhatsApp →
        </a>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      onFocusCapture={(event) => {
        if (step !== 1 || step1Started) return;
        const target = event.target as HTMLElement;
        if (!["name", "email", "whatsapp", "message"].includes(target.id)) return;
        setStep1Started(true);
        trackLeadEvent(
          "generate_lead_start",
          { form_name: "diagnostico_gratuito" }
        );
      }}
      noValidate
      className="space-y-6"
    >
      {/* Honeypot */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
        {...register("website")}
      />

      {/* Progress bar */}
      <ProgressBar step={step} />

      {/* STEP 1: Low-friction initial contact */}
      {step === 1 && (
        <>
          <div>
            <Label htmlFor="name" required>Seu nome</Label>
            <input
              id="name"
              type="text"
              placeholder="Seu nome completo"
              className={cn(inputBase, errors.name && "border-destructive")}
              {...register("name")}
            />
            <FieldError message={errors.name?.message} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Label htmlFor="email" required>E-mail</Label>
              <input
                id="email"
                type="email"
                placeholder="seu@email.com"
                className={cn(inputBase, errors.email && "border-destructive")}
                {...register("email")}
              />
              <FieldError message={errors.email?.message} />
            </div>
            <div>
              <Label htmlFor="whatsapp" required>WhatsApp</Label>
              <input
                id="whatsapp"
                type="tel"
                placeholder="(11) 99999-9999"
                className={cn(inputBase, errors.whatsapp && "border-destructive")}
                {...register("whatsapp")}
              />
              <FieldError message={errors.whatsapp?.message} />
            </div>
          </div>

          <div>
            <Label htmlFor="message" required>Qual é seu principal desafio?</Label>
            <textarea
              id="message"
              rows={4}
              placeholder="Conte um pouco sobre o que você precisa resolver ou automatizar..."
              className={cn(inputBase, "resize-none", errors.message && "border-destructive")}
              {...register("message")}
            />
            <FieldError message={errors.message?.message} />
          </div>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={handleStep1Next}
              className="ui-focus-ring flex-1 px-10 h-12 bg-rc2-orange text-rc2-sand font-semibold tracking-wide uppercase text-xs hover:bg-rc2-orange/90 active:bg-rc2-orange active:ring-1 active:ring-rc2-orange/50 transition-all duration-150 rounded-md flex items-center justify-center gap-2"
            >
              Próximo
              <ChevronRight size={16} />
            </button>
          </div>
        </>
      )}

      {/* STEP 2: Qualification details + submission */}
      {step === 2 && (
        <>
          <div>
            <Label htmlFor="company" required>Empresa</Label>
            <input
              id="company"
              type="text"
              placeholder="Nome da empresa"
              className={cn(inputBase, errors.company && "border-destructive")}
              {...register("company")}
            />
            <FieldError message={errors.company?.message} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Label htmlFor="segment" required>Segmento</Label>
              <input
                id="segment"
                type="text"
                placeholder="Ex: Varejo, Saúde, Logística..."
                className={cn(inputBase, errors.segment && "border-destructive")}
                {...register("segment")}
              />
              <FieldError message={errors.segment?.message} />
            </div>
            <div>
              <Label htmlFor="size" required>Porte (colaboradores)</Label>
              <select
                id="size"
                className={cn(inputBase, "cursor-pointer", errors.size && "border-destructive")}
                {...register("size")}
                defaultValue=""
              >
                <option value="" disabled>Selecione...</option>
                {sizeOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <FieldError message={errors.size?.message} />
            </div>
          </div>

          <div>
            <Label htmlFor="solution" required>Qual solução você procura?</Label>
            <select
              id="solution"
              className={cn(inputBase, "cursor-pointer", errors.solution && "border-destructive")}
              {...register("solution")}
              defaultValue=""
            >
              <option value="" disabled>Selecione...</option>
              {solutionOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <FieldError message={errors.solution?.message} />
          </div>

          {/* Turnstile */}
          <Turnstile
            siteKey={TURNSTILE_SITE_KEY}
            onSuccess={(token) => { setTurnstileToken(token); setTurnstileError(null); }}
            onError={() => { setTurnstileToken(null); setTurnstileError("Falha na verificação de segurança. Recarregue a página."); }}
            onExpire={() => { setTurnstileToken(null); setTurnstileError("Verificação expirada. Por favor, complete novamente."); }}
            options={{ theme: "light", language: "pt-BR" }}
          />

          {/* Errors */}
          <div aria-live="polite">
            {turnstileError && (
              <p className="text-xs text-destructive" role="alert">{turnstileError}</p>
            )}
          </div>

          {serverError && (
            <p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 px-4 py-3" role="alert">
              {serverError}
            </p>
          )}

          {/* Action buttons */}
          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={handleStep1Back}
              disabled={isSubmitting}
              className="ui-focus-ring px-6 h-12 border border-border text-rc2-ebony font-semibold tracking-wide uppercase text-xs hover:bg-surface-1 active:ring-1 active:ring-rc2-orange/50 transition-all duration-150 rounded-md flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <ChevronLeft size={16} />
              Voltar
            </button>
            <button
              type="submit"
              disabled={!turnstileToken || isSubmitting}
              className="ui-focus-ring flex-1 px-10 h-12 bg-rc2-orange text-rc2-sand font-semibold tracking-wide uppercase text-xs hover:bg-rc2-orange/90 active:bg-rc2-orange active:ring-1 active:ring-rc2-orange/50 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed rounded-md"
            >
              {isSubmitting ? "Enviando..." : "Solicitar diagnóstico"}
            </button>
          </div>
        </>
      )}

      <p className="text-xs text-rc2-ebony/70">
        Ao enviar, você concorda com nossa{" "}
        <a href="/privacidade" className="ui-focus-ring rounded-sm underline hover:text-rc2-ebony transition-colors">
          Política de Privacidade
        </a>
        .
      </p>
    </form>
  );
}
