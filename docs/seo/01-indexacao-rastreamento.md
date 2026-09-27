# SEO técnico — Fase 1: Indexação e rastreamento

Auditoria de 2026-09-27 em produção (`main` @ `f0204ee`), por leitura HTTP
pública, sem seguir redirects automaticamente. Baseline:
`docs/seo/baseline-post-schema.md`.

Esta fase **não corrige nada**: registra evidência, prioriza e propõe. A SPEC
de implementação vem depois dos decision gates (seção 5).

---

## 1. Comparação de conjuntos

| Conjunto | Tamanho | Origem |
|---|---:|---|
| Páginas HTML publicadas e indexáveis (200, `index`) | 23 | 8 estáticas + 15 posts |
| URLs no sitemap | 25 | as 23 acima + `/llms.txt` + `/llms-full.txt` |
| Posts publicados no CMS × posts no sitemap | 15 × 15 | coincidem |
| Páginas 200 deliberadamente fora do sitemap | 2 | `/privacidade`, `/termos` — `noindex` (`docs/29` §2) |
| URLs indexadas no Google | — | **[pendente]** — exige Search Console |

Não há página indexável publicada fora do sitemap, nem URL do sitemap que não
seja 200 indexável. A comparação com o índice do Google fica **[pendente]**.

## 2. Verificações que passaram

| Critério | Resultado |
|---|---|
| Sitemap só com URLs canônicas indexáveis | ok — 23 HTML, todas 200, canonical self, `index, follow` (ver IDX-04 para os `.txt`) |
| Nenhuma URL redirecionada no sitemap | ok — 0 |
| Nenhuma página estratégica com `noindex` | ok |
| Canonical self-referencing nas indexáveis | ok — 23/23 |
| Redirects de migração | ok — **38/38** (19 regras × com/sem barra) em **1 salto** 308 até 200, destino igual ao declarado em `next.config.ts` |
| Loops / chains nos redirects de migração | 0 |
| `http://www` e `https://` apex → canônico | 1 salto cada (ver IDX-05 para `http://` apex) |
| Barra final (`/sobre/`, `/blog/`) | 308 → sem barra, 1 salto |
| Parâmetros de rastreamento (`?utm_*`) | 200 com canonical limpo (`/`, `/sobre`) |
| `/blog?category=*` (8 categorias) | 200 com canonical `/blog` — consolidado na listagem |
| Variações de caixa (`/Sobre`, `/SOLUCOES`) | 404 |
| URL inexistente fora do blog | 404 real |
| `/privacidade`, `/termos` | `noindex`, fora do sitemap — sem contradição |
| Preview de post | `noindex, nofollow` (ver IDX-01 sobre o status) |
| `/admin` | `noindex, nofollow`; `/admin/*` → 307 para `/admin` (ver IDX-06) |
| Home: sitemap × canonical × `WebPage.url` | idênticos (`https://www.rc2solucoes.com.br`) |

---

## 3. Problemas confirmados

### IDX-01 — Soft 404 em `/blog/[slug]` · **ALTA**

**Evidência.** Qualquer slug inexistente sob `/blog/` responde **HTTP 200** com o
conteúdo "Página não encontrada" e **duas** `meta robots` contraditórias:

```text
GET /blog/post-inexistente-rc2     → 200  <meta robots "index, follow"> + <meta robots "noindex">
GET /blog/outro-slug-aleatorio-xyz → 200  (idem)
GET /blog/<slug>/preview (anônimo)  → 200  <meta robots "noindex, nofollow"> + <meta robots "noindex">
GET /pagina-que-nao-existe-rc2     → 404  (correto)
```

**Impacto.** O Google aplica a diretiva mais restritiva (`noindex`), então a
página não entra no índice, mas é um **soft 404**: aparece como tal no Search
Console, consome rastreamento e afeta todo post que for despublicado ou
renomeado (URL antiga responde 200 em vez de 404). O `index, follow` do layout
convivendo com o `noindex` é, por si, um sinal inconsistente.

**Causa provável (a confirmar na SPEC).** A página chama `notFound()` depois que
a resposta já começou a ser enviada (layout raiz assíncrono / streaming); nesse
caso o Next mantém o status 200 e injeta `noindex` no HTML. A confirmação e a
correção dependem da documentação desta versão do Next
(`node_modules/next/dist/docs/`), conforme `AGENTS.md`.

**Correção proposta.** Garantir que slug inexistente (e post não publicado)
responda **404** — o status HTTP, não só o conteúdo — sem quebrar a publicação
de posts novos pelo CMS (ISR, `revalidate = 60`). Descartado de antemão:
`dynamicParams = false`, porque posts publicados depois do build ficariam 404
até novo deploy. Remover a `meta robots` duplicada nas páginas de erro.

**Aceite.** `/blog/<slug-inexistente>` → 404; post publicado continua 200;
post novo publicado pelo CMS fica acessível sem deploy; uma única `meta
robots` coerente na página de erro; teste de regressão cobrindo os três casos.

**URLs/templates.** `src/app/(public)/blog/[slug]/page.tsx`,
`src/app/(public)/blog/[slug]/preview/page.tsx` (mesmo mecanismo), layout raiz
(meta robots padrão).

---

### IDX-02 — Links internos para URLs redirecionadas no conteúdo dos posts · **MÉDIA**

**Evidência.** 13 dos 15 posts têm **23 links** para URLs que hoje redirecionam.
Todos vêm do HTML dos posts no CMS — **nenhum vem do código**
(`CMS_INTERNAL_LINK_DEBT`, `docs/16` §9.5). Cinco são absolutos para o domínio
**apex** (`https://rc2solucoes.com.br/...`) e custam **2 saltos**.

| Post | Links para URL redirecionada |
|---|---|
| `atendimento-automatizado-contexto` | `/servicos/automacoes-com-ia` |
| `atendimento-omnichannel-pme` | apex: `/servicos/agentes-de-ia`, `/servicos/automacao-de-processos`, `/servicos/automacoes-com-ia` |
| `automacao-whatsapp-ia` | apex: `/servicos/automacoes-com-ia` |
| `custo-de-agente-de-ia` | `/servicos/agentes-de-ia`, `/servicos/automacoes-com-ia` |
| `e-commerce-para-pme-operacao` | `/servicos/e-commerce`, `/servicos/automacao-de-processos`, `/servicos/sites-e-landing-pages` |
| `governanca-agentes-ia-pmes` | www absoluto: `/servicos/agentes-de-ia`, `/servicos/automacao-de-processos` |
| `ia-para-pequenas-empresas` | apex: `/servicos/automacoes-com-ia` |
| `integracao-canais-atendimento` | `/servicos/automacoes-com-ia`, `/servicos/automacao-de-processos` |
| `leads-sem-resposta-primeiro-retorno` | `/solucoes/leads-sem-resposta`, `/servicos/automacoes-com-ia` |
| `mensagens-servico-whatsapp-business-api` | `/servicos/automacoes-com-ia` |
| `processos-manuais-o-que-automatizar` | www absoluto: `/servicos/automacao-de-processos` |
| `seguranca-de-agente-de-ia` | `/servicos/agentes-de-ia`, `/servicos/automacao-de-processos` |
| `solucoes-automatizadas-7-criterios-para-avaliar-fornecedores` | `/solucoes/processos-manuais`; www absoluto: `/servicos/automacao-de-processos` |

**Destino final de cada origem** (o próprio redirect em produção):

| Origem | Destino final |
|---|---|
| `/servicos/automacoes-com-ia` | `/zapbox` |
| `/solucoes/leads-sem-resposta` | `/zapbox` |
| `/servicos/agentes-de-ia` | `/solucoes#ia-para-operacoes` |
| `/servicos/automacao-de-processos` | `/solucoes#automacao-de-processos` |
| `/servicos/e-commerce` | `/solucoes#operacoes-digitais-commerce` |
| `/servicos/sites-e-landing-pages` | `/solucoes` |
| `/solucoes/processos-manuais` | `/solucoes` |

**Impacto.** Os links funcionam (os redirects existem), mas cada clique e cada
rastreamento passa por 1–2 saltos, contrariando `docs/16` §4 (princípio 5:
nenhum link interno cria salto quando o destino final é conhecido).

**Correção proposta.** Atualização do HTML dos posts no Supabase, no padrão já
usado em `docs/sql/31` (backup + `UPDATE` idempotente + conferência), trocando
cada href pelo destino final **relativo**. A âncora de texto deve ser revisada
junto — um texto que promete "serviço de automação com IA" apontando para
`/zapbox` precisa fazer sentido para o leitor (território RC2 × Zapbox).

**Aceite.** 0 links em posts publicados para URLs que redirecionam; 0 links
absolutos para o apex; destinos coerentes com o texto.

---

### IDX-03 — `lastmod` fixo no sitemap · **BAIXA**

**Evidência.** As páginas estáticas têm `lastmod` escrito à mão em
`src/app/sitemap.ts` (`2026-05-18` / `2026-05-20`), embora várias tenham
mudado depois (ex.: title e description da Home na PR #29). Os posts usam
`updated_at` do banco — corretos.

**Impacto.** O Google ignora `lastmod` que não reflete mudanças reais; perde-se
um sinal de recrawl nas páginas estáticas.

**Correção proposta.** Manter as datas atualizadas quando a página muda, ou
omitir `lastmod` das estáticas. Decisão simples, sem gate.

---

### IDX-04 — `/llms.txt` e `/llms-full.txt` no sitemap · **BAIXA — decisão**

**Evidência.** As duas URLs estão no sitemap; são `text/plain`, sem canonical e
indexáveis.

**Impacto.** O sitemap deixa de ser só "páginas canônicas indexáveis"; os
arquivos resumem o próprio site e podem aparecer como resultado de texto
simples.

**Correção proposta.** Tirá-los do sitemap (continuam acessíveis a quem os
procura em `/llms.txt`) e, se desejado, enviar `X-Robots-Tag: noindex` neles.
Depende de decisão de negócio (DG-3).

---

### IDX-05 — `http://` no domínio apex leva 2 saltos · **BAIXA**

**Evidência.** `http://rc2solucoes.com.br/sobre` → 308 (`https://rc2solucoes.com.br/sobre`)
→ 301 (`https://www.rc2solucoes.com.br/sobre`) → 200. `https://` apex e
`http://www` levam 1 salto.

**Causa provável.** Configuração de domínio na Vercel (HTTPS primeiro, depois
apex → www), antes da regra de `next.config.ts`.

**Correção proposta.** Ajuste de redirect de domínio na Vercel, não no código.
Impacto baixo: afeta apenas links legados `http://` sem `www`. DG-4.

---

### IDX-06 — `/admin`: `noindex` invisível por causa do `Disallow` · **INFO**

**Evidência.** `robots.txt` bloqueia `/admin`; a página responde 200 com
`noindex, nofollow`. Como o rastreador não pode buscá-la, não vê o `noindex`; se
a URL for linkada de fora, pode aparecer no índice só como URL.

**Recomendação.** Sem ação agora. Registrar; reavaliar se o Search Console
mostrar `/admin` "indexada, embora bloqueada pelo robots.txt".

---

### IDX-07 — H1 duplicado em 6 posts · **Fase 6 (SEO-DUAL-H1)**

**Evidência.** 6 de 15 posts têm dois `<h1>`. O template emite um só
(`BlogPostArticle.tsx`); o segundo vem do HTML do post no CMS. Encaminhado à
Fase 6 do SDD de SEO — não é problema de indexação.

---

## 4. Priorização

| ID | Prioridade | Tipo | Onde corrigir |
|---|---|---|---|
| IDX-01 | **Alta** | engenharia | código (`/blog/[slug]`, preview, layout) |
| IDX-02 | Média | conteúdo/dados | Supabase (HTML dos posts) |
| IDX-03 | Baixa | engenharia | `src/app/sitemap.ts` |
| IDX-04 | Baixa | decisão | `src/app/sitemap.ts` (+ header opcional) |
| IDX-05 | Baixa | infraestrutura | Vercel (domínios) |
| IDX-06 | Info | — | nenhuma ação |
| IDX-07 | Fase 6 | conteúdo | CMS |

Sugestão de branches: `fix/seo-soft-404` (IDX-01), `fix/seo-sitemap-hygiene`
(IDX-03 + IDX-04), e IDX-02 como unidade de conteúdo com SQL próprio.

## 5. Decision gates

| Gate | Decisão | Bloqueia |
|---|---|---|
| **DG-1** | Fornecer os exports do Search Console listados no baseline (ou acesso) | comparação com o índice real; Fases 5–6 |
| **DG-2** | Aprovar a tabela de troca de links do IDX-02 (inclusive o texto das âncoras que passam a apontar para `/zapbox`) e quem executa o SQL no Supabase | IDX-02 |
| **DG-3** | Manter ou tirar `llms.txt`/`llms-full.txt` do sitemap | IDX-04 |
| **DG-4** | Ajustar o redirect de domínio apex na Vercel | IDX-05 |

IDX-01 e IDX-03 não dependem de decisão de negócio: podem seguir para SPEC.

## 6. Critérios de aceite da Fase 1 — estado atual

| Critério (SDD) | Estado |
|---|---|
| Sitemap contém apenas URLs canônicas indexáveis | parcial — HTML ok; `.txt` pendentes de DG-3 |
| Nenhuma URL redirecionada no sitemap | ok |
| Nenhuma página estratégica com `noindex` | ok |
| Nenhuma URL administrativa no índice | ok tecnicamente; confirmação no índice **[pendente DG-1]** |
| Canonical self-referencing nas indexáveis | ok |
| Redirects existentes corretos | ok (38/38) |
| Sem loops ou chains desnecessárias | ok nos redirects; chains vindas de links do CMS em IDX-02 e de `http://` apex em IDX-05 |

## 7. Histórico de status

| Data | ID | Status | Evidência |
|---|---|---|---|
| 2026-09-27 | IDX-01 | **corrigido** (branch `fix/seo-blog-404`, aguardando PR/deploy) | ver abaixo |
| 2026-09-27 | IDX-01 | **confirmado em produção** (PR #32, merge `6a736828ad042bcc8229350e4544660e59f01997`) | ver abaixo |
| 2026-09-27 | IDX-08 | **aberto** (achado da validação do IDX-01) | ver abaixo |
| 2026-09-27 | IDX-08 | **corrigido localmente** (branch `fix/seo-global-404-metadata`, aguardando PR/deploy) | ver abaixo |

**IDX-01 — corrigido.** Causa confirmada por experimento: os `loading.tsx` de
`/blog` e de `/blog/[slug]` envolviam a página em Suspense e a resposta
começava em streaming antes do `notFound()`, fixando o status 200. Removendo só
o de `[slug]`, o status seguiu 200 (o de `/blog` também envolve o segmento
filho); sem os dois, 404.

Correção: `[slug]/loading.tsx` removido; o skeleton do índice passou para o
route group `blog/(index)/` e deixou de envolver o post; `[slug]/not-found.tsx`
reaproveita a UI do 404 global e declara `noindex, nofollow` sem canonical;
`getPost` usa `React.cache` e `maybeSingle()` e lança em falha de banco (só
"post não existe" vira 404).

Medido em build de produção local (`next start`):

| URL | Antes | Depois |
|---|---|---|
| post publicado | 200 · `index, follow` · canonical próprio | igual |
| slug inexistente | 200 · `index, follow` + `noindex` · canonical da Home | **404** · `noindex` + `noindex, nofollow` · sem canonical |
| `/preview` de post existente, sem admin | 200 | **404** |
| `/preview` de slug inexistente | 200 | **404** |
| `/blog` | 200 | 200 |

Metadata, canonical, robots, JSON-LD e H1 das 23 URLs do sitemap: idênticos a
produção. Texto do artigo: idêntico; agora vem inline em `<main>` no HTML
inicial (antes, skeleton + bloco oculto trocado por JS).

Testes: `tests/unit/blog/postNotFound.test.ts` e
`tests/e2e/blog-not-found.spec.ts` (6/6 no build local; contra a produção atual,
4/6 falham com 200 — controle negativo).

Pendente: confirmar em produção após o deploy e, com DG-1, acompanhar no
Search Console a saída dessas URLs de "Soft 404".

**IDX-01 — confirmado em produção (2026-09-27).** PR #32 mesclada por merge
commit `6a736828ad042bcc8229350e4544660e59f01997` (pais `f0204ee` e `56dddf1`);
deployment de Production do Vercel concluído para esse commit. Em
`https://www.rc2solucoes.com.br`:

| URL | Status | robots | canonical |
|---|---:|---|---|
| `/blog/slug-inexistente-idx01` | 404 | `noindex` + `noindex, nofollow` | nenhum |
| `/blog/post-que-nao-existe-rc2` | 404 | `noindex` + `noindex, nofollow` | nenhum |
| `/blog/slug-inexistente-idx01/preview` | 404 | idem | nenhum |
| `/blog/solucoes-automatizadas-7-criterios-para-avaliar-fornecedores/preview` (sem admin) | 404 | idem | nenhum |
| `/blog/solucoes-automatizadas-7-criterios-para-avaliar-fornecedores` | 200 | `index, follow` | próprio |
| `/blog` | 200 | `index, follow` | próprio |

Nas 23 URLs do sitemap, metadata, canonical, JSON-LD e H1 idênticos ao
pré-deploy; o texto do artigo passou a vir inline em `<main>`, igual ao build
validado. Preview autenticado não validado manualmente em produção (cobertura
unitária).

### IDX-08 — Metadata do 404 global · **MÉDIA**

**Evidência (produção, `main` @ `6a73682`).** Toda URL inexistente fora de
`/blog/[slug]` — `/pagina-inexistente-idx08`, `/nao-existe-rc2-idx08`,
`/foo/bar/inexistente-idx08`, e também `/Sobre` e `/SOLUCOES` — responde 404
com:

- `<meta name="robots" content="noindex">` **e** `content="index, follow"`;
- `<meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1">`;
- canonical `https://www.rc2solucoes.com.br` (Home);
- `og:url` da Home, `og:type=website` e título padrão do site.

O status já era correto; o problema é só a metadata.

**Causa.** `src/app/layout.tsx` (`generateMetadata`) define para todo o site
`robots` (`index`, `follow` e `googleBot`), `alternates.canonical` e
`openGraph.url` da Home. `src/app/not-found.tsx` não declarava metadata, então
o 404 herdava tudo. O `noindex` vem do próprio Next, que o injeta em respostas
404. O 404 global renderiza direto sob o layout raiz (sem o layout
`(public)`), por isso não tem Header/Footer — comportamento preexistente,
mantido.

**Correção.** `src/app/not-found.tsx` passa a exportar `metadata` com
`robots: { index: false, follow: false }`, `alternates: { canonical: null }`,
`openGraph: null` e `title: "Página não encontrada"`. Como o merge de metadata
é raso, cada chave substitui a do layout inteira — o `googleBot` some junto.
Sem `global-not-found.js` e sem flag experimental; layout raiz inalterado.

**Validação (build local).** 3 URLs globais + `/Sobre` + `/SOLUCOES`: 404,
robots só `noindex` + `noindex, nofollow`, 0 canonical, sem Open Graph; mesmo
resultado com User-Agent do Googlebot. Home: 200, `index, follow` +
`googlebot`, canonical próprio. 23 URLs do sitemap sem nenhuma diferença contra
a produção. 404 visualmente idêntico (screenshots com o mesmo hash). 0 consulta
ao banco no 404. Testes: `tests/unit/seo/globalNotFoundMetadata.test.ts` e
`tests/e2e/global-not-found.spec.ts` (contra a produção atual, os 4 testes de
404 global falham com `robots "index, follow"` — controle negativo).

Pendente: confirmar em produção após o deploy.
