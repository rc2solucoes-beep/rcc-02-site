"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Início" },
  { href: "/servicos", label: "Serviços" },
  { href: "/solucoes-com-ia", label: "Soluções com IA" },
  { href: "/sobre", label: "Sobre" },
  { href: "/blog", label: "Blog" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-50 bg-rc2-sand/95 backdrop-blur-sm border-b border-border">
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
                  "ui-focus-ring rounded-full text-sm transition-all duration-200 px-3 py-1",
                  isActive(link.href)
                    ? "font-semibold text-rc2-orange bg-rc2-orange/10 ring-1 ring-rc2-orange/20"
                    : "font-medium text-rc2-ebony hover:text-rc2-orange hover:bg-rc2-ebony/5"
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/contato"
              className={cn(
                buttonVariants({ variant: "default" }),
                "ml-2 font-semibold tracking-wide uppercase text-xs px-5 h-9 bg-rc2-orange text-rc2-sand hover:bg-rc2-orange/90"
              )}
            >
              Diagnóstico Gratuito
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button
            className="ui-focus-ring rounded md:hidden p-2 -mr-2 text-rc2-ebony hover:text-rc2-orange transition-colors"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-rc2-sand border-t border-border px-4 pb-4 pt-2">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "ui-focus-ring rounded-sm py-2 text-sm transition-colors",
                  isActive(link.href)
                    ? "font-semibold text-rc2-orange"
                    : "font-medium text-rc2-ebony hover:text-rc2-orange"
                )}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/contato"
              className={cn(
                buttonVariants({ variant: "default" }),
                "mt-3 font-semibold tracking-wide uppercase text-xs w-full justify-center bg-rc2-orange text-rc2-sand hover:bg-rc2-orange/90"
              )}
              onClick={() => setOpen(false)}
            >
              Diagnóstico Gratuito
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
