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
        "group rc2-card rc2-card-hover flex flex-col p-6 border-t-2 border-t-rc2-orange/0 hover:border-t-rc2-orange",
        className
      )}
    >
      <span className="rc2-label text-rc2-orange mb-3">{service.shortTitle}</span>
      <h3 className="text-lg font-semibold text-rc2-sand mb-3 leading-snug">
        {service.title}
      </h3>
      <p className="text-sm text-rc2-sand/80 leading-relaxed flex-1">
        {service.summary}
      </p>
      {resolveText && (
        <p className="mt-3 text-xs text-rc2-sand/75">
          <span className="font-semibold text-rc2-sand/90">Resolve:</span> {resolveText}
        </p>
      )}
      <Link
        href={`/servicos/${service.slug}`}
        className="ui-focus-ring rounded-lg mt-5 inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-rc2-orange bg-rc2-orange/5 hover:bg-rc2-orange/10 active:bg-rc2-orange/20 hover:gap-3 transition-all duration-200"
      >
        Ver serviço
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
