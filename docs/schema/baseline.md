# Structured Data — Baseline (Fase 0 do SDD Schema.org)

Snapshot do JSON-LD **servido em produção** antes de qualquer refatoração.

| | |
|---|---|
| Data | 2026-09-26 |
| Origem | `https://www.rc2solucoes.com.br` (HTML servido, leitura HTTP pública) |
| Código | `main` @ `bd2dba4` |
| Método | cada rota buscada sem seguir redirects; todos os `<script type="application/ld+json">` extraídos e parseados; `<link rel="canonical">` registrado |
| Omissões | `articleBody` do post e textos das respostas do FAQ foram substituídos por marcadores de tamanho — o resto é literal |

---

## 1. Premissas da SPEC × estado real

| Premissa da SPEC | Estado real | Consequência |
|---|---|---|
| Baseline inclui `/servicos`, `/servicos/automacao-de-processos`, `/solucoes/whatsapp-desorganizado` | as três respondem **308** (`docs/16`, `docs/22`, `docs/24`) e não servem JSON-LD | fora do baseline observável |
| Template `Service` em `/servicos/[slug]` (SPEC-006, Fase 3) | **inalcançável**: todos os slugs de serviço redirecionam (`MIGRATED_SERVICE_SLUGS`); nenhuma rota 200 emite `Service` | Fase 3 não tem alvo publicado — **divergência** |
| `BreadcrumbList` existe e só está oculto (P08, P09, Fase 6) | o componente `Breadcrumb` só é usado em `/servicos/[slug]` e `/solucoes/[slug]`, ambas **inalcançáveis**; nenhuma rota 200 emite `BreadcrumbList` | Fase 6 não tem alvo publicado — **divergência** |
| `/solucoes/[slug]` (FAQPage, WebSite inline) | inalcançável (`MIGRATED_SOLUTION_SLUGS`) | código morto no que diz respeito a schema |
| `BlogPosting` sem identidade (P06) e `WebPage.mainEntity` (Fase 4) | confirmado sem `@id`; **o post não emite `WebPage`** | a Fase 4 precisa criar o `WebPage` do post, não só ligá-lo |
| Ausência de `@id` (P01) | **confirmado**: 0 `@id` em todas as rotas | — |
| `Organization` duplicada (P02) | confirmado: global + `WebPage.publisher` inline em toda página + `BlogPosting.publisher` inline | — |
| `WebSite` duplicado (P03) | confirmado: global + `WebPage.isPartOf` inline em toda página | — |
| `Organization` × `LocalBusiness` sem relação (P04) | confirmado: duas entidades independentes, com os mesmos dados | — |
| `LocalBusiness` pode sair sem endereço (P10) | em produção **tem endereço** (settings); o fallback do `catch` em `layout.tsx` emite `LocalBusiness` só com nome/url/logo | regra de emissão ainda necessária; modelagem é decision gate (Fase 7) |
| `FAQPage` válido | confirmado no post (5 perguntas, visíveis na página) | manter |

### 1.1 Achados não previstos na SPEC

- **`BlogPosting.author` modela a empresa como pessoa.** O post amostrado
  emite `{"@type":"Person","name":"RC2 Soluções","jobTitle":null,"image":null}`:
  o `author_name` do post é o nome da empresa, e o builder transforma qualquer
  `author_name` em `Person`. Também emite `null` em `jobTitle` e `image`.
  Relevante para a Fase 5 (a regra da SPEC-008 manda usar a organização como
  autor quando não há autor individual real).
- **`areaServed` com tipo errado.** `settings.business_area = "Brasil"` vira
  `{"@type":"City","name":"Brasil"}` em `Organization` e `LocalBusiness`: um
  país tipado como cidade.
- **Endereço sem número.** `streetAddress: "Av Nova América"` (Guarulhos, CEP
  07123250) — insumo para o decision gate de `LocalBusiness`.
- **`logo` inconsistente.** String simples em `Organization`, `LocalBusiness` e
  `WebPage.publisher`; `ImageObject` em `BlogPosting.publisher`.

---

## 2. Rotas

| Rota | Status | Blocos JSON-LD | `@id` | Canonical |
|---|---|---|---|---|
| `/` | 200 | Organization, LocalBusiness, WebSite, WebPage | 0 | `https://www.rc2solucoes.com.br` |
| `/servicos` | 308 → `/solucoes` | — | 0 | — |
| `/servicos/automacao-de-processos` | 308 → `/solucoes#automacao-de-processos` | — | 0 | — |
| `/solucoes/whatsapp-desorganizado` | 308 → `/zapbox` | — | 0 | — |
| `/solucoes/agenda-confirmada` | 200 | Organization, LocalBusiness, WebSite, WebPage | 0 | `https://www.rc2solucoes.com.br/solucoes/agenda-confirmada` |
| `/blog` | 200 | Organization, LocalBusiness, WebSite, WebPage | 0 | `https://www.rc2solucoes.com.br/blog` |
| `/blog/solucoes-automatizadas-7-criterios-para-avaliar-fornecedores` | 200 | Organization, LocalBusiness, WebSite, BlogPosting, FAQPage | 0 | `https://www.rc2solucoes.com.br/blog/solucoes-automatizadas-7-criterios-para-avaliar-fornecedores` |
| `/sobre` | 200 | Organization, LocalBusiness, WebSite, WebPage | 0 | `https://www.rc2solucoes.com.br/sobre` |
| `/contato` | 200 | Organization, LocalBusiness, WebSite, WebPage | 0 | `https://www.rc2solucoes.com.br/contato` |
| `/avaliacoes` | 200 | Organization, LocalBusiness, WebSite, WebPage | 0 | `https://www.rc2solucoes.com.br/avaliacoes` |
| `/zapbox` | 200 | Organization, LocalBusiness, WebSite, WebPage | 0 | `https://www.rc2solucoes.com.br/zapbox` |
| `/solucoes` | 200 | Organization, LocalBusiness, WebSite, WebPage | 0 | `https://www.rc2solucoes.com.br/solucoes` |

## 3. Blocos globais (`src/app/layout.tsx`)

Idênticos em todas as rotas 200: **sim**. Registrados uma vez.

### Organization

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "RC2 Soluções",
  "url": "https://www.rc2solucoes.com.br",
  "logo": "https://www.rc2solucoes.com.br/images/logo-base-transparente-preto.png",
  "email": "contato@rc2solucoes.com.br",
  "telephone": "+5511988028550",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Av Nova América",
    "addressLocality": "Guarulhos",
    "postalCode": "07123250",
    "addressCountry": "BR"
  },
  "areaServed": [
    {
      "@type": "City",
      "name": "Brasil"
    }
  ],
  "sameAs": [
    "https://www.instagram.com/rc2solucoes",
    "https://www.linkedin.com/company/rc2-solucoes",
    "https://share.google/DaSC13j7vbzF7366O"
  ],
  "contactPoint": [
    {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "availableLanguage": "Portuguese",
      "email": "contato@rc2solucoes.com.br",
      "url": "https://www.rc2solucoes.com.br/contato"
    },
    {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "availableLanguage": "Portuguese",
      "telephone": "+5511988028550",
      "url": "https://www.rc2solucoes.com.br/contato"
    }
  ]
}
```

### LocalBusiness

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "RC2 Soluções",
  "url": "https://www.rc2solucoes.com.br",
  "logo": "https://www.rc2solucoes.com.br/images/logo-base-transparente-preto.png",
  "email": "contato@rc2solucoes.com.br",
  "telephone": "+5511988028550",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Av Nova América",
    "addressLocality": "Guarulhos",
    "postalCode": "07123250",
    "addressCountry": "BR"
  },
  "areaServed": [
    {
      "@type": "City",
      "name": "Brasil"
    }
  ],
  "sameAs": [
    "https://www.instagram.com/rc2solucoes",
    "https://www.linkedin.com/company/rc2-solucoes",
    "https://share.google/DaSC13j7vbzF7366O"
  ]
}
```

### WebSite

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "RC2 Soluções",
  "url": "https://www.rc2solucoes.com.br"
}
```

## 4. Blocos por rota

### `/`

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Automação, Integração e IA para PMEs",
  "description": "Sua operação cresceu, mas o processo não acompanhou? A RC2 automatiza tarefas, conecta sistemas e aplica IA pra reduzir retrabalho. Fale 20 min, grátis.",
  "url": "https://www.rc2solucoes.com.br",
  "keywords": "automação de processos, integração de sistemas, IA para operações, operações digitais e commerce, consultoria de operação, PME",
  "image": "https://www.rc2solucoes.com.br/og-image.png",
  "isPartOf": {
    "@type": "WebSite",
    "url": "https://www.rc2solucoes.com.br",
    "name": "RC2 Soluções"
  },
  "publisher": {
    "@type": "Organization",
    "name": "RC2 Soluções",
    "url": "https://www.rc2solucoes.com.br",
    "logo": "https://www.rc2solucoes.com.br/images/logo-base-transparente-preto.png"
  }
}
```

### `/solucoes/agenda-confirmada`

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Agenda Confirmada — Automação de agenda para clínicas",
  "description": "Automatize lembretes, confirmações e avisos de agenda usando Google Agenda ou o sistema de gestão da clínica. Solução vertical da RC2 para clínicas.",
  "url": "https://www.rc2solucoes.com.br/solucoes/agenda-confirmada",
  "isPartOf": {
    "@type": "WebSite",
    "url": "https://www.rc2solucoes.com.br",
    "name": "RC2 Soluções"
  }
}
```

### `/blog`

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Blog",
  "description": "Conteúdo sobre automação, IA e operações digitais para pequenas e médias empresas.",
  "url": "https://www.rc2solucoes.com.br/blog",
  "keywords": "blog, artigos, IA, automação, tendências, operações digitais, tecnologia, PME",
  "image": "https://www.rc2solucoes.com.br/og-image.png",
  "isPartOf": {
    "@type": "WebSite",
    "url": "https://www.rc2solucoes.com.br",
    "name": "RC2 Soluções"
  },
  "publisher": {
    "@type": "Organization",
    "name": "RC2 Soluções",
    "url": "https://www.rc2solucoes.com.br",
    "logo": "https://www.rc2solucoes.com.br/images/logo-base-transparente-preto.png"
  }
}
```

### `/blog/solucoes-automatizadas-7-criterios-para-avaliar-fornecedores`

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Soluções automatizadas: 7 critérios para avaliar fornecedores",
  "description": "Compare propostas de automação por critérios operacionais, avalie como cada fornecedor trata integrações, exceções e suporte e reconheça riscos antes de iniciar um piloto na sua empresa.",
  "image": "https://ccaonec11w7vkoy6.public.blob.vercel-storage.com/blog/covers/1786844989996-v02.png",
  "datePublished": "2026-08-17T11:00:00+00:00",
  "dateModified": "2026-09-05T13:38:37.305778+00:00",
  "author": {
    "@type": "Person",
    "name": "RC2 Soluções",
    "jobTitle": null,
    "image": null
  },
  "publisher": {
    "@type": "Organization",
    "name": "RC2 Soluções",
    "url": "https://www.rc2solucoes.com.br",
    "logo": {
      "@type": "ImageObject",
      "url": "https://www.rc2solucoes.com.br/images/logo-base-transparente-preto.png"
    }
  }
}
```

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Como comparar fornecedores de soluções automatizadas?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[omitido]"
      }
    },
    {
      "@type": "Question",
      "name": "O que deve entrar no escopo de uma automação?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[omitido]"
      }
    },
    {
      "@type": "Question",
      "name": "Por que testar exceções antes de contratar?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[omitido]"
      }
    },
    {
      "@type": "Question",
      "name": "Como avaliar o suporte de automação?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[omitido]"
      }
    },
    {
      "@type": "Question",
      "name": "O que medir em um piloto de automação?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[omitido]"
      }
    }
  ]
}
```

### `/sobre`

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Sobre a RC2",
  "description": "Fundada por Robson Azevedo, com mais de 20 anos de experiência em TI, e-commerce e transformação digital. Conheça a RC2 Soluções.",
  "url": "https://www.rc2solucoes.com.br/sobre",
  "keywords": "sobre RC2, consultoria, IA, automação, transformação digital, Robson Azevedo, time",
  "image": "https://www.rc2solucoes.com.br/og-image.png",
  "isPartOf": {
    "@type": "WebSite",
    "url": "https://www.rc2solucoes.com.br",
    "name": "RC2 Soluções"
  },
  "publisher": {
    "@type": "Organization",
    "name": "RC2 Soluções",
    "url": "https://www.rc2solucoes.com.br",
    "logo": "https://www.rc2solucoes.com.br/images/logo-base-transparente-preto.png"
  }
}
```

### `/contato`

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Contato — Falar sobre a sua operação",
  "description": "Converse com a RC2 sobre automação de processos, integração de sistemas e IA para operações. Conversa inicial de 20 a 30 minutos, sem compromisso.",
  "url": "https://www.rc2solucoes.com.br/contato",
  "keywords": "contato, conversa inicial, discovery operacional, consultoria, automação de processos, integração de sistemas, IA para operações",
  "image": "https://www.rc2solucoes.com.br/og-image.png",
  "isPartOf": {
    "@type": "WebSite",
    "url": "https://www.rc2solucoes.com.br",
    "name": "RC2 Soluções"
  },
  "publisher": {
    "@type": "Organization",
    "name": "RC2 Soluções",
    "url": "https://www.rc2solucoes.com.br",
    "logo": "https://www.rc2solucoes.com.br/images/logo-base-transparente-preto.png"
  }
}
```

### `/avaliacoes`

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Avaliações e Projetos",
  "description": "Avaliações de clientes, produtos próprios da RC2, demonstrações que você pode testar e projetos de laboratório.",
  "url": "https://www.rc2solucoes.com.br/avaliacoes",
  "keywords": "avaliações, depoimentos, projetos, demonstrações, produtos próprios, IA, automação",
  "image": "https://www.rc2solucoes.com.brhttps://ccaonec11w7vkoy6.public.blob.vercel-storage.com/og_image_home.png",
  "isPartOf": {
    "@type": "WebSite",
    "url": "https://www.rc2solucoes.com.br",
    "name": "RC2 Soluções"
  },
  "publisher": {
    "@type": "Organization",
    "name": "RC2 Soluções",
    "url": "https://www.rc2solucoes.com.br",
    "logo": "https://www.rc2solucoes.com.br/images/logo-base-transparente-preto.png"
  }
}
```

### `/zapbox`

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Zapbox — o produto da RC2 para WhatsApp, atendimento e vendas",
  "description": "O Zapbox é o produto próprio da RC2 para atendimento e vendas pelo WhatsApp. Entenda o que pertence ao produto, o que continua sendo trabalho de automação e integração da RC2, e como os dois se conectam.",
  "url": "https://www.rc2solucoes.com.br/zapbox",
  "isPartOf": {
    "@type": "WebSite",
    "url": "https://www.rc2solucoes.com.br",
    "name": "RC2 Soluções"
  }
}
```

### `/solucoes`

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Soluções — Automação, Integrações e IA para Operações",
  "description": "Automação de processos, integração de sistemas, IA para operações e operações digitais & commerce. As quatro competências da RC2 para a operação da sua empresa funcionar melhor.",
  "url": "https://www.rc2solucoes.com.br/solucoes",
  "isPartOf": {
    "@type": "WebSite",
    "url": "https://www.rc2solucoes.com.br",
    "name": "RC2 Soluções"
  }
}
```


---

## Histórico de execução SDD

> As seções 1–4 acima são o snapshot **pré-refatoração** e não são editadas.
> Esta seção registra o andamento das fases.

### Adendo à Fase 0

A seção 1.1 omitiu um achado que o snapshot registra (seção 4, `/avaliacoes`):
`WebPage.image` sai como
`https://www.rc2solucoes.com.brhttps://ccaonec11w7vkoy6.public.blob.vercel-storage.com/og_image_home.png`.
`getWebPageSchema()` concatena `BASE_URL` com `settings.og_image_url`, que no
banco já é uma URL absoluta. Correção prevista para a Fase 2.

### Fase 1 — Identidade global — 2026-09-26

Branch `feat/schema-graph`. Verificado no HTML renderizado por `next start`
local, nas 9 rotas 200 do baseline.

| Entidade | Antes | Depois |
|---|---|---|
| `Organization` | sem `@id` | `@id` = `https://www.rc2solucoes.com.br/#organization` |
| `Organization.logo` | string | `ImageObject`, `@id` = `…/#logo`, mesma `url` |
| `WebSite` | sem `@id`, sem `publisher` | `@id` = `…/#website`, `publisher` → `{ "@id": "…/#organization" }` |

- Demais propriedades de `Organization`: iguais ao snapshot.
- `LocalBusiness`, `WebPage`, `BlogPosting`, `FAQPage`: **byte a byte iguais**
  ao snapshot em todas as rotas.
- IDs centralizados em `src/lib/schemaIds.ts`, derivados só de `BASE_URL`.
- Testes: `tests/unit/schema/globalIdentity.test.ts` (T01–T06).

### Fase 2 — WebPage — 2026-09-26

Branch `feat/schema-graph`. Verificado no HTML renderizado por `next start`
local.

| Mudança | Onde |
|---|---|
| `@id` = `{canonical}#webpage` (`schemaWebPageId()` em `src/lib/schemaIds.ts`) | todo `WebPage` |
| `isPartOf` inline → `{ "@id": "…/#website" }` | todo `WebPage` |
| `publisher` inline → `{ "@id": "…/#organization" }` | só onde já existia (`getWebPageSchema()`) |
| `image` resolvida por `resolveSchemaUrl()`: absoluta preservada, relativa resolvida, vazia → `/og-image.png` | `getWebPageSchema()` |

- Rotas via `getWebPageSchema()`: `/`, `/blog`, `/sobre`, `/contato`,
  `/avaliacoes`, `/privacidade`, `/termos`.
- Rotas com `WebPage` manual: `/zapbox`, `/solucoes`,
  `/solucoes/agenda-confirmada` — ganharam `@id` e `isPartOf` por referência;
  **continuam sem `publisher`** (não acrescentado; decisão pendente).
- `/avaliacoes`: `image` deixou de ser `https://www.rc2solucoes.com.brhttps://…`
  e passou a ser a URL do Blob configurada.
- Demais blocos (`Organization`, `LocalBusiness`, `WebSite`, `BlogPosting`,
  `FAQPage`): idênticos à Fase 1. Post do blog continua sem `WebPage` (Fase 4).
- Redirects de `/servicos`, `/servicos/automacao-de-processos`,
  `/solucoes/whatsapp-desorganizado`: inalterados (308).
- Testes: `tests/unit/schema/webPage.test.ts` (T01–T08 + produtores manuais).

### Fase 2.1 — Hardening do fallback de WebPage — 2026-09-26 — concluída

**Problema.** Nas páginas que montam o WebPage com `getWebPageSchema()`, a
chamada ficava dentro de um `try` junto com `getOrgSettings()`. Se a leitura
dos settings falhasse, o `catch` emitia só
`{"@context":"https://schema.org","@type":"WebPage"}` — sem `@id`, `url`,
`isPartOf` nem `publisher`. Em `/avaliacoes` não havia `try`: a falha
derrubava o corpo da página.

**Solução.**
- `getOrgSettingsOrNull()` (`src/lib/schema.ts`): devolve `null` em caso de
  falha, registrando o erro.
- `getWebPageSchema(settings: OrgSettings | null, …)`: identidade e relações
  vêm só da página e de `SCHEMA_IDS`; os settings alimentam apenas a imagem
  de fallback. Sem settings → `…/og-image.png`.
- `/`, `/blog`, `/sobre`, `/contato`, `/privacidade`, `/termos`,
  `/avaliacoes`: o `try/catch` com objeto mínimo virou uma única chamada.

**Invariantes.** No caminho normal, JSON-LD e redirects das 14 rotas
verificadas são idênticos byte a byte à Fase 2. Nenhuma outra entidade mudou.
Páginas com WebPage manual (`/zapbox`, `/solucoes`,
`/solucoes/agenda-confirmada`) não foram tocadas. Templates inalcançáveis
(`/servicos`, `/servicos/[slug]`, `/solucoes-com-ia`) mantêm o fallback antigo.

**Testes.** `tests/unit/schema/webPageFallback.test.ts`: T01–T06 no builder e
falha real do Supabase em 7 páginas publicadas, renderizando o Server
Component e lendo o JSON-LD emitido.

### Fase 3 — Service — decisão: SKIPPED (não executada)

Nenhuma rota publicada com HTTP 200 emite `Service`. Os templates
`/servicos/[slug]` estão fora do fluxo público por redirect (`docs/16`,
`docs/22`, `docs/24`). Nenhuma alteração de código associada.

### Fase 4 — BlogPosting + WebPage do artigo — 2026-09-26 — concluída

**Problema.** `/blog/[slug]` não emitia `WebPage`, e o `BlogPosting` não tinha
`@id`, `url`, `mainEntityOfPage` nem `isPartOf`; o `publisher` recriava a
Organization inline.

**Implementação.**
- `blogPostUrl(slug)` (`src/lib/blog/url.ts`): fonte única da URL canônica do
  post — usada pelo `generateMetadata` (canonical e `og:url`, saída
  inalterada), pelo link de compartilhamento e pelo JSON-LD.
- `schemaArticleId()` (`src/lib/schemaIds.ts`): `{canonical}#article`, mesma
  normalização de `schemaWebPageId()`.
- `src/lib/blogSchema.ts` (puro, sem consultas): `getBlogPostWebPageSchema()` e
  `getBlogPostingSchema()`. `BlogPostArticle.tsx` passa a emitir, nessa ordem,
  WebPage → BlogPosting → FAQPage.

**Relações adicionadas.**
- `WebPage {canonical}#webpage`: `isPartOf → #website`,
  `publisher → #organization`, `mainEntity → #article`.
- `BlogPosting {canonical}#article`: `url` = canonical,
  `mainEntityOfPage → #webpage`, `isPartOf → #website`,
  `publisher → #organization` (antes: Organization inline).

**Validação no HTML renderizado** (post do baseline): 1 WebPage, 1 BlogPosting,
1 FAQPage; relação bidirecional confirmada; `url` = canonical. `headline`,
`description`, `image`, datas e `author` idênticos ao snapshot; `FAQPage`
idêntico (5 perguntas); canonical e `og:url` iguais aos de produção. As outras
13 rotas verificadas: idênticas byte a byte à Fase 2.1.

**Preservado.** Autor (inclusive o `Person` "RC2 Soluções" — Fase 5), FAQPage,
Organization/WebSite/LocalBusiness globais, `areaServed`, metadata, conteúdo
visual, redirects. Sem Service, breadcrumb, Person persistente, `@graph`.

**Testes.** `tests/unit/schema/blogPosting.test.ts`: T01–T12, fallbacks de
autor/data/imagem e renderização do componente (quantidade e ordem dos blocos).

### Fase 4.1 — Security hardening do JSON-LD — 2026-09-26 — concluída

**Risco.** Todo `<script type="application/ld+json">` era preenchido com
`dangerouslySetInnerHTML={{ __html: JSON.stringify(...) }}`. `JSON.stringify`
não escapa `<`: um valor com `</script>` — título/resumo de post, FAQ,
settings — fecharia a tag e o restante seria interpretado como HTML. Pré-existente
(anterior à refatoração); confirmado por teste de controle.

**Solução.** `serializeJsonLd()` (`src/lib/jsonLd.ts`): `JSON.stringify` com todo
`<` trocado por `<`. JSON continua válido; `JSON.parse` devolve o `<`
original. Sem dependência nova; não muta o input; não sanitiza conteúdo.

**Cobertura.** 24 scripts JSON-LD em 17 arquivos — todos os encontrados por
busca global, inclusive templates hoje inalcançáveis (`/servicos/[slug]`,
`/solucoes/[slug]`, `/servicos`, `/solucoes-com-ia`) e `Breadcrumb.tsx`.
Restam 0 usos diretos de `JSON.stringify` em JSON-LD.

**Invariantes.** 46 blocos JSON-LD em 14 rotas: 0 erros de parse e conteúdo
idêntico à Fase 4. Nenhum dado real atual contém `<`, então o texto emitido
também é o mesmo. Nenhuma entidade, `@id`, relação, metadata, conteúdo visual
ou redirect mudou.

**Testes.** `tests/unit/schema/jsonLdSerializer.test.ts`: T01–T06 do
serializador; HTML renderizado (`renderToStaticMarkup` + `DOMParser`) do post
com título, resumo, autor e FAQ maliciosos e do Breadcrumb com rótulo
malicioso — nenhum script injetado, valores recuperáveis; e um controle que
mostra o `JSON.stringify` puro injetando script.

### Fase 5 — Author / Person — 2026-09-26 — concluída

**Problema.** Qualquer `author_name` virava `Person`. Os 15 posts publicados
(levantamento por leitura pública do JSON-LD de produção) têm
`author_name = "RC2 Soluções"` e emitiam
`{"@type":"Person","name":"RC2 Soluções","jobTitle":null,"image":null}` — a
empresa modelada como pessoa, com `null`s. Nenhum post publicado tem autor
individual.

**Regra de decisão** (`getBlogAuthorSchema()`, `src/lib/blogSchema.ts`).
- `author_name` ausente (`null`, `""`, só espaços) ou na lista explícita
  `INSTITUTIONAL_AUTHOR_NAMES = {"RC2 Soluções"}` (comparação após `trim` e
  NFC; sem heurística) → `author: { "@id": "…/#organization" }`, sem Person.
- Qualquer outro nome → `Person` em bloco JSON-LD próprio,
  `@id = BASE_URL/#person-{slug}` (`schemaPersonId()`), e
  `author: { "@id": … }`. Slug via `slugify()` existente, só a partir do nome
  — mesmo autor, mesmo `@id` em todos os posts.
- `jobTitle`, `image` (URL resolvida por `resolveSchemaUrl`) e `sameAs`
  (`author_linkedin`, só se `http(s)://`) só existem com dado real. Sem
  `worksFor`, `knowsAbout` nem `description`/bio.

**Implementação.** `resolveSchemaUrl()` mudou de lugar para
`src/lib/schemaUrl.ts` (módulo puro; `schema.ts` o reexporta, sem mudança de
saída). `BlogPostArticle.tsx` emite o Person, quando existe, entre BlogPosting e
FAQPage, via `serializeJsonLd`.

**Validação no HTML renderizado.** Post do baseline: `author` passou de
`Person "RC2 Soluções"` para `{ "@id": "…/#organization" }`; WebPage,
BlogPosting fora de `author`, FAQPage e blocos globais idênticos à Fase 4.1.
Os 15 posts publicados: `author` → `#organization`, 0 blocos Person. Demais 13
rotas verificadas: idênticas.

**Testes.** `tests/unit/schema/authorPerson.test.ts` (T01–T12 e slug).
Ajustados, por mudança intencional do autor: `blogPosting.test.ts` (T10 da
Fase 4) e `jsonLdSerializer.test.ts` (o autor malicioso agora vai para o bloco
Person).

**Invariantes.** WebPage, BlogPosting fora de `author`, FAQPage, Organization,
WebSite, LocalBusiness, `areaServed`, breadcrumb, metadata, conteúdo visual e
redirects inalterados. Sem Service, sem Person em `/sobre`, sem `@graph`.

### Fase 5.1 — Estabilidade do `Person @id` — 2026-09-26 — concluída

**Fragilidade.** Na Fase 5 o `@id` da pessoa vinha do slug do nome: corrigir a
grafia (`Robson Azevedo` → `Robson S. Azevedo`) criaria outra entidade, e dois
homônimos colidiriam no mesmo `@id`.

**Formato real de `author_id`.** UUID — `id` da tabela `authors`
(`gen_random_uuid()`), validado como UUID no admin (`z.string().uuid()`),
gravado por `mapAuthorToPostSnapshot`. Consulta agregada somente leitura
(2026-09-26): 16 posts, 14 com `author_id`, os 14 apontando para `authors`,
0 para `auth.users`, 0 órfãos. Identificador técnico aleatório, sem papel de
autenticação — apropriado para uso público. Já vem nas consultas do post
(`select("*")` na rota pública e no preview) e já está no tipo `Post`.

**Nova ordem de identidade** (`getBlogAuthorSchema()`):
1. sem `author_name` ou nome institucional → `#organization` (ignora `author_id`);
2. pessoa com `author_id` UUID válido → `#person-{author_id}` (minúsculas, sem espaços);
3. pessoa sem `author_id` válido → `#person-{slug-do-nome}` (fallback legado).

Uma única função de `@id` (`schemaPersonId(chave)`); a escolha da chave fica
só no builder.

**Impacto atual em produção.** Nenhum: os 15 posts publicados são
institucionais — `author` → `#organization`, 0 Person; as 14 rotas verificadas
são idênticas byte a byte à Fase 5.

**Testes.** `tests/unit/schema/personId.test.ts`: institucional ignora
`author_id`; pessoa com `author_id`; estabilidade (nome muda, `@id` fica);
colisão (mesmo nome, `author_id` diferente → `@id` diferente); fallback por
nome; `author_id` inválido cai no fallback; campos opcionais iguais à Fase 5.

### Fase 6 — BreadcrumbList em `/blog/[slug]` — 2026-09-26 — concluída

**Escopo e decisão.** Só `/blog/[slug]`: é a única rota publicada que já exibe
breadcrumb visível (`BlogPostArticle`), então o schema representa conteúdo
existente, sem mudança de UX nem hierarquia artificial. Nenhuma outra rota
ganhou breadcrumb; o componente legado `Breadcrumb.tsx` segue só em
`/servicos/[slug]` e `/solucoes/[slug]` (inalcançáveis), sem alteração.

**Hierarquia.** `getBlogBreadcrumbSchema()` (`src/lib/blogSchema.ts`),
`@id = {canonical}#breadcrumb` (`schemaBreadcrumbId()`):
1. Início → `https://www.rc2solucoes.com.br`
2. Blog → `https://www.rc2solucoes.com.br/blog`
3. `post.title` — sem `item` (página corrente)

**Categoria fora.** Não tem página canônica própria (é filtro
`/blog?category=`) e, no breadcrumb visível, aparece como texto, sem link.

**Relação.** `WebPage.breadcrumb → { "@id": "{canonical}#breadcrumb" }`.
BlogPosting sem breadcrumb. Script emitido logo após o WebPage, via
`serializeJsonLd`.

**Validação no HTML renderizado.** Post do baseline: 1 WebPage, 1
BreadcrumbList, 1 BlogPosting, 1 FAQPage, 0 Person; os 3 itens corretos;
WebPage fora de `breadcrumb`, BlogPosting, FAQPage e blocos globais idênticos
à Fase 5.1. 15 posts: 15 BreadcrumbList. Outras 13 rotas: idênticas.

**Testes.** `tests/unit/schema/breadcrumbList.test.ts` (T01–T12). Ajustados
por mudança intencional de contagem/ordem de scripts: `blogPosting.test.ts`,
`authorPerson.test.ts`, `jsonLdSerializer.test.ts`.

**Invariantes.** BlogPosting, autoria/Person, FAQPage, Organization, WebSite,
LocalBusiness, `areaServed`, metadata, breadcrumb visual e demais conteúdo
visual, redirects. Sem Service, CollectionPage, ItemList ou `@graph`.

### Fase 6 — encerramento — 2026-09-26

Primeiro item do `BreadcrumbList` do blog alinhado ao rótulo da tela:
`"Início"` → `"Home"`. Resultado: **Home (UI) = Home (BreadcrumbList)** →
Blog → título do post. Única diferença em relação à Fase 6 em todas as rotas
verificadas; 3 itens, posições 1–3, categoria fora, `WebPage.breadcrumb`
inalterado. Acessibilidade do `<nav>` (`aria-label`, `aria-current`) fica como
débito A11Y-BREADCRUMB-01/02, não tratado aqui.

### Fase 7 — LocalBusiness — decision gate apresentado, sem decisão

Diagnóstico entregue para decisão (A: só Organization · B: entidade única
`["Organization","LocalBusiness"]` · C: duas entidades). Nenhum código de
Organization/LocalBusiness alterado.

### Fase 7 — Organization consolidada, LocalBusiness removido — 2026-09-26 — concluída

**Decisão.** Alternativa **A** (só Organization), aprovada no decision gate.
Organization e LocalBusiness descreviam a mesma empresa, com os mesmos dados;
o LocalBusiness não tinha `@id`, não acrescentava nada exclusivo (`geo` nunca
foi emitido) e o fallback o emitia sem endereço.

**Remoção.** `getLocalBusinessSchema()` (`src/lib/schema.ts`), o tipo
`LocalBusiness` (`src/lib/types/schema.ts`), o script e o fallback de
LocalBusiness em `src/app/layout.tsx` e a saída `localBusiness` de
`/api/schema-debug`. Layout global emite agora **Organization + WebSite**,
nos dois caminhos (settings ok / settings falhando).

**Organization consolidada** (`#organization`): name, url, logo `#logo`,
email, telephone, address, areaServed, sameAs (Instagram, LinkedIn, Perfil da
Empresa no Google) e contactPoint (e-mail e telefone) — tudo inalterado, exceto
`areaServed`.

**areaServed corrigido** (`getAreaServed()`): `business_area` "Brasil" (e
variações de caixa/espaço, e "Brazil") ou vazio → `{"@type":"Country","name":"Brasil"}`.
Antes: `City / Brasil`, e fallback `Country / Brazil`. Outro valor, sem regra
que o classifique, sai como texto simples — não é mais tipado como City.

**Preservado.** `address` sem alteração (ver ORG-ADDRESS-01); sem `geo`;
WebSite, WebPage, BlogPosting, Person, BreadcrumbList, FAQPage, metadata,
conteúdo visual e redirects idênticos à Fase 6 no HTML renderizado. Sem Service
e sem `@graph`.

**Adiado para a Fase 7.1.** `/api/schema-debug` continua público (HTTP 200);
nesta fase só perdeu a saída `localBusiness`.

**Testes.** `tests/unit/schema/organization.test.ts` (T01–T09, com o
`RootLayout` renderizado com e sem settings) e `globalIdentity.test.ts`
(o teste da Fase 1 que afirmava o LocalBusiness intacto passou a afirmar que
ele não existe).

### Débitos registrados

- **ORG-ADDRESS-01** — Alinhar o endereço dos settings com a fonte
  pública/oficial antes de alterar `Organization.address`. Hoje os settings têm
  "Av Nova América" (sem número, bairro e UF), enquanto `/privacidade` e
  `/termos` publicam "Avenida Nova América, 202, Jardim Santa Cecília,
  Guarulhos/SP".
- **DB-AUTHOR-01** — `posts.author_id` sem chave estrangeira para `authors`.
- **DB-AUTHOR-02** — comentário da coluna `posts.author_id` desatualizado.
- **A11Y-BREADCRUMB-01** — `<nav>` do breadcrumb do blog sem `aria-label`.
- **A11Y-BREADCRUMB-02** — último item do breadcrumb sem `aria-current="page"`.
- **SEO-METADATA-RESILIENCE** — `generateMetadata` de `/`, `/sobre`,
  `/contato`, `/avaliacoes` chama `getOrgSettings()` sem proteção.
- **Fase 7.1** — `/api/schema-debug` público em produção.

### Fase 7.1 — Remoção de `/api/schema-debug` — 2026-09-26 — concluída

**Endpoint.** `GET /api/schema-debug` respondia 200 em produção, sem
autenticação, devolvendo settings da organização e os schemas. Endpoint de
diagnóstico, não funcionalidade do produto. `robots.txt` (`Disallow: /api/`)
não é proteção.

**Consumidores.** Nenhum. Busca por `schema-debug`/`schemaDebug` fora de
`node_modules`/`.next`: só o próprio `route.ts` e este histórico. Sem uso em
frontend, admin, testes, E2E, scripts, `proxy.ts`, `next.config.ts`.

**Decisão.** Rota removida por completo (`src/app/api/schema-debug/route.ts`)
— sem proteção por auth, env ou token, sem rota substituta. Nenhum helper
ficou morto (`getOrgSettings` e `getOrganizationSchema` seguem em uso).

**Validação.** Build local: `GET /api/schema-debug` → **404**
(`/api/schema-debug/` → 308 do normalizador de barra final → 404). Demais
rotas `/api/*` presentes e com o mesmo comportamento. JSON-LD e redirects das
14 rotas verificadas idênticos byte a byte à Fase 7.

**Testes.** `tests/unit/schema/schemaDebugRemoved.test.ts`: rota inexistente,
0 referências em `src/`, nenhuma rota de schema substituta, demais `/api/*`
presentes. A cobertura de schema continua nos testes dos builders e do
`RootLayout` (`organization.test.ts`, `globalIdentity.test.ts` etc.).

**Achado (fora do escopo, não tratado).** `GET /api/google/debug` também é
público em produção (200): chama a Google Places API com a chave do servidor a
cada requisição e devolve a resposta bruta.

### Fase 7.2 — Remoção de `/api/google/debug` — 2026-09-26 — concluída

**Risco.** `GET /api/google/debug` respondia 200 em produção, sem
autenticação. A cada requisição chamava a Google Places API
(`places.googleapis.com/v1/places/{placeId}`) com a chave do servidor e
devolvia a resposta bruta — superfície para abuso de cota/custo e
reconhecimento da integração.

**Consumidores.** Nenhum funcional. O único `fetch` a `/api/google/*` no
frontend (`GoogleReviews.tsx`) usa `/api/google/places`. Outras ocorrências: o
histórico SDD e o teste da Fase 7.1 que listava `google/debug` entre as rotas
preservadas (ajustado).

**Chave.** Lida só no servidor (`process.env`) e usada na URL da chamada
externa; nenhum `console.*` na rota; a resposta devolvia apenas
`apiKeyDefined: true/false`, nunca o valor. A resposta bruta do Google e
`error.message` iam ao cliente — nenhum vazamento da chave constatado por esse
caminho. Nenhuma rotação ou mudança no Google Cloud (fora do escopo).

**Decisão.** Rota removida por completo (`src/app/api/google/debug/route.ts`,
sem imports — nada ficou órfão). Sem proteção por auth/env/token e sem rota
substituta. `/api/google/places` e `src/lib/google/places.ts` intactos.

**Validação.** Build local: `/api/google/debug` → **404**
(`/api/google/debug/` → 308 do normalizador de barra final → 404);
`/api/schema-debug` → 404. Manifesto de rotas: antes com `/api/google/debug`,
depois só `admin/init`, `contact`, `google/places`, `posts`, `upload`. Demais
APIs com o mesmo comportamento da Fase 7.1. JSON-LD e redirects das 14 rotas
verificadas idênticos byte a byte à Fase 7.1.

**Typecheck e `.next`.** A 1ª execução falhou só por `.next/types/validator.ts`
(gerado pelo build anterior) ainda citar a rota; após o build, exit 0. Mesmo
comportamento da Fase 7.1.

**Testes.** `tests/unit/schema/googleDebugRemoved.test.ts`: rota inexistente,
0 referências em `src/`, nenhuma rota de debug em `/api`, `/api/google/places`
presente e consumido por `GoogleReviews`, lista exata das rotas `/api`.
