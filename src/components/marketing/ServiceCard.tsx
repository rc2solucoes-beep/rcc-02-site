import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Service } from "@/lib/content/services";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
  service: Service;
  className?: string;
}

export function ServiceCard({ service, className }: ServiceCardProps) {
  return (
    <div
      className={cn(
        "group flex flex-col p-6 border border-border bg-rc2-sand hover:border-rc2-orange transition-colors duration-200",
        className
      )}
    >
      <span className="rc2-label text-rc2-orange mb-3">{service.shortTitle}</span>
      <h3 className="text-lg font-semibold text-rc2-ebony mb-3 leading-snug">
        {service.title}
      </h3>
      <p className="text-sm text-rc2-ebony/70 leading-relaxed flex-1">
        {service.summary}
      </p>
      <Link
        href={`/servicos/${service.slug}`}
        className="ui-focus-ring rounded-sm mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-rc2-orange hover:gap-3 transition-all duration-200"
      >
        Ver detalhes
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
