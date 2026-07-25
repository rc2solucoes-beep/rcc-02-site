import sanitizeHtml from "sanitize-html";
import type { TocHeading } from "@/components/blog/TableOfContents";

// Sanitização do HTML de post no servidor.
//
// Usamos sanitize-html (JS puro, sem DOM) em vez de isomorphic-dompurify:
// este último carrega o jsdom no runtime, cuja árvore de dependências
// (@exodus/bytes é ESM) quebra com ERR_REQUIRE_ESM no bundle da Vercel,
// derrubando com 500 qualquer post renderizado sob demanda.
const SANITIZE_CONFIG: sanitizeHtml.IOptions = {
  allowedTags: [...new Set([...sanitizeHtml.defaults.allowedTags, "img", "h1", "h2"])],
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    "*": ["id", "class", "style"],
    a: ["href", "name", "target", "rel", "title"],
    img: ["src", "alt", "title", "width", "height", "loading"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: ["http", "https", "data"] },
};

// Sanitiza o HTML e injeta id + scroll-margin nos headings h2/h3 para o TOC.
export function sanitizeAndAddIds(html: string): string {
  const sanitized = sanitizeHtml(html ?? "", SANITIZE_CONFIG);
  let headingCounter = 0;

  return sanitized.replace(/<(h[23])([^>]*)>/gi, (match, tag, attrs) => {
    // Pula se já tiver um atributo id
    if (/\sid\s*=/i.test(attrs)) {
      return match;
    }

    headingCounter++;
    // scroll-margin-top: 120px compensa a altura da navbar
    return `<${tag}${attrs} id="heading-${headingCounter}" style="scroll-margin-top: 120px;">`;
  });
}

// Extrai headings h2 (com id) do HTML sanitizado para alimentar o TOC no servidor.
export function extractHeadings(html: string): TocHeading[] {
  const matches = [...html.matchAll(/<h2[^>]+id="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/gi)];
  return matches.map((m) => ({
    id: m[1],
    text: m[2].replace(/<[^>]*>/g, "").trim(),
  }));
}
