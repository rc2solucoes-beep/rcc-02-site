"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trackCtaClick, trackWhatsappClick } from "@/lib/tracking";

const HOME_WHATSAPP_MESSAGE =
  "Olá, quero entender onde a IA e automações podem ajudar minha empresa.";
const WHATSAPP_URL = `https://wa.me/5511988028550?text=${encodeURIComponent(HOME_WHATSAPP_MESSAGE)}`;

interface HeroActionsProps {
  variant: "a" | "b";
}

export function HeroActions({ variant }: HeroActionsProps) {
  return (
    <div className="mt-8 flex flex-col sm:flex-row gap-4">
      <Link
        href="/contato"
        onClick={() =>
          trackCtaClick({
            location: `hero_${variant}`,
            label: "solicitar_diagnostico",
            destination: "/contato",
          })
        }
        className={cn(
          buttonVariants({ variant: "default" }),
          "font-semibold tracking-wide uppercase text-xs px-8 h-12 bg-rc2-brand text-rc2-heading hover:bg-rc2-brand/90"
        )}
      >
        Solicitar diagnóstico
      </Link>
      <Link
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() =>
          trackWhatsappClick({
            location: `hero_${variant}`,
            label: "falar_no_whatsapp",
            destination: WHATSAPP_URL,
          })
        }
        className={cn(
          buttonVariants({ variant: "outline" }),
          "font-semibold tracking-wide uppercase text-xs px-8 h-12 border-rc2-text text-rc2-text hover:bg-rc2-text hover:text-rc2-dark-text"
        )}
      >
        Falar pelo WhatsApp
      </Link>
    </div>
  );
}
