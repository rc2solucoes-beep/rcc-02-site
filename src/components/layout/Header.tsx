"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trackCtaClick } from "@/lib/tracking";

const navLinks = [
  { href: "/", label: "Início" },
  { href: "/servicos", label: "Serviços" },
  { href: "/solucoes-com-ia", label: "Soluções com IA" },
  { href: "/sobre", label: "Sobre" },
  { href: "/blog", label: "Blog" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        requestAnimationFrame(() => {
          mobileMenuButtonRef.current?.focus();
        });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-all duration-300",
        scrolled
          ? "bg-background/95 border-border shadow-[0_14px_36px_-28px_rgba(0,0,0,0.65)] backdrop-blur-md"
          : "bg-background/88 border-border backdrop-blur-sm"
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rc2-orange/70 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Logo />

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "ui-focus-ring rounded-full text-sm transition-all duration-200 px-3 py-1.5",
                  isActive(link.href)
                    ? "font-semibold text-primary bg-primary/14 ring-1 ring-primary/35"
                    : "font-medium text-foreground/88 hover:text-foreground hover:bg-foreground/5"
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/contato"
              onClick={() =>
                trackCtaClick({
                  location: "header_desktop",
                  label: "diagnostico_gratuito",
                  destination: "/contato",
                })
              }
              className={cn(
                buttonVariants({ variant: "default" }),
                "ml-3 font-semibold tracking-[0.08em] uppercase text-[11px] px-5 h-9 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_10px_28px_-18px_rgba(80,70,228,0.9)] ring-1 ring-primary/25"
              )}
            >
              Solicitar diagnóstico
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button
            ref={mobileMenuButtonRef}
            className="ui-focus-ring rounded md:hidden p-2 -mr-2 text-foreground/88 hover:text-primary transition-colors"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            aria-controls="mobile-main-menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div id="mobile-main-menu" className="md:hidden bg-background border-t border-border px-4 pb-4 pt-3">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "ui-focus-ring rounded-md px-2 py-2.5 text-sm transition-colors",
                  isActive(link.href)
                    ? "font-semibold text-primary bg-primary/10"
                    : "font-medium text-foreground/88 hover:text-foreground hover:bg-foreground/5"
                )}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/contato"
              onClick={() => {
                trackCtaClick({
                  location: "header_mobile",
                  label: "diagnostico_gratuito",
                  destination: "/contato",
                });
                setOpen(false);
              }}
              className={cn(
                buttonVariants({ variant: "default" }),
                "mt-3 font-semibold tracking-[0.08em] uppercase text-[11px] w-full justify-center bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              Solicitar diagnóstico
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
