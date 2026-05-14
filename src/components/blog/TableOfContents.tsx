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
    const parser = new DOMParser();
    const doc = parser.parseFromString(contentHtml, "text/html");

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
            <ul className="p-3 space-y-0.5">
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
          </nav>
        )}
      </div>
    );
  }

  // Desktop sticky sidebar version
  return (
    <aside className="sticky top-20 h-fit">
      <div className="border border-border rounded bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-xs font-semibold text-rc2-ebony/50 uppercase tracking-widest">
            Neste artigo
          </h3>
        </div>
        <nav className="p-3">
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
        </nav>
      </div>
    </aside>
  );
}
