import { SectionLabel } from "@/components/ui/SectionLabel";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { cn } from "@/lib/utils";

interface PageHeroProps {
  label?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "light" | "dark";
  className?: string;
}

export function PageHero({
  label,
  title,
  description,
  action,
  variant = "light",
  className,
}: PageHeroProps) {
  const isDark = variant === "dark";

  return (
    <section
      className={cn(
        "rc2-grain relative overflow-hidden rc2-section",
        isDark ? "bg-rc2-dark text-rc2-dark-text" : "bg-rc2-bg text-rc2-text",
        className
      )}
    >
      {/* Atmosfera: grid blueprint + brilho laranja difuso */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 opacity-50",
          isDark ? "rc2-blueprint-dark" : "rc2-blueprint"
        )}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-rc2-brand/10 blur-3xl"
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {label && (
          <ScrollReveal distance="16px" duration={500}>
            <SectionLabel className={cn("rc2-rule", isDark && "text-rc2-brand")}>
              {label}
            </SectionLabel>
          </ScrollReveal>
        )}
        <ScrollReveal delay={90} distance="20px" duration={560}>
          <h1
            className={cn(
              "rc2-h1 mt-3 max-w-4xl",
              isDark ? "text-rc2-dark-text" : "text-rc2-heading"
            )}
          >
            {title}
          </h1>
        </ScrollReveal>
        {description && (
          <ScrollReveal delay={160} distance="20px" duration={560}>
            <p
              className={cn(
                "rc2-body-lg mt-5 max-w-2xl",
                isDark ? "text-rc2-dark-text-secondary" : "text-rc2-text/80"
              )}
            >
              {description}
            </p>
          </ScrollReveal>
        )}
        {action && (
          <ScrollReveal delay={230} distance="18px" duration={520}>
            <div className="mt-8">
              {action}
            </div>
          </ScrollReveal>
        )}
      </div>
    </section>
  );
}
