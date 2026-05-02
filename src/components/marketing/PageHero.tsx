import { SectionLabel } from "@/components/ui/SectionLabel";
import { cn } from "@/lib/utils";

interface PageHeroProps {
  label?: string;
  title: string;
  description?: string;
  variant?: "light" | "dark";
  className?: string;
}

export function PageHero({
  label,
  title,
  description,
  variant = "light",
  className,
}: PageHeroProps) {
  const isDark = variant === "dark";

  return (
    <section
      className={cn(
        "py-16 md:py-20",
        isDark ? "bg-rc2-ink text-rc2-sand" : "bg-rc2-sand text-rc2-ebony",
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {label && (
          <SectionLabel className={isDark ? "text-rc2-orange" : undefined}>
            {label}
          </SectionLabel>
        )}
        <h1
          className={cn(
            "rc2-display text-4xl md:text-6xl mt-3 max-w-3xl",
            isDark ? "text-rc2-sand" : "text-rc2-ebony"
          )}
        >
          {title}
        </h1>
        {description && (
          <p
            className={cn(
              "mt-4 text-lg max-w-2xl leading-relaxed",
              isDark ? "text-rc2-sand/70" : "text-rc2-ebony/70"
            )}
          >
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
