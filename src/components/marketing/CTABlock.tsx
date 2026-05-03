import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
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
        "py-16 md:py-20",
        isDark ? "bg-rc2-ink" : "bg-rc2-orange",
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <h2
          className={cn(
            "rc2-display text-3xl md:text-5xl max-w-3xl mx-auto",
            isDark ? "text-rc2-sand" : "text-rc2-sand"
          )}
        >
          {title}
        </h2>
        {description && (
          <p
            className={cn(
              "mt-4 text-lg max-w-2xl mx-auto leading-relaxed",
              isDark ? "text-rc2-sand/70" : "text-rc2-sand/90"
            )}
          >
            {description}
          </p>
        )}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href={primaryHref}
            className={cn(
              buttonVariants({ variant: "default" }),
              "font-semibold tracking-wide uppercase text-xs px-8 h-11 bg-rc2-orange text-rc2-sand hover:bg-rc2-orange/90",
              !isDark && "bg-rc2-sand text-rc2-orange hover:bg-rc2-sand/90"
            )}
          >
            {primaryLabel}
          </Link>
          {!hideSecondary && (
            <Link
              href={secondaryHref}
              target={secondaryHref.startsWith("http") ? "_blank" : undefined}
              rel={secondaryHref.startsWith("http") ? "noopener noreferrer" : undefined}
              className={cn(
                "ui-focus-ring rounded-sm text-sm font-medium underline underline-offset-4 transition-opacity hover:opacity-70",
                isDark ? "text-rc2-sand/60" : "text-rc2-sand/90"
              )}
            >
              {secondaryLabel} →
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
