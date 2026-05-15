"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

export interface TocHeading {
  id: string;
  text: string;
}

interface TableOfContentsProps {
  headings: TocHeading[];
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(true); // SSR-safe default: mobile-first

  // Detecta viewport e atualiza em resize
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, []);

  // Scroll tracking — destaca heading ativo
  useEffect(() => {
    if (headings.length === 0) return;
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 120;
      for (let i = headings.length - 1; i >= 0; i--) {
        const el = document.getElementById(headings[i].id);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveId(headings[i].id);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [headings]);

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setActiveId(id);
      setIsOpen(false);
    }
  };

  if (headings.length === 0) return null;

  const navItems = (
    <ul className="space-y-0.5">
      {headings.map((heading) => (
        <li key={heading.id}>
          <button
            onClick={() => handleClick(heading.id)}
            className={`text-sm w-full text-left px-3 py-2 rounded transition-colors ${
              activeId === heading.id
                ? "text-rc2-orange font-medium bg-rc2-orange/5"
                : "text-rc2-ebony/70 hover:text-rc2-ebony hover:bg-rc2-ebony/5"
            }`}
          >
            {heading.text}
          </button>
        </li>
      ))}
    </ul>
  );

  // Mobile: colapsível
  if (isMobile) {
    return (
      <div className="mb-6 border border-border rounded bg-white overflow-hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-rc2-ebony/[0.02] transition-colors"
        >
          <span className="text-xs font-semibold text-rc2-ebony/50 uppercase tracking-widest">
            Neste artigo
          </span>
          <ChevronDown
            size={14}
            className={`text-rc2-ebony/40 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
        {isOpen && (
          <nav className="border-t border-border bg-white max-h-80 overflow-y-auto">
            <div className="p-3">{navItems}</div>
          </nav>
        )}
      </div>
    );
  }

  // Desktop: sticky sidebar
  return (
    <aside className="sticky top-20" style={{ alignSelf: "start" }}>
      <div className="border border-border rounded bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-xs font-semibold text-rc2-ebony/50 uppercase tracking-widest">
            Neste artigo
          </h3>
        </div>
        <nav className="p-3">{navItems}</nav>
      </div>
    </aside>
  );
}
