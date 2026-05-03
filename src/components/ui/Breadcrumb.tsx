import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: "https://rc2solucoes.com.br" },
      ...items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 2,
        name: item.label,
        ...(item.href ? { item: `https://rc2solucoes.com.br${item.href}` } : {}),
      })),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <nav aria-label="Trilha de navegação" className="hidden">
        <ol>
          <li><Link href="/">Início</Link></li>
          {items.map((item, i) =>
            item.href
              ? <li key={i}><Link href={item.href}>{item.label}</Link></li>
              : <li key={i} aria-current="page">{item.label}</li>
          )}
        </ol>
      </nav>
    </>
  );
}
