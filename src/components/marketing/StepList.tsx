import { cn } from "@/lib/utils";

export type Step = {
  title: string;
  description: string;
};

interface StepListProps {
  steps: Step[];
  variant?: "light" | "dark";
  className?: string;
}

export function StepList({ steps, variant = "light", className }: StepListProps) {
  const isDark = variant === "dark";

  return (
    <ol className={cn("space-y-0 divide-y", isDark ? "divide-rc2-dark-border" : "divide-border", className)}>
      {steps.map((step, i) => (
        <li key={i} className="flex gap-6 py-6 first:pt-0 last:pb-0">
          <span
            className={cn(
              "rc2-bold text-4xl md:text-5xl leading-none shrink-0 w-10 text-right",
              isDark ? "text-rc2-brand/30" : "text-rc2-brand-text/20"
            )}
            aria-hidden
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          <div>
            <h3
              className={cn(
                "font-semibold mb-1",
                isDark ? "text-rc2-dark-text" : "text-rc2-heading"
              )}
            >
              {step.title}
            </h3>
            <p
              className={cn(
                "text-sm leading-relaxed",
                isDark ? "text-rc2-dark-text-secondary" : "text-rc2-text/75"
              )}
            >
              {step.description}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
