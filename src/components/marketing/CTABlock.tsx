import { buttonVariants } from "@/components/ui/button";
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
  variant?: "dark" | "orange";
  className?: string;
}

const WHATSAPP_URL = "https://wa.me/5511988028550";

export function CTABlock({
  title,
  description,
  primaryLabel = "Solicitar diagnóstico",
  primaryHref = "/contato",
  secondaryLabel = "Falar pelo WhatsApp",
  secondaryHref = WHATSAPP_URL,
  hideSecondary = false,
  variant = "dark",
  className,
}: CTABlockProps) {
  const isDark = variant === "dark";

  return (
    <section
      className={cn(
        "relative overflow-hidden rc2-section",
        isDark ? "bg-rc2-ink" : "bg-rc2-orange",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-55 [background:radial-gradient(circle_at_15%_20%,rgba(80,70,228,0.22),transparent_38%),radial-gradient(circle_at_85%_80%,rgba(80,70,228,0.16),transparent_42%)]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <h2
          className={cn(
            "rc2-h2 rc2-display max-w-3xl mx-auto",
            isDark ? "text-rc2-sand" : "text-rc2-sand"
          )}
        >
          {title}
        </h2>
        {description && (
          <p
            className={cn(
              "rc2-body mt-4 max-w-2xl mx-auto",
              isDark ? "text-rc2-sand/85" : "text-rc2-sand/95"
            )}
          >
            {description}
          </p>
        )}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <TrackedLink
            href={primaryHref}
            tracking={{
              kind: primaryHref.startsWith("https://wa.me") ? "whatsapp" : "cta",
              location: "cta_block_primary",
              label: "cta_block_primary",
              destination: primaryHref,
            }}
            className={cn(
              buttonVariants({ variant: "default" }),
              "ui-focus-ring font-semibold tracking-[0.08em] uppercase text-[11px] px-8 h-11 bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary active:ring-1 active:ring-primary/50 transition-all duration-150 shadow-[0_12px_30px_-22px_rgba(80,70,228,0.95)]",
              !isDark && "bg-rc2-sand text-rc2-orange hover:bg-rc2-sand/90 active:bg-rc2-sand active:ring-rc2-orange/50"
            )}
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
              className={cn(
                "ui-focus-ring rounded-lg px-6 h-11 inline-flex items-center gap-1.5 border font-medium text-sm transition-all duration-200",
                isDark
                  ? "border-rc2-sand/40 text-rc2-sand hover:border-rc2-sand/80 hover:bg-rc2-sand/10 active:bg-rc2-sand/20 active:border-rc2-sand/90"
                  : "border-rc2-ebony/40 text-rc2-ebony hover:border-rc2-ebony/80 hover:bg-rc2-ebony/10 active:bg-rc2-ebony/20 active:border-rc2-ebony/90"
              )}
            >
              {secondaryLabel}
              <span>→</span>
            </TrackedLink>
          )}
        </div>
      </div>
    </section>
  );
}
