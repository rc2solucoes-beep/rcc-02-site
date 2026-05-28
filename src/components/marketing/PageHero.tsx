import { SectionLabel } from "@/components/ui/SectionLabel";
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
        "relative overflow-hidden rc2-section",
        isDark ? "bg-rc2-ink text-rc2-sand" : "bg-rc2-sand text-rc2-ebony",
        className
      )}
    >
      <div className={cn(
        "pointer-events-none absolute inset-0",
        isDark
          ? "[background:radial-gradient(circle_at_14%_10%,rgba(80,70,228,0.16),transparent_36%),radial-gradient(circle_at_86%_84%,rgba(80,70,228,0.12),transparent_44%)]"
          : "[background:radial-gradient(circle_at_14%_10%,rgba(80,70,228,0.10),transparent_34%),radial-gradient(circle_at_86%_84%,rgba(80,70,228,0.07),transparent_44%)]"
      )} />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {label && (
          <SectionLabel className={isDark ? "text-rc2-orange" : undefined}>
            {label}
          </SectionLabel>
        )}
        <h1
          className={cn(
            "rc2-h1 mt-3 max-w-4xl",
            isDark ? "text-rc2-sand" : "text-rc2-ebony"
          )}
        >
          {title}
        </h1>
        {description && (
          <p
            className={cn(
              "rc2-body-lg mt-5 max-w-2xl",
              isDark ? "text-rc2-sand/85" : "text-rc2-ebony/80"
            )}
          >
            {description}
          </p>
        )}
        {action && (
          <div className="mt-8">
            {action}
          </div>
        )}
      </div>
    </section>
  );
}
