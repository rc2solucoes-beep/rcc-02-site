"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

interface Heading {
  id: string;
  text: string;
  level: 2 | 3;
}

interface TableOfContentsProps {
  contentHtml: string;
  isMobile?: boolean;
}

export function TableOfContents({ contentHtml, isMobile = false }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Parse HTML string to extract headings
    const parser = new DOMParser();
    const doc = parser.parseFromString(contentHtml, "text/html");

    // Only extract h2 headings (not h3) to keep TOC compact and scannable
    const headingElements = Array.from(doc.querySelectorAll("h2"));
    const extractedHeadings: Heading[] = headingElements.map((el, idx) => {
      const level = 2 as const;
      const text = el.textContent || "";
      const id = el.id || `heading-${idx}`;

      return { id, text, level };
    });

    setHeadings(extractedHeadings);
  }, [contentHtml]);

  useEffect(() => {
    // Update active heading on scroll
    const handleScroll = () => {
      const headingElements = headings.map(h => document.getElementById(h.id));
      const scrollPosition = window.scrollY + 100;

      for (let i = headingElements.length - 1; i >= 0; i--) {
        if (headingElements[i] && headingElements[i]!.offsetTop <= scrollPosition) {
          setActiveId(headings[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [headings]);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setActiveId(id);
      setIsOpen(false);
    }
  };

  if (headings.length < 2) return null;

  // Mobile collapsible version
  if (isMobile) {
    return (
      <div className="mb-6 border border-border rounded">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-rc2-sand/50 hover:bg-rc2-sand transition-colors"
        >
          <span className="text-sm font-medium text-rc2-ebony">Neste artigo</span>
          <ChevronDown
            size={16}
            className={`text-rc2-ebony/60 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <nav className="px-4 py-3 border-t border-border bg-white space-y-1.5 max-h-96 overflow-y-auto">
            <ul className="space-y-1.5">
              {headings.map((heading) => (
                <li key={heading.id}>
                  <button
                    onClick={() => handleClick(heading.id)}
                    className={`text-sm w-full text-left px-2 py-1.5 rounded transition-colors ${
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
          </nav>
        )}
      </div>
    );
  }

  // Desktop sticky sidebar version
  return (
    <aside className="sticky top-20 h-fit">
      <nav className="border border-border rounded p-4 bg-rc2-sand/30">
        <h3 className="text-xs font-medium text-rc2-ebony/60 uppercase tracking-widest mb-3">
          Neste artigo
        </h3>
        <ul className="space-y-1.5">
          {headings.map((heading) => (
            <li key={heading.id}>
              <button
                onClick={() => handleClick(heading.id)}
                className={`text-sm w-full text-left px-2 py-1.5 rounded transition-colors ${
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
      </nav>
    </aside>
  );
}
