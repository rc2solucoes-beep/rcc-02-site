"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trackCtaClick } from "@/lib/tracking";
import { HOME_CTAS } from "@/lib/content/home";

/**
 * CTAs do hero da Home.
 *
 * O experimento A/B (`?hero=a` / `?hero=b`) foi encerrado na Fase 4: existe
 * uma única versão oficial. As séries de analytics `hero_a` e `hero_b` estão
 * encerradas e não são reutilizadas.
 *
 * O label do CTA primário permanece o identificador histórico
 * `solicitar_diagnostico`, apesar da nova copy visível — ver docs/10.
 */
export function HeroActions() {
  const primary = HOME_CTAS.heroPrimary;
  const secondary = HOME_CTAS.heroSecondary;

  return (
    <div className="mt-8 flex flex-col sm:flex-row gap-4">
      <Link
        href={primary.href}
        onClick={() =>
          trackCtaClick({
            location: "home_hero",
            label: primary.analyticsLabel,
            destination: primary.href,
          })
        }
        className={cn(
          buttonVariants({ variant: "brand", size: "brand-lg" }),
          "px-8"
        )}
      >
        {primary.label}
      </Link>
      <Link
        href={secondary.href}
        onClick={() =>
          trackCtaClick({
            location: "home_hero",
            label: secondary.analyticsLabel,
            destination: secondary.href,
          })
        }
        className={cn(
          buttonVariants({ variant: "outline" }),
          "font-semibold tracking-wide uppercase text-xs px-8 h-12 border-rc2-text text-rc2-text hover:bg-rc2-text hover:text-rc2-dark-text"
        )}
      >
        {secondary.label}
      </Link>
    </div>
  );
}
