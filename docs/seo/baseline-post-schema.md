# SEO técnico — Baseline pós-Schema (Fase 0)

Retrato de produção **depois** do deploy da PR #31 (grafo Schema.org), antes de
qualquer nova correção de SEO.

| | |
|---|---|
| Data | 2026-09-27 |
| Produção | `https://www.rc2solucoes.com.br` — `main` @ `f0204ee` (merge da PR #31) |
| Evidência do deploy | `/api/schema-debug` e `/api/google/debug` → 404; JSON-LD com `#organization`/`#website`; 0 `LocalBusiness` |
| Método | leitura HTTP pública (sem SQL, sem credenciais), sem seguir redirects automaticamente; JSON-LD, canonical, `meta robots` e `X-Robots-Tag` extraídos do HTML servido |
| Detalhe técnico | `docs/seo/01-indexacao-rastreamento.md` |

Legenda de procedência: **[medido]** — verificado em produção nesta data ·
**[pendente]** — depende de fonte não acessível daqui.

---

## 1. Search Console — **[pendente]**

Este ambiente não tem acesso ao Google Search Console (nenhum conector ou
credencial). Nada abaixo foi estimado ou inferido: estes dados **não foram
coletados**.

| Dado pedido | Onde exportar no Search Console |
|---|---|
| Páginas indexadas / não indexadas, motivos, "rastreada, não indexada", "descoberta, não indexada" | Indexação → Páginas (exportar "Por que as páginas não estão indexadas" e a lista de indexadas) |
| Canonical declarado × escolhido pelo Google | Inspeção de URL, uma a uma, nas URLs prioritárias (seção 2) |
| Sitemap enviado e status | Indexação → Sitemaps |
| Erros de rastreamento | Configurações → Estatísticas de rastreamento |
| Core Web Vitals (campo) | Experiência → Core Web Vitals (mobile e desktop) |
| Consultas, páginas, impressões, cliques, CTR, posição | Desempenho → Resultados da pesquisa, últimos 3 meses, abas Consultas e Páginas (exportar CSV) |

**Core Web Vitals de campo:** tentativa pela API pública do PageSpeed Insights
(que expõe dados do Chrome UX Report sem credencial) retornou `429` — cota
anônima diária esgotada. Também **[pendente]**: Search Console ou PSI com
chave própria.

Até esses dados chegarem, as Fases 5 (query mapping) e 6 (conteúdo) do SDD de
SEO não podem começar, e a pergunta "o Google está indexando exatamente o que
queremos?" só tem a metade técnica respondida (seção 3).

---

## 2. URLs prioritárias — estado técnico **[medido]**

"5 posts mais relevantes" exige dados de desempenho **[pendente]**; por isso a
tabela cobre **todos** os 15 posts publicados.

| URL | Status | Canonical | robots | H1 | JSON-LD |
|---|---:|---|---|---:|---|
| `/` | 200 | self | index, follow | 1 | Organization, WebSite, WebPage |
| `/solucoes` | 200 | self | index, follow | 1 | Organization, WebSite, WebPage |
| `/solucoes/agenda-confirmada` | 200 | self | index, follow | 1 | Organization, WebSite, WebPage |
| `/blog` | 200 | self | index, follow | 1 | Organization, WebSite, WebPage |
| `/sobre` | 200 | self | index, follow | 1 | Organization, WebSite, WebPage |
| `/contato` | 200 | self | index, follow | 1 | Organization, WebSite, WebPage |
| `/avaliacoes` | 200 | self | index, follow | 1 | Organization, WebSite, WebPage |
| `/zapbox` | 200 | self | index, follow | 1 | Organization, WebSite, WebPage |
| `/blog/agente-ia-interno-documentos` | 200 | self | index, follow | 1 | + BreadcrumbList, BlogPosting, FAQPage |
| `/blog/atendimento-automatizado-contexto` | 200 | self | index, follow | 1 | idem |
| `/blog/atendimento-omnichannel-pme` | 200 | self | index, follow | 1 | idem |
| `/blog/automacao-whatsapp-ia` | 200 | self | index, follow | 1 | idem |
| `/blog/confirmacao-consulta-whatsapp` | 200 | self | index, follow | 1 | idem |
| `/blog/custo-de-agente-de-ia` | 200 | self | index, follow | **2** | idem |
| `/blog/e-commerce-para-pme-operacao` | 200 | self | index, follow | **2** | idem |
| `/blog/governanca-agentes-ia-pmes` | 200 | self | index, follow | **2** | idem |
| `/blog/ia-para-pequenas-empresas` | 200 | self | index, follow | 1 | idem |
| `/blog/integracao-canais-atendimento` | 200 | self | index, follow | 1 | idem |
| `/blog/leads-sem-resposta-primeiro-retorno` | 200 | self | index, follow | **2** | idem |
| `/blog/mensagens-servico-whatsapp-business-api` | 200 | self | index, follow | **2** | idem |
| `/blog/processos-manuais-o-que-automatizar` | 200 | self | index, follow | 1 | idem |
| `/blog/seguranca-de-agente-de-ia` | 200 | self | index, follow | 1 | idem |
| `/blog/solucoes-automatizadas-7-criterios-para-avaliar-fornecedores` | 200 | self | index, follow | **2** | idem |

"idem" = Organization, WebSite, WebPage, BreadcrumbList, BlogPosting, FAQPage.

## 3. Validação do Schema pós-deploy **[medido]**

Nas 23 páginas HTML do sitemap:

| Verificação | Resultado |
|---|---|
| JSON-LD inválido (não parseável) | 0 |
| `Organization` e `WebSite` | presentes em todas |
| `WebPage` | presente em todas |
| `BlogPosting`, `BreadcrumbList` | 15/15 posts |
| `FAQPage` | 15/15 posts |
| `Person` | 0 (autoria institucional em todos os posts) |
| `LocalBusiness`, `Service` | 0 |

Validação externa (Rich Results Test / Schema.org Validator) não executada daqui
— **[pendente]**, é manual.

## 4. Observações registradas para fases posteriores

- **SEO-DUAL-H1:** 6 de 15 posts têm dois `<h1>`. O template
  (`BlogPostArticle.tsx`) emite um só; o segundo vem do HTML do post no CMS.
  Tratamento na Fase 6 do SDD de SEO.
- Achados de indexação/rastreamento (soft 404, links internos para URLs
  redirecionadas etc.): `docs/seo/01-indexacao-rastreamento.md`.
