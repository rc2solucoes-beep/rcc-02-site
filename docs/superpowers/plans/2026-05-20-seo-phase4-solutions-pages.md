# Fase 4 SEO — Páginas por Dor/Problema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publicar o hub `/solucoes` e 5 páginas por dor/problema com conteúdo hardcoded, metadata/schema/sitemap/LLM atualizados e interlinking comercial visível, sem tocar em CMS/admin/blog data.

**Architecture:** Introduzir um novo domínio de conteúdo em `solutions.ts`, criar duas rotas públicas (`/solucoes` e `/solucoes/[slug]`) reutilizando componentes de marketing já existentes, e conectar descoberta via interlinking interno, sitemap e rotas LLM. A solução mantém separação clara entre camada de dor (`/solucoes`) e camada de oferta (`/servicos`).

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS v4, shadcn/ui, JSON-LD, metadata API do Next.js.

---

## File Structure Map

### New files
- `src/lib/content/solutions.ts`: tipos + dataset hardcoded + helper `getSolutionBySlug`.
- `src/app/(public)/solucoes/page.tsx`: hub comercial por dor.
- `src/app/(public)/solucoes/[slug]/page.tsx`: página dinâmica por slug com SSG.
- `docs/SOLUTIONS_PAGES_GUIDE.md`: guia operacional das páginas de solução.

### Modified files
- `src/app/sitemap.ts`: inclusão de `/solucoes` e slugs.
- `src/app/llms.txt/route.ts`: inclusão de `/solucoes` na curadoria.
- `src/app/llms-full.txt/route.ts`: seção “Soluções por Problema”.
- `src/app/(public)/servicos/page.tsx`: bloco de link visível para `/solucoes`.
- `src/components/layout/Footer.tsx` (ou equivalente detectado no projeto): link para `/solucoes` em área já existente.
- `src/app/(public)/page.tsx` (somente se houver seção segura): link contextual para `/solucoes` sem redesign.
- `docs/SEO_CHECKLIST.md`: seção Fase 4.
- `README.md` (seção de docs, se aplicável): link para novo guia.

### Tests/verification touchpoints
- Validação principal via `typecheck`, `lint`, `build`.
- Verificação manual de rotas e JSON-LD em páginas novas.

---

### Task 1: Criar domínio de conteúdo `solutions.ts`

**Files:**
- Create: `src/lib/content/solutions.ts`
- Test: validação indireta em `typecheck`

- [ ] **Step 1: Escrever arquivo com tipos e assinaturas (base)**

```ts
export type SolutionFaq = { question: string; answer: string };

export type SolutionRelatedLink = { label: string; href: string };

export type SolutionServiceLink = {
  label: string;
  href: string;
  description: string;
};

export type Solution = {
  slug: string;
  shortTitle: string;
  title: string;
  seoTitle: string;
  summary: string;
  description: string;
  targetAudience: string[];
  symptoms: string[];
  businessImpact: string[];
  rootCauses: string[];
  recommendedApproach: string[];
  relatedServices: SolutionServiceLink[];
  metrics: string[];
  faq: SolutionFaq[];
  relatedLinks: SolutionRelatedLink[];
  ctaTitle: string;
  ctaDescription: string;
  keywords: string;
};
```

- [ ] **Step 2: Inserir dataset completo com 5 soluções aprovadas**

```ts
export const solutions: Solution[] = [
  { slug: "atendimento-lento", /* ...conteúdo aprovado... */ },
  { slug: "leads-sem-resposta", /* ... */ },
  { slug: "processos-manuais", /* ... */ },
  { slug: "sistemas-desconectados", /* ... */ },
  { slug: "whatsapp-desorganizado", /* ... */ },
];
```

- [ ] **Step 3: Adicionar helper de acesso por slug**

```ts
export function getSolutionBySlug(slug: string): Solution | undefined {
  return solutions.find((solution) => solution.slug === slug);
}
```

- [ ] **Step 4: Rodar typecheck pontual**

Run: `npm run typecheck`
Expected: sem erros de tipo.

- [ ] **Step 5: Commit**

```bash
git add src/lib/content/solutions.ts
git commit -m "feat: add hardcoded solutions content model for phase 4"
```

---

### Task 2: Implementar hub `/solucoes`

**Files:**
- Create: `src/app/(public)/solucoes/page.tsx`
- Modify: `src/lib/siteMetadata.ts` (somente se precisar de helper adicional)

- [ ] **Step 1: Criar metadata e schema base da página**

```ts
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Soluções por Problema",
    description:
      "Encontre soluções para atendimento lento, leads sem resposta, processos manuais, sistemas desconectados e WhatsApp desorganizado.",
    alternates: { canonical: "https://rc2solucoes.com.br/solucoes" },
    openGraph: buildOg({
      url: "https://rc2solucoes.com.br/solucoes",
      title: "Soluções por Problema — RC2 Soluções",
      description:
        "Encontre soluções para atendimento lento, leads sem resposta, processos manuais, sistemas desconectados e WhatsApp desorganizado.",
    }),
  };
}
```

- [ ] **Step 2: Renderizar hub com lista das 5 soluções**

```tsx
<PageHero
  label="Soluções por problema"
  title="Comece pela dor real da sua operação."
  description="Mapeamos sintomas comuns e conectamos cada problema ao serviço certo."
/>

{solutions.map((solution) => (
  <article key={solution.slug}>
    <h2>{solution.shortTitle}</h2>
    <p>{solution.summary}</p>
    <Link href={`/solucoes/${solution.slug}`}>Ver solução</Link>
  </article>
))}
```

- [ ] **Step 3: Injetar JSON-LD WebPage + CollectionPage**

```tsx
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaWebPage) }} />
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaCollectionPage) }} />
```

- [ ] **Step 4: Rodar build rápido**

Run: `npm run build`
Expected: rota `/solucoes` listada na saída.

- [ ] **Step 5: Commit**

```bash
git add src/app/(public)/solucoes/page.tsx
git commit -m "feat: add public solutions hub page"
```

---

### Task 3: Implementar `/solucoes/[slug]` com SSG, metadata e JSON-LD

**Files:**
- Create: `src/app/(public)/solucoes/[slug]/page.tsx`
- Use: `src/lib/content/solutions.ts`, `src/components/ui/Breadcrumb.tsx`, `src/components/marketing/PageHero.tsx`, `src/components/marketing/CTABlock.tsx`, `src/components/marketing/PageAnchorNav.tsx`

- [ ] **Step 1: Criar `generateStaticParams` e fallback `notFound`**

```ts
export function generateStaticParams() {
  return solutions.map((solution) => ({ slug: solution.slug }));
}

const solution = getSolutionBySlug(params.slug);
if (!solution) notFound();
```

- [ ] **Step 2: Criar `generateMetadata` com canonical/OG**

```ts
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const solution = getSolutionBySlug(params.slug);
  if (!solution) return {};

  const title = solution.seoTitle || solution.title;
  const url = `${BASE_URL}/solucoes/${solution.slug}`;

  return {
    title,
    description: solution.summary,
    alternates: { canonical: url },
    openGraph: buildOg({ title, description: solution.summary, url }),
  };
}
```

- [ ] **Step 3: Renderizar seções na ordem aprovada**

```tsx
<Breadcrumb items={[{ label: "Soluções", href: "/solucoes" }, { label: solution.shortTitle }]} />
<PageHero label="Solução por problema" title={solution.title} description={solution.description} />

<section id="publico">...</section>
<section id="sinais">...</section>
<section id="impacto">...</section>
<section id="causas">...</section>
<section id="abordagem">...</section>
<section id="servicos">...</section>
<section id="indicadores">...</section>
<section id="faq">...</section>
<section id="links">...</section>

<CTABlock title={solution.ctaTitle} description={solution.ctaDescription} />
```

- [ ] **Step 4: Inserir JSON-LD WebPage + FAQPage condicional**

```tsx
const schemaWebPage = { "@context": "https://schema.org", "@type": "WebPage", /* ... */ };
const schemaFaq = solution.faq.length ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: solution.faq.map(...) } : null;
```

- [ ] **Step 5: Validar compilação da rota dinâmica**

Run: `npm run typecheck && npm run build`
Expected: `/solucoes/[slug]` com 5 paths SSG.

- [ ] **Step 6: Commit**

```bash
git add src/app/(public)/solucoes/[slug]/page.tsx
git commit -m "feat: add static solution problem pages with metadata and schema"
```

---

### Task 4: Interlinking visível (serviços, footer, home condicional)

**Files:**
- Modify: `src/app/(public)/servicos/page.tsx`
- Modify: `src/components/layout/Footer.tsx` (ou arquivo real do footer)
- Optional modify: `src/app/(public)/page.tsx`

- [ ] **Step 1: Inserir bloco discreto em `/servicos` apontando para `/solucoes`**

```tsx
<section className="...">
  <h2>Comece pela dor do seu negócio</h2>
  <p>Veja soluções por problema e conecte cada cenário ao serviço mais adequado.</p>
  <Link href="/solucoes" className="rc2-action-link">Explorar soluções por problema</Link>
</section>
```

- [ ] **Step 2: Adicionar link no footer em área existente de links**

```tsx
<Link href="/solucoes">Soluções por Problema</Link>
```

- [ ] **Step 3: Home condicional (somente se encaixe seguro)**

```tsx
{/* somente em seção já existente, sem mudança estrutural */}
<Link href="/solucoes">Ver soluções por problema</Link>
```

- [ ] **Step 4: Validar navegação manual**

Run (manual): abrir `/servicos`, `/solucoes`, home, e conferir presença dos links.
Expected: link visível em `/servicos` + footer; home somente se apropriado.

- [ ] **Step 5: Commit**

```bash
git add src/app/(public)/servicos/page.tsx src/components/layout/Footer.tsx src/app/(public)/page.tsx
git commit -m "feat: add visible internal links to solutions hub"
```

---

### Task 5: Atualizar sitemap e rotas LLM

**Files:**
- Modify: `src/app/sitemap.ts`
- Modify: `src/app/llms.txt/route.ts`
- Modify: `src/app/llms-full.txt/route.ts`

- [ ] **Step 1: Atualizar sitemap com `/solucoes` e slugs**

```ts
{
  path: "/solucoes",
  lastModified: "2026-05-20",
  changeFrequency: "monthly",
  priority: 0.8,
}
```

E para slugs:

```ts
const solutionRoutes = solutions.map((solution) => ({
  url: `${BASE_URL}/solucoes/${solution.slug}`,
  lastModified: new Date("2026-05-20"),
  changeFrequency: "monthly" as const,
  priority: 0.75,
}));
```

- [ ] **Step 2: Atualizar `/llms.txt` com a nova página principal**

```md
- [Soluções por Problema](https://rc2solucoes.com.br/solucoes): páginas organizadas por dores de negócio...
```

- [ ] **Step 3: Atualizar `/llms-full.txt` com seção de soluções**

```ts
function buildSolutionsSection(): string {
  const lines = ["", "## Soluções por Problema"];
  // map solutions -> título, URL, resumo, sintomas, impacto, causas, abordagem, serviços, métricas, FAQ
  return lines.join("\n");
}
```

- [ ] **Step 4: Rodar verificação de build das rotas estáticas/texto**

Run: `npm run build`
Expected: `/llms.txt`, `/llms-full.txt`, `/solucoes` e `/solucoes/[slug]` na saída.

- [ ] **Step 5: Commit**

```bash
git add src/app/sitemap.ts src/app/llms.txt/route.ts src/app/llms-full.txt/route.ts
git commit -m "feat: update sitemap and llm routes with solutions pages"
```

---

### Task 6: Documentação da Fase 4

**Files:**
- Create: `docs/SOLUTIONS_PAGES_GUIDE.md`
- Modify: `docs/SEO_CHECKLIST.md`
- Modify: `README.md` (se índice de docs aplicável)

- [ ] **Step 1: Criar guia operacional das páginas de solução**

```md
# Solutions Pages Guide
## Objetivo
## Serviço vs Problema
## Slugs atuais
## Regra: conteúdo centralizado em solutions.ts
## Como adicionar nova solução
## Checklist de publicação técnica
```

- [ ] **Step 2: Atualizar SEO checklist com seção Fase 4**

```md
### Páginas por Dor/Problema
- [x] `/solucoes` criado.
- [x] Páginas por dor criadas...
- [x] Conteúdo centralizado em `src/lib/content/solutions.ts`.
...
```

- [ ] **Step 3: Atualizar README com link do novo guia (se seção docs existente)**

```md
| [`docs/SOLUTIONS_PAGES_GUIDE.md`](docs/SOLUTIONS_PAGES_GUIDE.md) | Guia das páginas por dor/problema |
```

- [ ] **Step 4: Commit**

```bash
git add docs/SOLUTIONS_PAGES_GUIDE.md docs/SEO_CHECKLIST.md README.md
git commit -m "docs: add solutions pages guide and phase 4 checklist updates"
```

---

### Task 7: Validação final e evidências

**Files:**
- Modify (se necessário): arquivos impactados por ajustes pós-validação

- [ ] **Step 1: Rodar validação obrigatória completa**

Run:
```bash
npm run typecheck
npm run lint
npm run build
```
Expected:
- Typecheck sem erros
- Lint sem erros (warnings existentes podem permanecer se já eram pré-existentes)
- Build concluído com rotas novas

- [ ] **Step 2: Validação manual funcional mínima**

Checklist manual:
- Abrir `/solucoes`
- Abrir cada slug
- Testar slug inválido (`/solucoes/nao-existe`) -> 404
- Confirmar links em `/servicos` e footer
- Confirmar `/solucoes-com-ia` intacta
- Inspecionar JSON-LD em uma página de solução

- [ ] **Step 3: Commit de ajustes finais (se houver)**

```bash
git add -A
git commit -m "chore: finalize phase 4 solutions pages validation fixes"
```

---

## Spec Coverage Check

- Conteúdo hardcoded em `solutions.ts`: coberto (Task 1)
- `/solucoes` hub: coberto (Task 2)
- `/solucoes/[slug]` + SSG + metadata + notFound + schemas: coberto (Task 3)
- Interlinking visível em `/servicos` e footer + home condicional: coberto (Task 4)
- Sitemap + llms routes: coberto (Task 5)
- Docs (`SEO_CHECKLIST` + `SOLUTIONS_PAGES_GUIDE`): coberto (Task 6)
- Validação `typecheck/lint/build`: coberto (Task 7)
- Restrições (sem posts/migrations/deps/admin): preservadas no plano

## Placeholder Scan

- Sem `TODO/TBD`
- Sem passos vagos do tipo “testar depois”
- Comandos e snippets concretos fornecidos

## Type Consistency Check

- `Solution` e helpers consistentes com as rotas planejadas
- Uso de `solution.seoTitle || solution.title` consistente em metadata/OG
- Canonical e JSON-LD alinhados com `/solucoes/${slug}`