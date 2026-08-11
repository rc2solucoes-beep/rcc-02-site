import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Service } from "@/lib/content/services";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
  service: Service;
  className?: string;
}

const serviceResolveMap: Record<string, string> = {
  "automacoes-com-ia": "atendimento lento e perda de leads.",
  "agentes-de-ia": "tarefas internas repetitivas e dúvidas operacionais.",
  "automacao-de-processos": "retrabalho entre planilhas, CRM e ERP.",
  "e-commerce": "operação de vendas online desorganizada.",
  "sites-e-landing-pages": "site sem geração consistente de contatos.",
};

export function ServiceCard({ service, className }: ServiceCardProps) {
  const resolveText = serviceResolveMap[service.slug];

  return (
    <div
      className={cn(
        "group rc2-card rc2-card-hover relative flex flex-col overflow-hidden p-6 pt-7",
        className
      )}
    >
      {/* Acento estrutural permanente — aba laranja no topo */}
      <span
        className="absolute left-0 top-0 h-1 w-10 bg-rc2-brand transition-all duration-200 group-hover:w-full group-hover:opacity-90"
        aria-hidden
      />
      <span className="rc2-label text-rc2-brand-text mb-3">{service.shortTitle}</span>
      <h3 className="text-lg font-semibold text-rc2-heading mb-3 leading-snug">
        {service.title}
      </h3>
      <p className="text-sm text-rc2-text/70 leading-relaxed flex-1">
        {service.summary}
      </p>
      {resolveText && (
        <p className="mt-3 text-xs text-rc2-text/70">
          <span className="font-semibold text-rc2-text/80">Resolve:</span> {resolveText}
        </p>
      )}
      <Link
        href={`/servicos/${service.slug}`}
        className="ui-focus-ring rounded-lg mt-5 inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-rc2-brand-text bg-rc2-brand/5 hover:bg-rc2-brand/10 active:bg-rc2-brand/20 hover:gap-3 transition-all duration-200"
      >
        Ver serviço
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
