"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type Stat = {
  /** Valor real, já documentado. O componente nunca arredonda nem extrapola. */
  value: number;
  /** Ex.: "US$ ", "" */
  prefix?: string;
  /** Ex.: " mil", "+" */
  suffix?: string;
  label: string;
};

/**
 * Stat/Counter (§8 Composites) — o único componente novo da direção de arte.
 *
 * Conta até o valor real ao entrar na viewport, uma vez, ease-out, sem loop.
 * O Safety Orange entra **ao completar a contagem**: a chegada no número é uma
 * mudança de estado real, que é exatamente o que autoriza a cor (Princípio 1).
 *
 * **O SSR renderiza o valor final**, mesma garantia do `KineticHeadline`. Antes
 * o `useState(0)` vazava para o HTML servido e, sem JS, os três números
 * apareciam como `US$ 0 mil`, `0` e `0+` — o `aria-label` cobria leitor de
 * tela, o olho humano não. A contagem é camada visual por cima de um número
 * que já está correto na marcação.
 *
 * `prefers-reduced-motion` e ausência de `IntersectionObserver` simplesmente
 * não animam — o número é a informação, a contagem é o enfeite.
 */
const DURATION_MS = 1200;

function easeOut(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function useCountUp(target: number) {
  const ref = useRef<HTMLDivElement>(null);
  /**
   * `null` significa "ainda não animou" e renderiza o valor final. É o que o
   * servidor emite e o que o cliente hidrata — sem divergência de hidratação e
   * sem piscar o número antes da contagem começar.
   */
  const [contagem, setContagem] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const node = ref.current;

    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    )?.matches;

    // Sem animação: o valor final já está renderizado, só falta marcar a
    // chegada para o Safety Orange entrar.
    if (!node || reduced || typeof IntersectionObserver === "undefined") {
      setDone(true);
      return;
    }

    let frame = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();

        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / DURATION_MS, 1);
          setContagem(Math.round(target * easeOut(progress)));
          if (progress < 1) frame = requestAnimationFrame(tick);
          else setDone(true);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [target]);

  return { ref, display: contagem ?? target, done };
}

function StatItem({ stat, variant }: { stat: Stat; variant: "light" | "dark" }) {
  const { ref, display, done } = useCountUp(stat.value);
  const isDark = variant === "dark";
  const formatted = display.toLocaleString("pt-BR");

  return (
    <div ref={ref}>
      {/*
        O valor final vive no `aria-label` para que leitor de tela e crawler
        recebam o número certo mesmo durante a contagem.
      */}
      <dd
        aria-label={`${stat.prefix ?? ""}${stat.value.toLocaleString("pt-BR")}${stat.suffix ?? ""}`}
        className={cn(
          "rc2-bold text-4xl leading-none tracking-[-0.015em] transition-colors duration-300 md:text-5xl",
          done
            ? "text-rc2-brand"
            : isDark
              ? "text-rc2-dark-text"
              : "text-rc2-heading"
        )}
      >
        <span aria-hidden>
          {stat.prefix}
          {formatted}
          {stat.suffix}
        </span>
      </dd>
      <dt
        className={cn(
          "mt-3 text-sm leading-relaxed",
          isDark ? "text-rc2-dark-text-secondary" : "text-rc2-text/75"
        )}
      >
        {stat.label}
      </dt>
    </div>
  );
}

interface StatCounterProps {
  stats: readonly Stat[];
  variant?: "light" | "dark";
  className?: string;
}

export function StatCounter({
  stats,
  variant = "light",
  className,
}: StatCounterProps) {
  return (
    <dl
      className={cn(
        "grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6",
        className
      )}
    >
      {stats.map((stat) => (
        <StatItem key={stat.label} stat={stat} variant={variant} />
      ))}
    </dl>
  );
}
