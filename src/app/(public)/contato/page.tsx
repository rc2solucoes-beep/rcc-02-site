import type { Metadata } from "next";
import { ContactForm } from "@/components/marketing/ContactForm";
import { SectionLabel } from "@/components/ui/SectionLabel";

export const metadata: Metadata = {
  title: "Contato — Solicite um Diagnóstico",
  description:
    "Preencha o formulário e receba um diagnóstico gratuito de oportunidades de IA e automação para sua empresa.",
  alternates: { canonical: "https://rc2solucoes.com.br/contato" },
  openGraph: { url: "https://rc2solucoes.com.br/contato" },
};

export default function ContatoPage() {
  return (
    <section className="bg-rc2-sand py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Sidebar */}
          <div>
            <SectionLabel className="block mb-4">Diagnóstico gratuito</SectionLabel>
            <h1 className="rc2-display text-4xl md:text-5xl text-rc2-ebony mb-6 leading-tight">
              Solicite um diagnóstico para sua empresa
            </h1>
            <p className="text-rc2-ebony/70 leading-relaxed mb-8">
              Quer automatizar atendimento, criar agentes de IA, integrar
              sistemas, estruturar um e-commerce ou modernizar sua presença
              digital?
            </p>
            <p className="text-rc2-ebony/70 leading-relaxed mb-8">
              Preencha o formulário e vamos identificar onde a tecnologia pode
              gerar resultado prático para sua operação.
            </p>

            {/* What you get */}
            <div className="p-6 border border-border bg-white/40">
              <h2 className="text-sm font-semibold text-rc2-ebony mb-4 uppercase tracking-wide">
                O que você recebe
              </h2>
              <ul className="space-y-3 text-sm text-rc2-ebony/70">
                {[
                  "Mapeamento inicial da operação",
                  "Identificação de gargalos",
                  "Sugestão de automações possíveis",
                  "Priorização por impacto e complexidade",
                  "Roadmap de implantação",
                  "Proposta para execução",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-rc2-orange mt-0.5 text-xs shrink-0">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6">
              <p className="text-xs text-rc2-ebony/70 mb-2">Prefere falar diretamente?</p>
              <a
                href="https://wa.me/5511988028550"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-rc2-orange underline underline-offset-4 hover:opacity-70 transition-opacity"
              >
                Falar pelo WhatsApp →
              </a>
            </div>
          </div>

          {/* Form */}
          <div>
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
