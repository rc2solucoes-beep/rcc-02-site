"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/tracking";

const WHATSAPP_URL = "https://wa.me/5511988028550";

interface HeroActionsProps {
  variant: "a" | "b";
}

export function HeroActions({ variant }: HeroActionsProps) {
  return (
    <div className="mt-8 flex flex-col sm:flex-row gap-4">
      <Link
        href="/contato"
        onClick={() => trackEvent("cta_click_hero", { variant, target: "contato", label: "solicitar_diagnostico" })}
        className={cn(
          buttonVariants({ variant: "default" }),
          "font-semibold tracking-wide uppercase text-xs px-8 h-12 bg-rc2-orange text-rc2-sand hover:bg-rc2-orange/90"
        )}
      >
        Solicitar diagnóstico
      </Link>
      <Link
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackEvent("whatsapp_click", { variant, location: "hero", label: "falar_no_whatsapp" })}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "font-semibold tracking-wide uppercase text-xs px-8 h-12 border-rc2-ebony text-rc2-ebony hover:bg-rc2-ebony hover:text-rc2-sand"
        )}
      >
        Falar no WhatsApp
      </Link>
    </div>
  );
}

