import { buttonVariants } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { FadeIn } from "@/components/ui/FadeIn";
import { TrackedLink } from "@/components/tracking/TrackedLink";
import { cn } from "@/lib/utils";

interface CTABlockProps {
  title: string;
  description?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  hideSecondary?: boolean;
  className?: string;
}

const WHATSAPP_URL = "https://wa.me/5511988028550";

/**
 * Banda de CTA das páginas de detalhe (`/servicos/[slug]`, `/solucoes/[slug]`).
 *
 * Sempre navy. Existia aqui um ramo `variant="orange"` que nenhuma página
 * chegou a usar — foi removido junto com a faixa full-orange do Contato, para
 * que a violação não continuasse disponível. Para a bifurcação de peso
 * secundário, use `CTABlockBase` com `variant="quiet"`.
 */
export function CTABlock({
  title,
  description,
  primaryLabel = "Falar sobre minha operação",
  primaryHref = "/contato",
  secondaryLabel = "Falar pelo WhatsApp",
  secondaryHref = WHATSAPP_URL,
  hideSecondary = false,
  className,
}: CTABlockProps) {
  return (
    <section
      className={cn(
        "rc2-grain relative overflow-hidden rc2-section bg-rc2-dark",
        className
      )}
    >
      {/* Atmosfera: grid blueprint para profundidade sutil */}
      <div
        className="rc2-blueprint-dark pointer-events-none absolute inset-0 opacity-60"
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <ScrollReveal direction="none">
          <h2 className="rc2-h2 rc2-bold max-w-3xl mx-auto text-rc2-dark-text">
            {title}
          </h2>
        </ScrollReveal>
        {description && (
          <FadeIn className="rc2-body mt-4 max-w-2xl mx-auto text-rc2-dark-text-secondary">
            {description}
          </FadeIn>
        )}
        <ScrollReveal delay={120} distance="18px">
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <TrackedLink
              href={primaryHref}
              tracking={{
                kind: primaryHref.startsWith("https://wa.me") ? "whatsapp" : "cta",
                location: "cta_block_primary",
                label: "cta_block_primary",
                destination: primaryHref,
              }}
              className={buttonVariants({ variant: "brand", size: "brand-md" })}
            >
              {primaryLabel}
            </TrackedLink>
            {!hideSecondary && (
              <TrackedLink
                href={secondaryHref}
                target={secondaryHref.startsWith("http") ? "_blank" : undefined}
                rel={secondaryHref.startsWith("http") ? "noopener noreferrer" : undefined}
                tracking={{
                  kind: secondaryHref.startsWith("https://wa.me") ? "whatsapp" : "cta",
                  location: "cta_block_secondary",
                  label: "cta_block_secondary",
                  destination: secondaryHref,
                }}
                className="ui-focus-ring rounded-lg px-6 h-11 inline-flex items-center gap-1.5 border font-medium text-sm transition-[background-color,border-color,color,box-shadow] duration-200 border-rc2-dark-border text-rc2-dark-text hover:border-rc2-dark-text/80 hover:bg-rc2-dark-text/10 active:bg-rc2-dark-text/20 active:border-rc2-dark-text/90"
              >
                {secondaryLabel}
                <span>→</span>
              </TrackedLink>
            )}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
