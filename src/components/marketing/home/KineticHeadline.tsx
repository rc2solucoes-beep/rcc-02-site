"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Gesto cinético do hero (§8 Sections, §9 Home) — a maior mudança do sistema.
 *
 * O mecanismo: a palavra troca uma vez, de forma deliberada e legível, e o
 * Safety Orange marca **o instante da troca** — não é enfeite, é o único frame
 * em que algo muda de estado (Princípio 1).
 *
 * Três garantias importantes:
 *
 * 1. **O SSR renderiza a copy aprovada**, com a palavra final já no lugar. Sem
 *    JS, com `prefers-reduced-motion` ou para o crawler, o H1 é exatamente
 *    `HOME_COPY.h1`. A animação só existe depois da hidratação.
 * 2. **A sequência termina na palavra aprovada**, nunca numa provisória.
 * 3. O elemento vivo é `aria-hidden` durante a troca e o H1 carrega a frase
 *    completa em `aria-label`, para o leitor de tela não ouvir a palavra
 *    mudando no meio da leitura.
 *
 * A lista de palavras alternadas foi aprovada em 03/09/2026 e vive em
 * `HOME_HERO_KINETIC` (`lib/content/home.ts`), junto com o flag que registra a
 * aprovação. O mecanismo de motion não muda com ela: gesto único, sem loop.
 */
const SWAP_MS = 520;
const HOLD_MS = 900;

interface KineticHeadlineProps {
  /** Texto antes da palavra que troca. */
  prefix: string;
  /** Palavra aprovada — primeiro e último frame da sequência. */
  word: string;
  /** Texto depois da palavra que troca. */
  suffix: string;
  /** Palavras provisórias exibidas antes de voltar à aprovada. */
  alternates: readonly string[];
  /** Frase completa aprovada, para leitores de tela. */
  fullText: string;
  className?: string;
}

export function KineticHeadline({
  prefix,
  word,
  suffix,
  alternates,
  fullText,
  className,
}: KineticHeadlineProps) {
  const [current, setCurrent] = useState(word);
  const [swapping, setSwapping] = useState(false);

  useEffect(() => {
    if (alternates.length === 0) return;

    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    )?.matches;
    if (reduced) return;

    // Sequência: provisórias, uma a uma, e volta para a palavra aprovada.
    const sequence = [...alternates, word];
    const timers: ReturnType<typeof setTimeout>[] = [];
    let elapsed = HOLD_MS;

    for (const next of sequence) {
      timers.push(setTimeout(() => setSwapping(true), elapsed));
      timers.push(
        setTimeout(() => {
          setCurrent(next);
          setSwapping(false);
        }, elapsed + SWAP_MS / 2)
      );
      elapsed += HOLD_MS + SWAP_MS;
    }

    return () => timers.forEach(clearTimeout);
  }, [alternates, word]);

  return (
    <h1 className={className} aria-label={fullText}>
      <span aria-hidden>
        {prefix}
        <span
          className={cn(
            "inline-block transition-[color,opacity,transform] ease-in-out",
            // O laranja aparece só no frame da troca. Fora dele, a palavra é
            // parte do título e não compete com o resto da frase.
            swapping
              ? "text-rc2-brand opacity-0 -translate-y-1"
              : "text-rc2-heading opacity-100 translate-y-0"
          )}
          style={{ transitionDuration: `${SWAP_MS / 2}ms` }}
        >
          {current}
        </span>
        {suffix}
      </span>
    </h1>
  );
}
