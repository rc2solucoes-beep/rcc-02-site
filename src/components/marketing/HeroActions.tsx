"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
 *
 * Hierarquia (docs/proposta-visual-hero-v2.md D5/D6): uma ação principal
 * preenchida e uma secundária em forma de link, ambas com alvo ≥ 44px. O
 * deslocamento de 1px ao pressionar e o da seta só existem com movimento
 * permitido.
 */
export function HeroActions() {
  const primary = HOME_CTAS.heroPrimary;
  const secondary = HOME_CTAS.heroSecondary;

  return (
    <div className="flex flex-col items-stretch gap-1 min-[560px]:flex-row min-[560px]:items-center min-[560px]:gap-5">
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
          "rc2-hero-cta px-6 text-[1.0625rem] normal-case tracking-normal hover:bg-rc2-brand-hover active:bg-rc2-brand-hover"
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
        className="rc2-hero-cta group inline-flex min-h-11 items-center justify-center gap-2 rounded-sm px-1 text-[1.0625rem] font-semibold leading-tight text-rc2-heading underline decoration-1 underline-offset-[0.3em] transition-colors duration-150 hover:decoration-2 active:text-rc2-brand-text min-[560px]:justify-start motion-safe:active:translate-y-px"
      >
        {secondary.label}
        <ArrowRight
          size={18}
          aria-hidden
          className="motion-safe:transition-transform motion-safe:duration-150 motion-safe:group-hover:translate-x-[3px] motion-safe:group-focus-visible:translate-x-[3px]"
        />
      </Link>
    </div>
  );
}
