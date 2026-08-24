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
  const mobileMenuRef = useRef<HTMLDivElement>(null);
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
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = [
        mobileMenuButtonRef.current,
        ...Array.from(
          mobileMenuRef.current?.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          ) ?? []
        ),
      ].filter((element): element is HTMLElement => Boolean(element));

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-rc2-brand after:transition-opacity after:duration-300",
        scrolled
          ? "bg-rc2-bg/98 border-rc2-border shadow-[var(--shadow-soft)] backdrop-blur-md after:opacity-70"
          : "bg-rc2-bg/92 border-border backdrop-blur-sm after:opacity-0"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Logo />

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "ui-focus-ring rounded-full text-sm transition-[background-color,color,box-shadow] duration-200 px-3 py-1",
                  isActive(link.href)
                    ? "font-semibold text-rc2-brand-text bg-rc2-brand-text/10 ring-1 ring-rc2-brand-text/20"
                    : "font-medium text-rc2-text hover:text-rc2-brand-text hover:bg-rc2-text/5"
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
                "ml-2 font-semibold tracking-wide uppercase text-xs px-5 h-9 bg-rc2-brand text-rc2-heading hover:bg-rc2-brand/90 shadow-sm ring-1 ring-rc2-brand/20"
              )}
            >
              Solicitar diagnóstico
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button
            ref={mobileMenuButtonRef}
            className="ui-focus-ring rounded md:hidden p-2 -mr-2 text-rc2-text hover:text-rc2-brand-text transition-colors"
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
        <div ref={mobileMenuRef} id="mobile-main-menu" className="md:hidden bg-rc2-bg border-t border-border px-4 pb-4 pt-2">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "ui-focus-ring flex min-h-[44px] items-center rounded-sm py-2 text-sm transition-colors",
                  isActive(link.href)
                    ? "font-semibold text-rc2-brand-text"
                    : "font-medium text-rc2-text hover:text-rc2-brand-text"
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
                "mt-3 h-11 min-h-[44px] font-semibold tracking-wide uppercase text-xs w-full justify-center bg-rc2-brand text-rc2-heading hover:bg-rc2-brand/90"
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
