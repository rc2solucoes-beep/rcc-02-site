"use client";

import { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export function FadeIn({
  children,
  delay = 0,
  duration = 400,
  className,
}: FadeInProps) {
  const style = {
    "--fade-in-delay": `${delay}ms`,
    "--fade-in-duration": `${duration}ms`,
  } as CSSProperties;

  return (
    <div
      className={cn("fade-in", className)}
      style={style}
    >
      {children}
    </div>
  );
}
