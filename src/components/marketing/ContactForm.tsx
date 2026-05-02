"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  company: z.string().min(2, "Empresa obrigatória"),
  email: z.string().email("E-mail inválido"),
  whatsapp: z.string().min(10, "WhatsApp obrigatório (com DDD)"),
  segment: z.string().min(2, "Segmento obrigatório"),
  size: z.string().min(1, "Selecione o número de colaboradores"),
  solution: z.string().min(1, "Selecione uma solução"),
  message: z.string().min(10, "Descreva seu desafio (mínimo 10 caracteres)"),
});

type FormData = z.infer<typeof schema>;

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
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
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
      {required && <span className="text-rc2-orange ml-0.5">*</span>}
    </label>
  );
}

const inputBase =
  "w-full rounded-none border border-border bg-rc2-sand px-4 py-3 text-sm text-rc2-ebony placeholder:text-rc2-ebony/40 outline-none focus:border-rc2-orange focus:ring-1 focus:ring-rc2-orange transition-colors";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  // Phase 3: UI only — backend integration in Phase 4
  const onSubmit = async (_data: FormData) => {
    await new Promise((r) => setTimeout(r, 800));
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
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
          className="mt-6 text-sm font-medium text-rc2-orange underline underline-offset-4"
        >
          Prefere falar agora? Chama no WhatsApp →
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {/* Nome + Empresa */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <Label htmlFor="name" required>Nome</Label>
          <input
            id="name"
            type="text"
            placeholder="Seu nome completo"
            className={cn(inputBase, errors.name && "border-destructive")}
            {...register("name")}
          />
          <FieldError message={errors.name?.message} />
        </div>
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
      </div>

      {/* E-mail + WhatsApp */}
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

      {/* Segmento + Tamanho */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <Label htmlFor="segment" required>Segmento da empresa</Label>
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
          <Label htmlFor="size" required>Número aproximado de colaboradores</Label>
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

      {/* Solução */}
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

      {/* Mensagem */}
      <div>
        <Label htmlFor="message" required>Descreva rapidamente seu desafio</Label>
        <textarea
          id="message"
          rows={5}
          placeholder="Conte um pouco sobre o que você precisa resolver ou automatizar..."
          className={cn(inputBase, "resize-none", errors.message && "border-destructive")}
          {...register("message")}
        />
        <FieldError message={errors.message?.message} />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full sm:w-auto px-10 h-12 bg-rc2-orange text-rc2-sand font-semibold tracking-wide uppercase text-xs hover:bg-rc2-orange/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Enviando..." : "Solicitar diagnóstico"}
      </button>

      <p className="text-xs text-rc2-ebony/40">
        Ao enviar, você concorda com nossa{" "}
        <a href="/privacidade" className="underline hover:text-rc2-ebony/60 transition-colors">
          Política de Privacidade
        </a>
        .
      </p>
    </form>
  );
}
