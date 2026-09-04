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
 * `prefers-reduced-motion` e ausência de `IntersectionObserver` caem no valor
 * final imediatamente — o número é a informação, a contagem é o enfeite.
 */
const DURATION_MS = 1200;

function easeOut(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function useCountUp(target: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [display, setDisplay] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const node = ref.current;
    const settle = () => {
      setDisplay(target);
      setDone(true);
    };

    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    )?.matches;

    if (!node || reduced || typeof IntersectionObserver === "undefined") {
      settle();
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
          setDisplay(Math.round(target * easeOut(progress)));
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

  return { ref, display, done };
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
