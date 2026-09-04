# Fase 0 — Reconhecimento do repositório (refatoração visual)

Levantamento feito **antes de qualquer alteração de código**, para a especificação
`documentos-base/RC2_Direcao_de_Arte_e_Sistema_Visual.md`.
Nenhum arquivo de aplicação foi modificado nesta fase.

---

## 1. Stack e abordagem de estilo

| Item | Estado real |
|---|---|
| Framework | Next.js **16.3.3**, App Router, React 19.2.4, TypeScript |
| Estilo | **Tailwind CSS v4 CSS-first** — não existe `tailwind.config.*`; o tema vive em `@theme inline` dentro de `src/app/globals.css` (794 linhas) |
| PostCSS | `@tailwindcss/postcss` (`postcss.config.mjs`) |
| Tokens | **Centralizados**, fonte única em `src/app/globals.css`. `:root` define os `--rc2-*` e `@theme inline` os expõe como utilities `bg-rc2-*` / `text-rc2-*` |
| Cores espalhadas | Não. `scripts/audit-brand.sh` (`npm run audit:brand`) reprova hex literal fora de `globals.css` e valores da paleta legada |
| Camada de componentes CSS | `@layer components` em `globals.css` com utilitários próprios: `.rc2-h1`, `.rc2-h2`, `.rc2-h3`, `.rc2-display`, `.rc2-label`, `.rc2-body`, `.rc2-card`, `.rc2-card-hover`, `.rc2-action-link`, `.rc2-section--{opening,argument,proof,closing}`, `.rc2-quote-card`, `.rc2-blueprint`, `.rc2-grain`, `.rc2-rule`, `.rc2-hero-*` |
| Base de componentes | **shadcn** (`components.json`, style `base-nova`, `iconLibrary: lucide`) sobre **`@base-ui/react`**, com `cva` + `clsx` + `tailwind-merge` (`cn` em `src/lib/utils.ts`) |
| Tipografia | `next/font/google` em `src/app/layout.tsx` — `Barlow` e `Barlow_Condensed`, expostas como `--font-barlow` / `--font-barlow-condensed` |
| Testes | Vitest (`tests/`), Playwright e2e, `npm run check` = typecheck + lint + test |

## 2. Iconografia

**Lucide já é dependência** (`lucide-react@^1.14.0`), usada em **34 arquivos** e
declarada em `components.json` (`"iconLibrary": "lucide"`).
Não há Phosphor, react-icons ou heroicons no projeto.

→ **Decisão: Lucide.** A especificação pede "Phosphor/Lucide"; o repositório já
resolveu essa escolha. Não introduzir terceira biblioteca.

## 3. Rotas reais × páginas da especificação

Todas as páginas públicas ficam em `src/app/(public)/`, sob o layout
`src/app/(public)/layout.tsx` (Header + Footer + FloatingWhatsApp).

| Página na especificação | Rota | Arquivo |
|---|---|---|
| Home | `/` | `src/app/(public)/page.tsx` |
| Contato | `/contato` | `src/app/(public)/contato/page.tsx` |
| Soluções | `/solucoes` | `src/app/(public)/solucoes/page.tsx` |
| Sobre | `/sobre` | `src/app/(public)/sobre/page.tsx` |
| Blog — índice | `/blog` | `src/app/(public)/blog/page.tsx` |
| Blog — artigo | `/blog/[slug]` | `src/app/(public)/blog/[slug]/page.tsx` |
| (não citada) Zapbox — ponte | `/zapbox` | `src/app/(public)/zapbox/page.tsx` |
| (não citada) Avaliações e Projetos | `/avaliacoes` | `src/app/(public)/avaliacoes/page.tsx` |
| (não citada) legado fora do menu | `/servicos`, `/servicos/[slug]`, `/solucoes/[slug]`, `/solucoes-com-ia` | idem em `(public)/` |
| (não citada) legais | `/privacidade`, `/termos` | idem |
| **Fora de escopo visual** | `/admin/*` | `src/app/admin/` — usa tokens deprecados propositalmente |

Navegação vem de `src/lib/content/navigation.ts`; conteúdo de página vem de
`src/lib/content/{home,solutions,services,solucoesPage,zapboxBridge}.ts`.

## 4. Tabela de correspondência — conceito → arquivo real

### Primitives

| Conceito na especificação | Componente/classe real | Observação |
|---|---|---|
| Botão Primário | `buttonVariants` (`src/components/ui/button.tsx`) + classes inline repetidas | **Não há variante "brand"**. Cada uso repete `bg-rc2-brand text-rc2-heading …` à mão em `Header.tsx:111,164`, `HeroActions.tsx:36`, `CTABlockBase.tsx:90`, `CTABlock.tsx:81`, `ContactForm.tsx:413,575`, `blog/page.tsx:103`. Candidato #1 a consolidação |
| Botão Secundário | mesmo arquivo, `variant: "outline" \| "secondary"` | |
| Link com seta (→) | `.rc2-action-link` (`globals.css:415`) + `ArrowRight` do Lucide | Ponto único para o micro-deslocamento de 2–3px |
| Badge / Eyebrow | `SectionLabel` (`src/components/ui/SectionLabel.tsx`) → `.rc2-label` + `.rc2-rule` | Já em `--rc2-brand-text`, conforme a spec |
| Input / Textarea | inline em `src/components/marketing/ContactForm.tsx` | Sem primitive extraído |
| Estrelas de avaliação | `src/components/GoogleReviews.tsx`, `src/components/marketing/HomeReviews.tsx` | |
| Divisor | `divide-*` inline / `.rc2-rule` | Sem componente |
| Focus ring | classe `ui-focus-ring` + `--rc2-focus-ring` | |

### Composites

| Conceito na especificação | Componente/classe real | Observação |
|---|---|---|
| Card (base) | `.rc2-card` + `.rc2-card-hover` (`globals.css:395`) | Não é componente React — é utilitário CSS |
| Card Sintoma | `src/components/marketing/home/HomeProblems.tsx` | Hoje bullet `bg-rc2-brand`; a spec pede ícone fino |
| Card Competência | `src/components/marketing/home/HomeCompetencies.tsx` e `src/components/marketing/solucoes/SolutionsCompetencies.tsx` | **Duas implementações** do mesmo conceito |
| Card Produto | `src/components/marketing/home/HomeProducts.tsx` | Zapbox / Agenda Confirmada |
| Card Case / Autoridade | `src/components/marketing/home/HomeAuthority.tsx` (dados em `src/lib/content/home.ts:230`) | Origem dos números US$ 384 mil / 636 pedidos |
| Card Testemunho | `src/components/GoogleReviews.tsx`, `src/components/marketing/HomeReviews.tsx` | |
| Card Blog | `src/components/blog/BlogCard.tsx` (+ `.rc2-blog-cover`) | Thumbnail a crescer |
| Numerado (01–05) | **`src/components/marketing/StepList.tsx`** | Já existe e já é reutilizável — "formalizar como componente" = adotá-lo, não criar |
| **Stat / Counter** | **não existe** | Único componente genuinamente novo da spec |
| Form Field + Stepper | `ProgressBar` interno em `ContactForm.tsx:107` | Não exportado |
| Navigation item | `src/components/layout/Header.tsx:93` | Estado ativo já implementado |
| Scroll reveal / entrada | `src/components/ui/ScrollReveal.tsx`, `src/components/ui/FadeIn.tsx` | Reaproveitar; não criar motion novo |

### Sections

| Conceito na especificação | Arquivo real |
|---|---|
| Header | `src/components/layout/Header.tsx` |
| Footer | `src/components/layout/Footer.tsx` (+ `layout/Logo.tsx`) |
| Hero (Home) | `src/app/(public)/page.tsx` + `home/HomeHeroDiagram.tsx` + `marketing/HeroActions.tsx` |
| Hero (páginas internas) | `src/components/marketing/PageHero.tsx` |
| Sintomas | `home/HomeProblems.tsx` |
| Competências | `home/HomeCompetencies.tsx` |
| Produtos próprios | `home/HomeProducts.tsx` |
| Prova social | `home/HomeAuthority.tsx`, `marketing/HomeReviews.tsx`, `GoogleReviews.tsx` |
| Como trabalhamos | `home/HomeMethod.tsx` (usa `StepList`) |
| Blog preview | `home/HomeContent.tsx` |
| **CTA band** | `marketing/CTABlockBase.tsx` — wrappers: `HomeCtaBlock`, `ContactCtaBlock`, `ServicesCtaBlock`, `CTABlock` |
| Nav de âncora | `marketing/PageAnchorNav.tsx` |
| Artigo de blog | `blog/BlogPostArticle.tsx`, `blog/TableOfContents.tsx`, `blog/BackToTopButton.tsx` |

## 5. Achados que a especificação prevê — localização exata

| Prioridade da spec | Onde está no código |
|---|---|
| 1. Faixa full-orange do Contato | `CTABlockBase.tsx:50` — `isDark ? "bg-rc2-dark" : "bg-rc2-brand"`. Também `CTABlock.tsx:38`. A `variant: "orange"` chega via `ContactCtaBlock.tsx` |
| 2. H1 condensado | `globals.css:321` — `.rc2-h1` é Condensed **800 uppercase**. A spec pede Barlow **Bold 700**, sem uppercase, `-0.02em`. Afeta `PageHero.tsx` e todas as páginas |
| 3. Token de background | `globals.css` — `--rc2-bg: #F7F5F1` / `--rc2-bg-alt: #FBFAF8`. A spec pede a **inversão** dos papéis |
| 4. Módulo diagramático do hero | `home/HomeHeroDiagram.tsx` + `.rc2-hero-*` em `globals.css:425-459` |
| 5. Ícones em cards | `HomeProblems.tsx`, `HomeCompetencies.tsx`, `SolutionsCompetencies.tsx` |
| 6. Stat/Counter | criar em `src/components/ui/`; dados em `lib/content/home.ts:230` |

## 6. Convenção de branch / PR

- Remote: `rc2solucoes-beep/rcc-02-site`, base **`main`**, merge via **Pull Request** (não há push direto). Sem `.github/` nem template de PR.
- **Branch:** `<tipo>/<escopo-em-kebab-case>` — ex. `design/brand-v2-2-visual-refresh`, `fix/phase-6-zapbox-editorial-hygiene`, `seo/phase-6-zapbox-url-migration`. Branch atual: `design/high-end-tool-art-direction`.
- **Commits:** Conventional Commits em inglês, imperativo, escopo omitido. Tipos em uso: `test`, `docs`, `fix`, `seo`, `style`, `feat`, `design`, `refactor`, `content`.
- **Ordem observada por fase:** `docs:` (plano) → `test:` (contratos) → implementação → `test:` (validação).
- **Antes do PR:** `npm run build`, `npm run audit:brand`, `npm run check`.

## 7. Conflitos a resolver antes de implementar

Registrados aqui, sem decisão unilateral — todos tocam a hierarquia de autoridade do `AGENTS.md`.

1. **Segunda família tipográfica.** O `AGENTS.md` diz "Barlow… nunca adicionar uma segunda família"; o código já carrega `Barlow_Condensed`; e a especificação de arte **depende** de Condensed ExtraBold no display cinético e Condensed Medium no eyebrow. Estado de fato = spec; o `AGENTS.md` precisa ser atualizado ou a spec restringida.
2. **Pesos de fonte não carregados.** `layout.tsx` carrega **só Barlow 400** e **só Condensed 800**. O `AGENTS.md` promete 300/400/500/600/700/800 e a spec usa 300/400/500/600/700. Hoje `font-semibold`/`font-bold` renderizam **negrito sintético**. Correção necessária independentemente da direção de arte.
3. **Inversão do token de background.** A tabela de tokens do `AGENTS.md` fixa `--rc2-bg: #F7F5F1`. A spec (§6) aprova a inversão para `#FBFAF8`. Conflito direto de fonte autoritativa — precisa de decisão registrada antes de mexer.
4. **Palavra cinética do hero.** A própria spec (§12) deixa a lista de palavras em aberto e a classifica como decisão de copy, fora do escopo visual. Bloqueia o item 4 da prioridade.
5. **Números do Stat/Counter.** Só existe um fato documentado em `lib/content/home.ts:230`. Regra de claims do `AGENTS.md`: nada entra sem documento aprovado.
6. **Artigo de blog.** A spec pede confirmação com screenshot real antes de implementar (§9 e §12).
