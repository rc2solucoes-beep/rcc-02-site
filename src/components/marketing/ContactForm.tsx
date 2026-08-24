"use client";

import { useState } from "react";
import Link from "next/link";
import { Turnstile } from "@marsidev/react-turnstile";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactSchema, type ContactFormData } from "@/lib/validations/contact";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronLeft } from "lucide-react";
import {
  trackFormError,
  trackFormStart,
  trackFormSubmit,
  trackFormSuccess,
  trackLeadEvent,
  trackWhatsappClick,
  type CompanySegmentCategory,
} from "@/lib/tracking";

const solutionOptions = [
  "Automatizar atendimento ou vendas",
  "Criar IA para apoiar a equipe interna",
  "Conectar sistemas, planilhas ou CRM",
  "E-commerce",
  "Criar site ou landing page",
  "Ainda não sei por onde começar",
];

const sizeOptions = [
  "1–10 colaboradores",
  "11–50 colaboradores",
  "51–200 colaboradores",
  "Mais de 200 colaboradores",
];

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-xs text-destructive font-medium" role="alert">
      {message}
    </p>
  );
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
    <label htmlFor={htmlFor} className="block text-sm font-medium text-rc2-text mb-1.5">
      {children}
      {required && <span className="text-rc2-brand-text ml-0.5" aria-hidden>*</span>}
    </label>
  );
}

const inputBase =
  "w-full rounded-md border border-border bg-white px-4 py-3 text-sm text-rc2-text placeholder:text-rc2-text-secondary outline-none focus:border-rc2-focus-ring focus:ring-2 focus:ring-rc2-focus-ring/20 transition-colors shadow-sm";

const FORM_CONTEXT = {
  form_name: "diagnostico_gratuito" as const,
  location: "contact_form",
  source_page: "/contato",
  source_type: "contact_page",
};

function getErrorDescription(fieldId: string, hasError: boolean) {
  return hasError ? `${fieldId}-error` : undefined;
}

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
          <div className={cn("text-sm font-semibold", step === 1 ? "text-rc2-brand-text" : "text-rc2-text-secondary")}>
            Etapa 1 de 2
          </div>
          <div className={cn("w-24 h-1 rounded-full", step >= 1 ? "bg-rc2-brand" : "bg-rc2-border")} />
          <div className={cn("text-sm font-semibold", step === 2 ? "text-rc2-brand-text" : "text-rc2-text-secondary")}>
            Etapa 2 de 2
          </div>
        </div>
        <span className="text-xs text-rc2-text-secondary">Tempo estimado: 1 minuto</span>
      </div>
      <p className="text-xs text-rc2-text-secondary">
        {step === 1 ? "Etapa 1 de 2 — Informações iniciais" : "Etapa 2 de 2 — Dados da empresa"}
      </p>
    </div>
  );
}

export function ContactForm() {
  const [step, setStep] = useState<1 | 2>(1);
  const [submitted, setSubmitted] = useState(false);
  const [step1Started, setStep1Started] = useState(false);
  const [step1Error, setStep1Error] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileError, setTurnstileError] = useState<string | null>(null);

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
  const hasRealTurnstileSiteKey = Boolean(turnstileSiteKey && turnstileSiteKey !== "xxxx");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    trigger,
    setFocus,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    mode: "onBlur",
    defaultValues: {},
  });

  const handleStep1Next = async () => {
    setStep1Error(null);
    const isValid = await trigger(["name", "email", "whatsapp", "message", "website"], {
      shouldFocus: true,
    });
    if (isValid) {
      trackLeadEvent(
        "generate_lead_step_1",
        { form_name: "diagnostico_gratuito" }
      );
      setStep(2);
      return;
    }

    setStep1Error("Revise os campos destacados antes de continuar.");
    const firstErrorField = ["name", "email", "whatsapp", "message"].find(
      (field) => errors[field as keyof typeof errors]
    ) as "name" | "email" | "whatsapp" | "message" | undefined;
    if (firstErrorField) {
      setFocus(firstErrorField);
    }
  };

  const handleStep1Back = () => {
    setServerError(null);
    setStep(1);
  };

  const onSubmit = async (data: ContactFormData) => {
    setServerError(null);
    setStep1Error(null);
    setTurnstileError(null);

    if (hasRealTurnstileSiteKey && !turnstileToken) {
      setTurnstileError(
        "Não foi possível validar a verificação de segurança. Recarregue a página e tente novamente ou fale pelo WhatsApp."
      );
      return;
    }

    trackFormSubmit({
      ...FORM_CONTEXT,
      solution_interest: data.solution,
      company_size: data.size,
      company_segment: categorizeCompanySegment(data.segment),
    });
    trackLeadEvent(
      "generate_lead_submit",
      { form_name: "diagnostico_gratuito" }
    );

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, turnstileToken }),
      });

      const json = await res.json() as { success?: boolean; error?: string };

      if (!res.ok) {
        const apiMessage = json.error?.toLowerCase() ?? "";
        const isRateLimited = apiMessage.includes("muitas") || apiMessage.includes("too many") || apiMessage.includes("rate");
        const isTurnstileError = apiMessage.includes("verificação de segurança") || apiMessage.includes("validar");
        setServerError(
          isTurnstileError
            ? "Não foi possível validar a verificação de segurança. Recarregue a página e tente novamente ou fale pelo WhatsApp."
            :
          isRateLimited
            ? "Muitas solicitações em pouco tempo. Aguarde alguns minutos ou fale pelo WhatsApp."
            : "Não conseguimos registrar sua solicitação neste momento. Tente novamente ou fale pelo WhatsApp."
        );
        trackFormError({
          ...FORM_CONTEXT,
          error_code: isRateLimited ? "rate_limited" : "api_error",
          error_message: isRateLimited ? "too_many_requests" : isTurnstileError ? "security_verification_failed" : "request_failed",
        });
        return;
      }

      const companySegmentCategory = categorizeCompanySegment(data.segment);

      trackFormSuccess({
        ...FORM_CONTEXT,
        solution_interest: data.solution,
        company_size: data.size,
        company_segment: companySegmentCategory,
      });
      trackLeadEvent("generate_lead_success", {
        form_name: "diagnostico_gratuito",
        lead_source: "website",
        solution_interest: data.solution,
        company_size: data.size,
        company_segment: companySegmentCategory,
      });
      setSubmitted(true);
    } catch {
      setServerError("Não foi possível enviar agora. Verifique sua conexão e tente novamente.");
      trackFormError({
        ...FORM_CONTEXT,
        error_code: "network_error",
        error_message: "network_failure",
      });
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="inline-block rounded-full bg-rc2-brand/10 p-3 mb-4">
          <span className="text-3xl">✓</span>
        </div>
        <span className="rc2-label block mb-4 text-rc2-brand-text">Recebido</span>
        <h2 className="text-2xl font-semibold text-rc2-heading mb-3">
          Diagnóstico solicitado com sucesso!
        </h2>
        <p className="text-rc2-text/70 max-w-md">
          Diagnóstico solicitado com sucesso. Recebemos suas informações e retornaremos
          pelo e-mail ou WhatsApp informado.
        </p>
        <p className="text-rc2-text/70 max-w-md mt-2">
          Se preferir acelerar o contato, fale agora pelo WhatsApp.
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
          className="mt-6 text-sm font-medium text-rc2-brand-text underline underline-offset-4"
        >
          Abrir WhatsApp agora →
        </a>
        <Link
          href="/servicos"
          className="mt-3 text-sm text-rc2-text/75 underline underline-offset-4 hover:text-rc2-text"
        >
          Ver serviços
        </Link>
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
        trackFormStart(FORM_CONTEXT);
        trackLeadEvent(
          "generate_lead_start",
          { form_name: "diagnostico_gratuito" }
        );
      }}
      noValidate
      aria-busy={isSubmitting}
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
          {step1Error && (
            <p
              role="alert"
              aria-live="assertive"
              className="text-sm text-destructive bg-destructive/5 border border-destructive/20 px-4 py-3 rounded-md"
            >
              {step1Error}
            </p>
          )}
          <div>
            <Label htmlFor="name" required>Seu nome</Label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Seu nome completo"
              className={cn(inputBase, errors.name && "border-destructive")}
              aria-invalid={errors.name ? "true" : "false"}
              aria-describedby={getErrorDescription("name", Boolean(errors.name))}
              {...register("name")}
            />
            <FieldError id="name-error" message={errors.name?.message} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Label htmlFor="email" required>E-mail</Label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                className={cn(inputBase, errors.email && "border-destructive")}
                aria-invalid={errors.email ? "true" : "false"}
                aria-describedby={getErrorDescription("email", Boolean(errors.email))}
                {...register("email")}
              />
              <FieldError id="email-error" message={errors.email?.message} />
            </div>
            <div>
              <Label htmlFor="whatsapp" required>WhatsApp</Label>
              <input
                id="whatsapp"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                placeholder="(11) 99999-9999"
                className={cn(inputBase, errors.whatsapp && "border-destructive")}
                aria-invalid={errors.whatsapp ? "true" : "false"}
                aria-describedby={getErrorDescription("whatsapp", Boolean(errors.whatsapp))}
                {...register("whatsapp")}
              />
              <FieldError id="whatsapp-error" message={errors.whatsapp?.message} />
            </div>
          </div>

          <div>
            <Label htmlFor="message" required>Qual é seu principal desafio?</Label>
            <textarea
              id="message"
              rows={4}
              placeholder="Exemplo: muitos contatos sem resposta, tarefas manuais, dados espalhados ou sistemas que não conversam."
              className={cn(inputBase, "resize-none", errors.message && "border-destructive")}
              aria-invalid={errors.message ? "true" : "false"}
              aria-describedby={getErrorDescription("message", Boolean(errors.message))}
              {...register("message")}
            />
            <FieldError id="message-error" message={errors.message?.message} />
          </div>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={handleStep1Next}
              className="ui-focus-ring flex-1 px-10 h-12 bg-rc2-brand text-rc2-heading font-semibold tracking-wide uppercase text-xs hover:bg-rc2-brand/90 active:bg-rc2-brand active:ring-1 active:ring-rc2-brand/50 transition-[background-color,color,box-shadow] duration-150 rounded-md flex items-center justify-center gap-2"
            >
              Continuar para dados da empresa
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
              autoComplete="organization"
              placeholder="Nome da empresa"
              className={cn(inputBase, errors.company && "border-destructive")}
              aria-invalid={errors.company ? "true" : "false"}
              aria-describedby={getErrorDescription("company", Boolean(errors.company))}
              {...register("company")}
            />
            <FieldError id="company-error" message={errors.company?.message} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Label htmlFor="segment" required>Segmento</Label>
              <input
                id="segment"
                type="text"
                placeholder="Ex: Varejo, Saúde, Logística..."
                className={cn(inputBase, errors.segment && "border-destructive")}
                aria-invalid={errors.segment ? "true" : "false"}
                aria-describedby={getErrorDescription("segment", Boolean(errors.segment))}
                {...register("segment")}
              />
              <FieldError id="segment-error" message={errors.segment?.message} />
            </div>
            <div>
              <Label htmlFor="size" required>Porte (colaboradores)</Label>
              <select
                id="size"
                className={cn(inputBase, "cursor-pointer", errors.size && "border-destructive")}
                aria-invalid={errors.size ? "true" : "false"}
                aria-describedby={getErrorDescription("size", Boolean(errors.size))}
                {...register("size")}
                defaultValue=""
              >
                <option value="" disabled>Selecione...</option>
                {sizeOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <FieldError id="size-error" message={errors.size?.message} />
            </div>
          </div>

          <div>
            <Label htmlFor="solution" required>Qual solução você procura?</Label>
            <select
              id="solution"
              className={cn(inputBase, "cursor-pointer", errors.solution && "border-destructive")}
              aria-invalid={errors.solution ? "true" : "false"}
              aria-describedby={getErrorDescription("solution", Boolean(errors.solution))}
              {...register("solution")}
              defaultValue=""
            >
              <option value="" disabled>Selecione...</option>
              {solutionOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <FieldError id="solution-error" message={errors.solution?.message} />
          </div>

          {serverError && (
            <div className="text-sm text-destructive bg-destructive/5 border border-destructive/20 px-4 py-3 rounded-md" role="alert">
              <p>{serverError}</p>
              <a
                href="https://wa.me/5511988028550"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackWhatsappClick({
                    location: "contact_form_error",
                    label: "fallback_whatsapp",
                    destination: "https://wa.me/5511988028550",
                  })
                }
                className="inline-block mt-2 underline underline-offset-2"
              >
                Abrir WhatsApp agora →
              </a>
            </div>
          )}

          {hasRealTurnstileSiteKey && (
            <div>
              <Turnstile
                siteKey={turnstileSiteKey}
                onSuccess={(token) => {
                  setTurnstileToken(token);
                  setTurnstileError(null);
                }}
                onExpire={() => {
                  setTurnstileToken("");
                }}
                onError={() => {
                  setTurnstileToken("");
                  setTurnstileError(
                    "Não foi possível validar a verificação de segurança. Recarregue a página e tente novamente ou fale pelo WhatsApp."
                  );
                }}
              />
            </div>
          )}

          {turnstileError && (
            <div className="text-sm text-destructive bg-destructive/5 border border-destructive/20 px-4 py-3 rounded-md" role="alert">
              <p>{turnstileError}</p>
              <a
                href="https://wa.me/5511988028550"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackWhatsappClick({
                    location: "contact_form_turnstile_error",
                    label: "fallback_whatsapp",
                    destination: "https://wa.me/5511988028550",
                  })
                }
                className="inline-block mt-2 underline underline-offset-2"
              >
                Abrir WhatsApp agora →
              </a>
            </div>
          )}

          {/* Action buttons */}
          <p className="text-xs text-rc2-text/70">
            Você pode voltar sem perder as informações preenchidas.
          </p>
          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={handleStep1Back}
              disabled={isSubmitting}
              className="ui-focus-ring px-6 h-12 border border-border text-rc2-text font-semibold tracking-wide uppercase text-xs hover:bg-rc2-bg-alt active:ring-1 active:ring-rc2-brand/50 transition-[background-color,border-color,color,box-shadow,opacity] duration-150 rounded-md flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <ChevronLeft size={16} />
              Voltar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="ui-focus-ring flex-1 px-10 h-12 bg-rc2-brand text-rc2-heading font-semibold tracking-wide uppercase text-xs hover:bg-rc2-brand/90 active:bg-rc2-brand active:ring-1 active:ring-rc2-brand/50 transition-[background-color,color,box-shadow,opacity] duration-150 disabled:opacity-60 disabled:cursor-not-allowed rounded-md"
            >
              {isSubmitting ? "Enviando solicitação..." : "Solicitar diagnóstico"}
            </button>
          </div>
          {isSubmitting && (
            <p className="text-xs text-rc2-text/70" aria-live="polite">
              Estamos registrando seu diagnóstico. Não feche esta página.
            </p>
          )}
        </>
      )}

      <p className="text-xs text-rc2-text/70">
        Ao enviar, você concorda com nossa{" "}
        <a href="/privacidade" className="ui-focus-ring rounded-sm underline hover:text-rc2-text transition-colors">
          Política de Privacidade
        </a>
        .
      </p>
    </form>
  );
}
