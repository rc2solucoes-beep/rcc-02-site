"use client";

import {
  CSSProperties,
  ReactNode,
  useEffect,
  useRef,
  type Ref,
  type TransitionEvent,
} from "react";
import { cn } from "@/lib/utils";

interface ScrollRevealProps {
  children: ReactNode;
  as?: "div" | "li" | "article";
  className?: string;
  id?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: string;
  duration?: number;
  once?: boolean;
  threshold?: number;
}

const directionVector: Record<
  NonNullable<ScrollRevealProps["direction"]>,
  { x: string; y: string }
> = {
  up: { x: "0px", y: "var(--scroll-reveal-distance)" },
  down: { x: "0px", y: "calc(var(--scroll-reveal-distance) * -1)" },
  left: { x: "var(--scroll-reveal-distance)", y: "0px" },
  right: { x: "calc(var(--scroll-reveal-distance) * -1)", y: "0px" },
  none: { x: "0px", y: "0px" },
};

export function ScrollReveal({
  children,
  as: Component = "div",
  className,
  id,
  delay = 0,
  direction = "up",
  distance = "24px",
  duration = 600,
  once = true,
  threshold = 0.15,
}: ScrollRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const vector = directionVector[direction];

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      element.dataset.revealState = "visible";
      return;
    }

    element.dataset.revealState = "hidden";

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry || (!entry.isIntersecting && entry.intersectionRatio < threshold)) {
          if (!once) {
            element.dataset.revealState = "hidden";
          }
          return;
        }

        element.dataset.revealAnimating = "true";
        element.dataset.revealState = "visible";

        if (once) {
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [once, threshold]);

  const style = {
    "--scroll-reveal-delay": `${delay}ms`,
    "--scroll-reveal-duration": `${duration}ms`,
    "--scroll-reveal-distance": distance,
    "--scroll-reveal-x": vector.x,
    "--scroll-reveal-y": vector.y,
  } as CSSProperties;

  const props = {
    id,
    className: cn("scroll-reveal", className),
    "data-reveal-state": "visible",
    style,
    onTransitionEnd: (event: TransitionEvent<HTMLElement>) => {
      event.currentTarget.removeAttribute("data-reveal-animating");
    },
  };

  if (Component === "li") {
    return (
      <li ref={ref as Ref<HTMLLIElement>} {...props}>
        {children}
      </li>
    );
  }

  if (Component === "article") {
    return (
      <article ref={ref as Ref<HTMLElement>} {...props}>
        {children}
      </article>
    );
  }

  return (
    <div ref={ref as Ref<HTMLDivElement>} {...props}>
      {children}
    </div>
  );
}
