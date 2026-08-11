"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";

interface AnchorItem {
  id: string;
  label: string;
}

interface PageAnchorNavProps {
  items: AnchorItem[];
}

export function PageAnchorNav({ items }: PageAnchorNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsOpen(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-rc2-dark text-rc2-dark-text rounded-lg font-semibold text-sm hover:bg-rc2-dark/90 transition-colors"
        aria-label="Toggle navigation menu"
      >
        <span>Navegação</span>
        {isOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {isOpen && (
        <nav className="mt-2 bg-rc2-bg border border-border rounded-lg shadow-lg p-2 space-y-1">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className="w-full text-left px-4 py-2.5 text-sm text-rc2-text hover:bg-rc2-text/5 rounded transition-colors"
            >
              {item.label}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
