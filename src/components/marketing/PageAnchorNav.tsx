"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface AnchorItem {
  id: string;
  label: string;
}

interface PageAnchorNavProps {
  items: AnchorItem[];
}

export function PageAnchorNav({ items }: PageAnchorNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        requestAnimationFrame(() => {
          toggleButtonRef.current?.focus();
        });
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = [
        toggleButtonRef.current,
        ...Array.from(
          menuRef.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
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
  }, [isOpen]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsOpen(false);
      requestAnimationFrame(() => {
        toggleButtonRef.current?.focus();
      });
    }
  };

  return (
    <div className="rc2-mobile-anchor-nav fixed z-40 flex flex-col-reverse gap-2 md:hidden">
      <button
        ref={toggleButtonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="ui-focus-ring w-full flex min-h-[44px] items-center justify-between gap-2 px-4 py-3 bg-rc2-dark text-rc2-dark-text rounded-lg font-semibold text-sm hover:bg-rc2-dark/90 transition-colors"
        aria-label={isOpen ? "Fechar navegação da página" : "Abrir navegação da página"}
        aria-expanded={isOpen}
        aria-controls="mobile-page-anchor-menu"
      >
        <span>Navegação</span>
        {isOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {isOpen && (
        <nav ref={menuRef} id="mobile-page-anchor-menu" className="bg-rc2-bg border border-border rounded-lg shadow-lg p-2 space-y-1">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className="ui-focus-ring flex min-h-[44px] w-full items-center rounded px-4 py-2.5 text-left text-sm text-rc2-text hover:bg-rc2-text/5 transition-colors"
            >
              {item.label}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
