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
  variant?: "dark" | "orange";
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
  className,
}: CTABlockBaseProps) {
  const isDark = variant === "dark";

  return (
    <section
      className={cn(
        "rc2-grain relative overflow-hidden rc2-section",
        isDark ? "bg-rc2-dark" : "bg-rc2-brand",
        className
      )}
    >
      {/* Atmosfera: grid blueprint para profundidade sutil */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0",
          isDark ? "rc2-blueprint-dark opacity-60" : "rc2-blueprint-dark opacity-25"
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
              isDark ? "text-rc2-dark-text-secondary" : "text-rc2-heading"
            )}
          >
            {description}
          </FadeIn>
        )}
        <ScrollReveal delay={120} distance="18px">
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <TrackedLink
              href={primaryHref}
              tracking={primaryTracking || { kind: "cta", location: "cta_block", label: "primary" }}
              className={cn(
                buttonVariants({ variant: "default" }),
                "ui-focus-ring font-semibold tracking-wide uppercase text-xs px-8 h-11 bg-rc2-brand text-rc2-heading hover:bg-rc2-brand/90 active:bg-rc2-brand active:ring-1 active:ring-rc2-brand/50 transition-[background-color,color,box-shadow] duration-150",
                !isDark && "bg-rc2-bg text-rc2-brand-text hover:bg-rc2-bg/90 active:bg-rc2-bg active:ring-rc2-brand/50"
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
                  "ui-focus-ring rounded-lg px-6 h-11 inline-flex items-center gap-1.5 border font-medium text-sm transition-[background-color,border-color,color,box-shadow] duration-200",
                  isDark
                    ? "border-rc2-dark-border text-rc2-dark-text hover:border-rc2-dark-text/80 hover:bg-rc2-dark-text/10 active:bg-rc2-dark-text/20 active:border-rc2-dark-text/90"
                    : "border-rc2-heading/40 text-rc2-heading hover:border-rc2-heading/80 hover:bg-rc2-heading/10 active:bg-rc2-heading/20 active:border-rc2-heading/90"
                )}
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
