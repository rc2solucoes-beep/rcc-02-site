"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trackCtaClick } from "@/lib/tracking";
import { NAV_LINKS } from "@/lib/content/navigation";

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

  // Ao passar para o desktop o menu recolhido deixa de existir: fecha, o que
  // também cancela a animação em curso (cleanup do efeito de abertura).
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
    };
    desktop.addEventListener("change", onChange);
    return () => desktop.removeEventListener("change", onChange);
  }, []);

  // Abertura em 170ms (opacity + translateY 6px) via WAAPI, sem animar altura;
  // o fechamento é imediato (o menu sai do DOM). Cancelada em toda troca de
  // estado e no unmount; com movimento reduzido, não anima.
  useEffect(() => {
    const menu = mobileMenuRef.current;
    if (!open || !menu) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const animation = menu.animate(
      [
        { opacity: 0, transform: "translateY(-6px)" },
        { opacity: 1, transform: "none" },
      ],
      { duration: 170, easing: "ease-out" }
    );
    return () => animation.cancel();
  }, [open]);

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
        <div className="flex h-[4.25rem] items-center justify-between lg:h-[4.75rem]">
          <Logo crop />

          {/* Desktop nav */}
          {/* `lg`, não `md`: com seis itens mais o CTA, a nav desktop passava
              de 768px e criava overflow horizontal em toda página. Em tablet o
              menu recolhido é o comportamento correto. */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className="rc2-nav-link ui-focus-ring rounded-sm"
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
                buttonVariants({ variant: "brand", size: "brand-sm" }),
                "rc2-header-cta ml-3 h-11 rounded-lg px-5 text-base normal-case tracking-normal hover:bg-rc2-brand-hover active:bg-rc2-brand-hover"
              )}
            >
              Falar com a RC2
            </Link>
          </nav>

          {/* Mobile hamburger. `aria-controls` só aponta para o menu enquanto
              ele existe no DOM. */}
          <button
            ref={mobileMenuButtonRef}
            className="ui-focus-ring -mr-3 inline-flex size-12 items-center justify-center rounded-lg text-rc2-heading lg:hidden"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            aria-controls={open ? "mobile-main-menu" : undefined}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu: sobrepõe o conteúdo abaixo do cabeçalho, como no protótipo.
          O limite de altura mantém o CTA alcançável em telas baixas. */}
      {open && (
        <div
          ref={mobileMenuRef}
          id="mobile-main-menu"
          className="absolute inset-x-0 top-full max-h-[calc(100dvh-4.25rem)] overflow-y-auto border-b border-rc2-border bg-rc2-bg lg:hidden"
        >
          <div className="mx-auto max-w-7xl px-4 pb-5 pt-2 sm:px-6">
            <nav className="flex flex-col">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={cn(
                    "ui-focus-ring flex min-h-12 items-center border-b border-rc2-border-soft text-lg",
                    isActive(link.href)
                      ? "font-semibold text-rc2-brand-text"
                      : "font-medium text-rc2-text hover:text-rc2-heading"
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
                  buttonVariants({ variant: "brand", size: "brand-md" }),
                  "rc2-header-cta mt-5 h-12 w-full justify-center text-base normal-case tracking-normal hover:bg-rc2-brand-hover active:bg-rc2-brand-hover"
                )}
              >
                Falar com a RC2
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
