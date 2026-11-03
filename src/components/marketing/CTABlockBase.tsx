import { ArrowUpRight } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { FadeIn } from "@/components/ui/FadeIn";
import { TrackedLink } from "@/components/tracking/TrackedLink";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface CTABlockBaseProps {
  title: string;
  description?: string;
  primaryLabel: string;
  primaryHref: string;
  primaryTracking?: {
    kind: "cta" | "whatsapp";
    location: string;
    label: string;
    destination?: string;
  };
  secondaryLabel?: string;
  secondaryHref?: string;
  secondaryTracking?: {
    kind: "cta" | "whatsapp";
    location: string;
    label: string;
    destination?: string;
  };
  hideSecondary?: boolean;
  /**
   * `dark` é a banda de fechamento com peso total.
   * `quiet` é a bifurcação de conveniência: mesma anatomia, peso secundário.
   * Substitui a antiga `orange` — uma banda full-bleed em Safety Orange violava
   * a regra inviolável nº 9 (laranja abaixo de 10% da área) e competia com o
   * formulário do Contato, que é a ação real da página.
   */
  variant?: "dark" | "quiet";
  /**
   * `default` mantém a apresentação original.
   * `home` é o refinamento do CTA final da Home: malha mais discreta, ações
   * empilhadas e WhatsApp como link auxiliar textual.
   */
  presentation?: "default" | "home";
  className?: string;
}

export function CTABlockBase({
  title,
  description,
  primaryLabel,
  primaryHref,
  primaryTracking,
  secondaryLabel = "Falar pelo WhatsApp",
  secondaryHref = "https://wa.me/5511988028550",
  secondaryTracking,
  hideSecondary = false,
  variant = "dark",
  presentation = "default",
  className,
}: CTABlockBaseProps) {
  const isDark = variant === "dark";
  const isHome = presentation === "home";

  return (
    <section
      className={cn(
        "rc2-grain relative overflow-hidden rc2-section",
        isDark
          ? "bg-rc2-dark"
          : "border-y border-rc2-border bg-rc2-bg-alt",
        className
      )}
    >
      {/* Atmosfera: grid blueprint para profundidade sutil */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0",
          isDark
            ? cn("rc2-blueprint-dark", isHome ? "opacity-20" : "opacity-60")
            : "rc2-blueprint opacity-40"
        )}
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <ScrollReveal direction="none">
          <h2
            className={cn(
              "rc2-h2 rc2-bold max-w-3xl mx-auto",
              isDark ? "text-rc2-dark-text" : "text-rc2-heading"
            )}
          >
            {title}
          </h2>
        </ScrollReveal>
        {description && (
          <FadeIn
            className={cn(
              "rc2-body mt-4 max-w-2xl mx-auto",
              isDark ? "text-rc2-dark-text-secondary" : "text-rc2-text"
            )}
          >
            {description}
          </FadeIn>
        )}
        <ScrollReveal delay={120} distance="18px">
          <div
            className={cn(
              "mt-8 flex flex-col items-center justify-center",
              isHome ? "gap-3" : "sm:flex-row gap-4"
            )}
          >
            <TrackedLink
              href={primaryHref}
              tracking={primaryTracking || { kind: "cta", location: "cta_block", label: "primary" }}
              className={cn(
                buttonVariants({ variant: "brand", size: "brand-md" }),
                isHome &&
                  "normal-case tracking-normal text-[17px] font-semibold min-h-12 h-auto py-3 px-6 w-full sm:w-auto sm:min-w-[20rem] max-w-full whitespace-normal text-center hover:bg-rc2-brand-hover active:bg-rc2-brand-hover"
              )}
            >
              {primaryLabel}
            </TrackedLink>
            {!hideSecondary && secondaryHref && (
              <TrackedLink
                href={secondaryHref}
                target={secondaryHref.startsWith("http") ? "_blank" : undefined}
                rel={secondaryHref.startsWith("http") ? "noopener noreferrer" : undefined}
                tracking={secondaryTracking || { kind: "cta", location: "cta_block", label: "secondary" }}
                className={cn(
                  isHome
                    ? "ui-focus-ring rounded-sm inline-flex min-h-11 items-center justify-center gap-2 py-2 text-base underline underline-offset-4 transition-colors duration-150 text-rc2-dark-text-secondary hover:text-rc2-dark-text"
                    : "ui-focus-ring rounded-lg px-6 h-11 inline-flex items-center gap-1.5 border font-medium text-sm transition-[background-color,border-color,color,box-shadow] duration-200",
                  !isHome &&
                    (isDark
                      ? "border-rc2-dark-border text-rc2-dark-text hover:border-rc2-dark-text/80 hover:bg-rc2-dark-text/10 active:bg-rc2-dark-text/20 active:border-rc2-dark-text/90"
                      : "border-rc2-heading/40 text-rc2-heading hover:border-rc2-heading/80 hover:bg-rc2-heading/10 active:bg-rc2-heading/20 active:border-rc2-heading/90")
                )}
              >
                {secondaryLabel}
                {isHome ? (
                  <ArrowUpRight size={16} aria-hidden="true" />
                ) : (
                  <span>→</span>
                )}
              </TrackedLink>
            )}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
