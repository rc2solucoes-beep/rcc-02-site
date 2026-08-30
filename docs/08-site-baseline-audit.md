# RC2 Site Baseline Audit

> **Tarefa #00041 — discovery e documentação apenas.** Nenhum componente, copy,
> URL, redirect ou configuração de SEO foi alterado. Nada foi corrigido.
>
> Este documento registra o **estado atual publicado** para permitir comparação
> após a reformulação e evitar regressões.

## Convenção de marcação

Cada afirmação é marcada como:

- `OBSERVED` — medido diretamente em produção ou lido no código nesta auditoria.
- `INFERRED` — conclusão derivada de evidência observada; indicada como tal.
- `TARGET` — estado desejado segundo `RC2_PROPOSTA_ATUALIZACAO.txt`,
  `AGENTS.md`, `PRODUCT.md` e as skills do projeto.

**O site atual não é avaliado como se a nova estratégia já estivesse
implementada.** A migração não começou; divergências entre `OBSERVED` e
`TARGET` são o objeto desta auditoria, não defeitos de execução.

---

## 1. Executive summary

1. `OBSERVED` — Todas as 24 URLs públicas testadas respondem **200**. Nenhum 5xx
   e nenhum link de navegação quebrado. O site está saudável.
2. `OBSERVED` — O design system está **em boa forma**: 34 tokens `--rc2-*`,
   Barlow como família única, fundo `#F7F5F1`, e **zero** hex legado em `src/`.
3. `OBSERVED` — Anel de foco correto, com variantes `--rc2-focus-ring: #C2410C`
   (área clara) e `--rc2-focus-ring-dark: #FF5F1F` (área navy), exatamente como
   a regra 3 de `AGENTS.md` exige.
4. `OBSERVED` — O menu mobile é exemplar: `aria-expanded`, `aria-controls`,
   rótulo que alterna Abrir/Fechar, fecha com `Escape` e **devolve o foco ao
   gatilho**. Deve ser preservado.
5. `OBSERVED` — Skip link presente e funcional em todas as rotas auditadas.
6. `OBSERVED` — **Canonical incorreto em 4 rotas.** `/` aponta para o apex
   (`https://rc2solucoes.com.br`) enquanto o site 301-redireciona apex→www;
   `/avaliacoes`, `/privacidade` e `/termos` apontam para a **home**.
7. `OBSERVED` — **Redirect chains de 2 saltos:** `/about/` → `/about` → `/sobre`
   e `/services/` → `/services` → `/servicos`.
8. `OBSERVED` — **Overflow horizontal apenas em 768px** (tablet): `scrollWidth`
   779 contra viewport 768. Desktop 1440 e mobile 390 estão limpos.
9. `OBSERVED` — `/contato` promete, para a conversa gratuita, *"Mapeamento
   inicial da operação… Roadmap de implantação… Proposta para execução"* —
   exatamente o que `PRODUCT.md` proíbe prometer de graça.
10. `OBSERVED` — O CTA descontinuado **"Solicitar diagnóstico"** vive em 8
    pontos do código, incluindo o Header (2×) e o default de `CTABlock`. O
    default do CMS em `CtaTab.tsx` é a frase literalmente proibida
    *"Solicitar Diagnóstico Gratuito →"*.
11. `OBSERVED` — **"Cases de Sucesso"** é usado como rótulo de seção em
    `/avaliacoes`, termo vetado enquanto não houver case documentado.
12. `OBSERVED` — **Zapbox, Agenda Confirmada, Discovery Operacional, Operação
    Gerenciada e "Falar sobre minha operação" têm 0 ocorrências em `src/`.**
    Todo o modelo comercial-alvo está ausente do site.
13. `OBSERVED` — A CSP bloqueia `analytics.google.com/g/collect`,
    `stats.g.doubleclick.net`, `ad.doubleclick.net/ccm` e
    `analytics.ahrefs.com`. O beacon principal do GA4 **passa** por
    `www.google.com/g/collect` (204), mas sinais de Ads/remarketing são
    perdidos e o console acumula erros.
14. `OBSERVED` — O Meta Pixel carrega com `Invalid PixelID: null`.
15. `OBSERVED` — O sitemap tem 30 URLs, **não inclui `/privacidade` nem
    `/termos`**, e contém um slug de blog corrompido que responde 200.

---

## 2. Environment

| Item | Valor |
|---|---|
| Production URL | `https://www.rc2solucoes.com.br` |
| Commit auditado | `d651e90b52fbce60f11ecac8979590b23aa6508e` (`main`) |
| Branch da auditoria | `chore/site-baseline-audit` |
| Data | 2026-08-30 |
| Browser | Chromium 152.0.7977.64 via Playwright MCP |
| Viewports | Desktop 1440×900 · Tablet 768×1024 · Mobile 390×844 |
| Ferramentas | Playwright MCP, `curl`, inspeção read-only do código, Python para parsing de HTML |
| Não usado | Supabase MCP, banco de dados, Lighthouse, deploy |

**Nota de método:** nenhum número de Lighthouse ou Core Web Vitals é
apresentado — Lighthouse não foi executado. A seção 14 registra apenas sinais
observáveis.

---

## 3. Route inventory

`OBSERVED` — status HTTP medido em 2026-08-30. "Nav" = presente na navegação
principal (header). "Destino futuro" e "Ação" são `TARGET`, conforme a skill
`rc2-site-migration`.

| URL | Arquivo | HTTP | Indexável | Sitemap | Nav | Função atual | Destino futuro | Ação provável |
|---|---|---|---|---|---|---|---|---|
| `/` | `(public)/page.tsx` | 200 | sim | sim | sim | Home comercial | Home reformulada | REFATORAR |
| `/servicos` | `(public)/servicos/page.tsx` | 200 | sim | sim | **sim** | Hub de 5 serviços | vira `/solucoes` | MIGRAR |
| `/servicos/automacoes-com-ia` | `[slug]` | 200 | sim | sim | não | Serviço | Zapbox (quando houver equivalente) | MIGRAR |
| `/servicos/agentes-de-ia` | `[slug]` | 200 | sim | sim | não | Serviço | IA para Operações | MIGRAR |
| `/servicos/automacao-de-processos` | `[slug]` | 200 | sim | sim | não | Serviço | Automação + Integrações | MIGRAR |
| `/servicos/e-commerce` | `[slug]` | 200 | sim | sim | não | Serviço | Operações Digitais & Commerce | REPOSICIONAR |
| `/servicos/sites-e-landing-pages` | `[slug]` | 200 | sim | sim | não | Serviço | sai da navegação | REMOVER_DA_NAVEGAÇÃO |
| `/solucoes` | `(public)/solucoes/page.tsx` | 200 | sim | sim | não | Índice por problema | página comercial única | REFATORAR |
| `/solucoes-com-ia` | `(public)/solucoes-com-ia/page.tsx` | 200 | sim | sim | **sim** | Aplicações de IA | `/solucoes#ia-para-operacoes` | MIGRAR |
| `/solucoes/atendimento-lento` | `[slug]` | 200 | sim | sim | não | Página de dor | Zapbox (quando houver equivalente) | MIGRAR |
| `/solucoes/leads-sem-resposta` | `[slug]` | 200 | sim | sim | não | Página de dor | Zapbox (quando houver equivalente) | MIGRAR |
| `/solucoes/whatsapp-desorganizado` | `[slug]` | 200 | sim | sim | não | Página de dor | Zapbox (quando houver equivalente) | MIGRAR |
| `/solucoes/processos-manuais` | `[slug]` | 200 | sim | sim | não | Página de dor | incorporar em `/solucoes` ou virar artigo | INVESTIGAR |
| `/solucoes/sistemas-desconectados` | `[slug]` | 200 | sim | sim | não | Página de dor | incorporar em `/solucoes` ou virar artigo | INVESTIGAR |
| `/solucoes/agenda-confirmada` | — | **404** | — | não | não | **não existe** | solução vertical RC2 | CRIAR |
| `/sobre` | `(public)/sobre/page.tsx` | 200 | sim | sim | sim | Institucional | preservar | MELHORAR |
| `/blog` | `(public)/blog/page.tsx` | 200 | sim | sim | sim | Índice do blog | preservar | MANTER |
| `/blog/[slug]` | `[slug]/page.tsx` | 200 | sim | sim (10) | não | Artigos | preservar | MANTER |
| `/contato` | `(public)/contato/page.tsx` | 200 | sim | sim | não | Formulário | preservar, recompor oferta | REFATORAR |
| `/avaliacoes` | `(public)/avaliacoes/page.tsx` | 200 | **canonical→home** | sim | não | Provas | "Avaliações e Projetos" | REFATORAR |
| `/privacidade` | `(public)/privacidade/page.tsx` | 200 | **noindex** | **não** | rodapé | Legal | preservar | MANTER |
| `/termos` | `(public)/termos/page.tsx` | 200 | **noindex** | **não** | rodapé | Legal | preservar | MANTER |
| `/llms.txt` | `llms.txt/route.ts` | 200 | sim | sim | não | Descoberta por LLM | preservar | MELHORAR |
| `/llms-full.txt` | `llms-full.txt/route.ts` | 200 | sim | sim | não | Descoberta por LLM | preservar | MELHORAR |

### Divergência entre as três fontes — `OBSERVED`

- **Filesystem × Sitemap:** `/privacidade` e `/termos` existem e respondem 200,
  mas **não estão no sitemap**. Coerente com o `noindex` — mas o canonical
  dessas páginas aponta para a home, o que é incoerente (ver seção 10).
- **Sitemap × Navegação:** o header expõe `/servicos` e `/solucoes-com-ia`;
  `/solucoes`, `/contato` e `/avaliacoes` **não estão no menu principal** —
  chega-se a elas por CTA ou rodapé.
- **Zapbox** não aparece em nenhuma das três fontes.

---

## 4. Visual baseline — desktop 1440×900

`OBSERVED`. Screenshots indexados na seção 20.

### Estrutura da Home

| Elemento | Estado |
|---|---|
| Header | Logo + nav (Início · Serviços · Soluções com IA · Sobre · Blog) + CTA laranja "Solicitar diagnóstico" |
| Hero | H1 *"Nenhum lead esperando. Nenhuma tarefa repetida duas vezes."*, 2 CTAs ("Ver onde minha operação trava" → `/contato`, "Falar pelo WhatsApp") + decorativo `.rc2-hero-orbit` |
| Seções | 8 `<section>`, uma com `id="servicos"` |
| Grid de serviços | 5 cards, cada um com H3 + "Ver serviço" |
| Prova | Bloco "Avaliações de clientes satisfeitos" + link "Ver mais avaliações e cases" |
| CTA final | Bloco navy, H2 *"Quer descobrir onde a IA pode gerar resultado na sua empresa?"* |
| Footer | Navy, 3 colunas (Empresa · Serviços · Contato), WhatsApp, e-mail, links legais |
| Largura | `scrollWidth` = 1440, sem overflow |
| Fundo | `rgb(247,245,241)` = `#F7F5F1` — token correto |
| Tipografia | `Barlow, "Barlow Fallback", sans-serif` — família única |
| Imagens | apenas **2** (o logo, 2×) — página quase inteiramente tipográfica |
| Links/botões | 38 no total |

### Densidade, ritmo e cor

- `INFERRED` — A home é **densa em texto e leve em imagem**, coerente com a
  direção "sistema de gestão, não landing page de startup" do `DESIGN.md`. É um
  ativo: não há estética genérica de IA, nem ícone de robô, cérebro ou chip.
- `OBSERVED` — Navy concentrado em footer e bloco de CTA final; Safety Orange
  restrito a CTAs e labels. Proporção compatível com a regra 9 (laranja abaixo
  de 10% da área visível).
- `OBSERVED` — O grid de 5 cards com "Ver serviço" repetido 5× é o padrão mais
  repetitivo da página.

### Padrões que parecem template/SaaS genérico

- `OBSERVED` — "Ver serviço" ×5 (home) e "Ver solução completa" ×5
  (`/solucoes`) são rótulos genéricos, indistinguíveis fora de contexto.
- `INFERRED` — A seção **"O que a RC2 não é"** é específica e forte; não é
  padrão de template. Deve ser preservada como ativo de posicionamento.

---

## 5. Responsive baseline

`OBSERVED`.

| Viewport | Overflow X | `scrollWidth` | Nav | Observação |
|---|---|---|---|---|
| Desktop 1440×900 | não | 1440 | horizontal completa | limpo |
| Tablet 768×1024 | **SIM** | **779** | horizontal ainda visível | **11px de overflow** |
| Mobile 390×844 | não | 390 | menu hambúrguer | limpo |

### Overflow em 768px — detalhe

Elementos que ultrapassam a viewport em 768px, `OBSERVED`:

| Elemento | `right` |
|---|---|
| `A.text-sm text-rc2-dark-text-secondary…` (rodapé) | **779** |
| `DIV.rc2-hero-orbit hidden md:block` | 840 |
| `DIV.pointer-events-none absolute -right-32…` | 896 |

`INFERRED` — O `scrollWidth` de 779 casa exatamente com o link de rodapé em
779, que é portanto o causador do scroll. Os decorativos (840, 896) também
ultrapassam, mas em 390 estão contidos — ou seja, há um clipping atuando em
mobile que não atua em 768. Causa provável: link de rodapé sem quebra somado à
ausência de `overflow-hidden` no container do decorativo nesse breakpoint —
**a confirmar no momento da correção**.

### Mobile 390

- `OBSERVED` — H1 36px, body 16px: legibilidade adequada.
- `OBSERVED` — Botão de menu 38×38px — acima do mínimo WCAG 2.5.8 (24px),
  abaixo da recomendação de 44px do iOS HIG.
- `OBSERVED` — Nav desktop corretamente oculta; hambúrguer visível.
- `OBSERVED` — 19 links/botões com altura < 24px, predominantemente links de
  texto do rodapé (17px).
- `OBSERVED` — Nenhum conteúdo cortado ou elemento sobreposto observado.

---

## 6. UX findings

Severidade: **P0** impede uso · **P1** prejudica fortemente conversão ou
compreensão · **P2** fricção relevante · **P3** refinamento.

| ID | Rota | Heurística | Problema | Evidência | Sev | Impacto | Recomendação futura |
|---|---|---|---|---|---|---|---|
| UX-01 | `/contato` | Correspondência expectativa↔conteúdo | A conversa gratuita promete mapeamento, priorização, **roadmap** e proposta | Bloco "O que você recebe" `OBSERVED` | **P1** | Entrega de graça o que deveria ser Discovery pago; desvaloriza a oferta | Recompor: conversa curta de fit; levantamento e roadmap vão para o Discovery Operacional |
| UX-02 | `/solucoes` | Próximo passo | Página comercial **sem nenhum CTA para `/contato`** no `<main>` | apenas 5× "Ver solução completa" `OBSERVED` | **P1** | Beco sem saída comercial | Adicionar CTA principal ao fim e/ou por bloco |
| UX-03 | global | Consistência | O CTA principal varia: "Solicitar diagnóstico", "Ver onde minha operação trava", "Diagnosticar minha dor", "Começar pelo diagnóstico" | 4 rótulos distintos, todos → `/contato` `OBSERVED` | **P1** | Dilui o reconhecimento da ação principal | Padronizar em "Falar sobre minha operação", com as variações contextuais aprovadas |
| UX-04 | Home | Clareza da proposta | O H1 fala de **leads e tarefas**, não de operação; esse é o território do Zapbox | H1 `OBSERVED` | **P1** | A RC2 compete com o próprio produto na primeira dobra | Hero operacional aprovado pela proposta |
| UX-05 | Home / global | Hierarquia | WhatsApp aparece 3× na home (hero, CTA final, botão flutuante) | `OBSERVED` | **P2** | Canal auxiliar compete com a rota principal | Reduzir a um ponto auxiliar |
| UX-06 | Home, `/solucoes` | Affordance de link | "Ver serviço" ×5 e "Ver solução completa" ×5 | `OBSERVED` | **P2** | Links indistinguíveis fora de contexto | Rótulos específicos por destino |
| UX-07 | Header | Navegação | O menu não expõe `/solucoes`, `/contato` nem `/avaliacoes`; expõe `/servicos` e `/solucoes-com-ia`, que a arquitetura-alvo consolida | `OBSERVED` | **P2** | Arquitetura de navegação desalinhada do alvo | Reestruturar após a consolidação |
| UX-08 | `/avaliacoes` | Confiança / prova | Rotulado "Cases de Sucesso" sem case documentado | `OBSERVED` | **P2** | Claim não sustentado; risco de credibilidade | Renomear para "Avaliações e Projetos" |
| UX-09 | `/contato` | Prevenção de erro | Campos marcados `*` visualmente, mas **sem `required` nem `aria-required`** | `OBSERVED` | **P2** | Validação depende só de JS; leitor de tela não anuncia obrigatoriedade | Adicionar `required` / `aria-required` |
| UX-10 | `/blog`, `/avaliacoes` | Hierarquia | H1 → H3 sem H2 intermediário | `OBSERVED` | **P3** | Estrutura semântica achatada | Reintroduzir H2 de seção |

**Contagem:** P0 = 0 · P1 = 4 · P2 = 5 · P3 = 1.

---

## 7. Positioning / content audit

Classificação: **A** ALINHADA · **B** LEGADO_A_REMOVER · **C**
LEGADO_A_REPOSICIONAR · **D** MIGRAR_PARA_ZAPBOX · **E** PRESERVAR_POR_SEO ·
**F** NECESSITA_DECISAO.

| Termo | Onde | Evidência | Classe |
|---|---|---|---|
| **"Solicitar diagnóstico"** | `Header.tsx` (2×), `CTABlock.tsx` default, `ContactForm.tsx` (submit), `blog/page.tsx`, `llms.txt` | `OBSERVED` — 8 pontos | **B** |
| **"Solicitar Diagnóstico Gratuito →"** | `admin/PostFormTabs/CtaTab.tsx:53` — **default do CMS** | `OBSERVED` | **B** |
| "Diagnóstico" como etapa do método | `/sobre` (H3 "Diagnóstico") | `OBSERVED` | **C** — válido como palavra, não como CTA |
| "Solicite um diagnóstico" | `/contato` — title e H1 | `OBSERVED` | **B** |
| **"Cases de Sucesso"** | `/avaliacoes` — SectionLabel, keywords, description | `OBSERVED` | **B** |
| "avaliações e cases" | Home, link para `/avaliacoes` | `OBSERVED` | **B** |
| **WhatsApp** | Home (3×), footer, botão flutuante, `/solucoes/whatsapp-desorganizado` | `OBSERVED` | **D** (páginas) / **C** (canal auxiliar) |
| **leads** | H1 da home, `/solucoes/leads-sem-resposta` | `OBSERVED` | **D** |
| **atendimento** | `/solucoes/atendimento-lento`, `/servicos/automacoes-com-ia` | `OBSERVED` | **D** |
| **site / landing page** | `/servicos/sites-e-landing-pages`, footer ("Sites Inteligentes") | `OBSERVED` | **C** — despriorizar, preservar URL |
| **e-commerce** | `/servicos/e-commerce`, footer | `OBSERVED` | **C** → Operações Digitais & Commerce |
| **IA** | transversal | `OBSERVED` | **A** |
| **automação** | transversal | `OBSERVED` | **A** |
| **integração** | `/servicos/automacao-de-processos`, footer | `OBSERVED` | **A** |
| **operação** | H1 de `/sobre` — "Tecnologia que funciona. Operação que entrega." | `OBSERVED` | **A** — frase institucional aprovada |
| **Zapbox** | — | `OBSERVED` — **0 ocorrências** | **F** — criar |
| **Agenda Confirmada** | — | `OBSERVED` — **0 ocorrências**; `/solucoes/agenda-confirmada` = 404 | **F** — criar |
| **Discovery Operacional** | — | `OBSERVED` — **0 ocorrências** | **F** — criar |
| **Operação Gerenciada** | — | `OBSERVED` — **0 ocorrências** | **F** — criar (prioridade alta na proposta) |
| **"Falar sobre minha operação"** | — | `OBSERVED` — **0 ocorrências** | **F** — adotar |
| "24h" | não localizado nas rotas auditadas | `OBSERVED` | — |

### Conflito central

`INFERRED` — O site está construído sobre o **modelo antigo**: cinco serviços,
entrada por dor de atendimento/leads/WhatsApp, e diagnóstico gratuito como
oferta. O modelo-alvo — quatro pilares, três ofertas comerciais (conversa ·
Discovery pago · Operação Gerenciada) e dois produtos próprios — **não tem
nenhuma representação no site**. Isto não é defeito de execução: é a distância
que a reformulação precisa percorrer.

`OBSERVED` — O atrito mais delicado: a home abre falando de **leads e
atendimento**, que na estratégia-alvo é território **Zapbox**. Hoje a RC2
compete com o próprio produto logo na primeira dobra.

---

## 8. Brand / design-system audit

### O que está correto — `OBSERVED`

| Item | Estado |
|---|---|
| Tokens `--rc2-*` | 34 definidos em `globals.css` |
| Hex legado (`#F5F0E8`, `#121212`, `#1E1610`, `#163020`, `#0D0D0F`) em `src/` | **zero ocorrências** |
| Hex literal em componente | nenhum — hex só nas definições de token |
| Fundo de página | `#F7F5F1` (regra 4) |
| Tipografia | Barlow, família única |
| Anel de foco | `--rc2-focus-ring: #C2410C` / `--rc2-focus-ring-dark: #FF5F1F`, 2px, offset 2px (regra 3) |
| Troca do anel em superfície escura | implementada por seletor `:is(.bg-rc2-dark, …) :focus-visible` |
| Clichês de IA (robô / cérebro / chip) | **nenhum** (regra 11) |
| Tipografia serifada | ausente |
| Proporção de Safety Orange | restrita a CTA e labels (regra 9) |
| `npm run audit:brand` | script existe (`scripts/audit-brand.sh`) |

`INFERRED` — O design system é o **ativo mais maduro do projeto**. A
reformulação deve tratá-lo como base, não como objeto de refatoração.

### Intencional e coerente — preservar

- Blocos navy com borda para separação (footer, CTA final) — respeita a regra 8.
- Cards com borda, raio e sombra leve, dentro dos tokens.
- Eyebrows / `SectionLabel` em uppercase com régua.
- Reveals via `ScrollReveal` / `FadeIn` usando apenas `opacity` e `transform`.
- Densidade tipográfica alta com baixo uso de imagem — reforça a direção.

### Genérico / redundante / desalinhado

| Item | Observação | Sev |
|---|---|---|
| Grid de 5 cards com "Ver serviço" repetido | padrão mais template da home | P2 |
| "Ver solução completa" ×5 em `/solucoes` | idem | P2 |
| Decorativos `.rc2-hero-orbit` e `.pointer-events-none absolute -right-32` | contribuem para o overflow em 768px | P2 |

`OBSERVED` — Não foram encontrados gradientes coloridos, sombras coloridas,
glassmorphism, pills decorativas em excesso nem dashboards fictícios nas rotas
auditadas.

---

## 9. Accessibility findings

Auditado via Playwright (snapshot de acessibilidade, DOM e navegação por
teclado). **Esta auditoria não estabelece conformidade WCAG completa** — cobre
os pontos listados na tarefa e não substitui avaliação formal.

### Pontos fortes — `OBSERVED`, preservar

| Item | Evidência |
|---|---|
| Skip link | `a[href="#main-content"]`, presente e funcional |
| Landmarks | `header` · `nav` · `main#main-content` · `footer` |
| Menu mobile | `aria-expanded` alterna, `aria-controls="mobile-main-menu"`, rótulo Abrir/Fechar |
| `Escape` no menu | fecha **e devolve o foco ao gatilho** |
| Honeypot do formulário | `tabindex="-1"`, `aria-hidden="true"`, `class="hidden"` — correto |
| Alt text | 0 imagens sem `alt` nas rotas auditadas |
| Labels do formulário | os 4 campos visíveis têm `<label for>` associado |
| Anel de foco | visível, 2px, com variante para fundo escuro |

### Findings

| ID | WCAG / heurística | Rota | Elemento | Problema | Sev |
|---|---|---|---|---|---|
| A11Y-01 | 3.3.2 Labels or Instructions | `/contato` | `name`, `email`, `whatsapp`, `message` | Marcados `*` no label mas **sem `required` nem `aria-required`** — a obrigatoriedade não é programaticamente determinável | **P2** |
| A11Y-02 | 1.3.1 Info and Relationships | `/blog`, `/avaliacoes` | headings | H1 → H3 sem H2 | **P3** |
| A11Y-03 | 1.3.1 | `/sobre` | headings | H1 → H3 (etapas do método) sem H2 | **P3** |
| A11Y-04 | 2.4.4 Link Purpose | Home, `/solucoes` | links | "Ver serviço" ×5 e "Ver solução completa" ×5 — propósito não determinável isoladamente | **P2** |
| A11Y-05 | 2.5.8 Target Size (Minimum) | global | links de rodapé | 19 alvos com 17px de altura (< 24px) em mobile | **P3** |
| A11Y-06 | 2.5.5 Target Size (AAA) / iOS HIG | mobile | botão de menu | 38×38px, abaixo dos 44px recomendados | **P3** |

**Contagem:** P0 = 0 · P1 = 0 · P2 = 2 · P3 = 4.

`OBSERVED` — Navegação por teclado testada em Home e `/contato` com `Tab`,
`Shift+Tab`, `Enter` e `Escape`: tudo funciona, nenhuma armadilha de foco
encontrada. **Nenhum formulário foi submetido.**

---

## 10. SEO baseline

`OBSERVED` — extraído do HTML de produção em 2026-08-30. O site é servido em
UTF-8 correto (`charset=utf-8`, bytes validados).

| Rota | Title (len) | Canonical | Robots | H1 | H2/H3 |
|---|---|---|---|---|---|
| `/` | 75 | **`https://rc2solucoes.com.br`** ⚠ apex | index, follow | 1 | 7/9 |
| `/solucoes` | 36 | self | index, follow | 1 | 5/3 |
| `/solucoes-com-ia` | 30 | self | index, follow | 1 | 5/3 |
| `/servicos` | 23 | self | index, follow | 1 | 7/13 |
| `/sobre` | 26 | self | index, follow | 1 | 1/8 |
| `/blog` | 19 | self | index, follow | 1 | **0**/13 |
| `/contato` | 48 | self | index, follow | 1 | 2/3 |
| `/avaliacoes` | 33 | **home** ⚠ | index, follow | 1 | **0**/4 |
| `/privacidade` | 38 | **home** ⚠ | noindex, nofollow | 1 | 10/3 |
| `/termos` | 28 | **home** ⚠ | noindex, nofollow | 1 | 9/3 |
| `/servicos/*` (5) | 57–70 | self | index, follow | 1 | — |
| `/solucoes/*` (5) | 62–74 | self | index, follow | 1 | — |
| `/blog/[slug]` | 60 | self | index, follow | 1 | — |

Open Graph e Twitter estão presentes em todas as rotas (`og:title`,
`og:description`, `og:image`, `og:url`, `twitter:card = summary_large_image`).
Nenhum `hreflang` — site monolíngue, `OBSERVED`, sem problema.

### Problemas principais

| ID | Problema | Evidência | Sev |
|---|---|---|---|
| SEO-01 | **Canonical da home aponta para o apex** enquanto o apex 301-redireciona para www — o canonical contradiz o redirect | `<link rel="canonical" href="https://rc2solucoes.com.br">`; `og:url` idem | **P1** |
| SEO-02 | **`/avaliacoes` canonicaliza para a home** — sinaliza ao buscador que a página não deve ser indexada por si mesma | `OBSERVED` | **P1** |
| SEO-03 | `/privacidade` e `/termos` canonicalizam para a home | `OBSERVED` | P2 |
| SEO-04 | Title da home com 75 chars e marca duplicada ("RC2 Soluções — … — RC2 Soluções") | `OBSERVED` | P2 |
| SEO-05 | `/contato` — title e H1 usam o CTA descontinuado ("Solicite um Diagnóstico") | `OBSERVED` | P2 |
| SEO-06 | `/avaliacoes` — title, description e keywords usam "cases de sucesso" | `OBSERVED` | P2 |
| SEO-07 | `/blog` e `/avaliacoes` sem H2 (H1 → H3) | `OBSERVED` | P3 |
| SEO-08 | `og:image` genérica herdada pela maioria das rotas | `OBSERVED` | P3 |

### Host canonical — `www` vs apex

`OBSERVED`:

- `https://rc2solucoes.com.br/` → **301** → `https://www.rc2solucoes.com.br/`
- `BASE_URL` no código = `https://www.rc2solucoes.com.br`
- Sitemap e robots usam **www**
- **Mas** o canonical e o `og:url` da home usam o **apex**

`INFERRED` — A infraestrutura está consistente em www; a inconsistência é
pontual — o canonical/og:url da home e as 3 rotas que canonicalizam para a
home. É correção localizada, não estrutural.

### Trailing slash

`OBSERVED` — O Next normaliza `/rota/` → `/rota` com 308. Comportamento
consistente, e é a origem das chains da seção 11.

---

## 11. Sitemap / robots / redirects

### `/sitemap.xml` — `OBSERVED`

- 30 URLs, geradas por `src/app/sitemap.ts`, com `revalidate = 60`.
- Composição: estáticas + 5 serviços + 5 soluções + 10 posts + `llms.txt` +
  `llms-full.txt`.
- **Ausentes:** `/privacidade` e `/termos` — coerente com o `noindex`.
- **Slug corrompido**, que responde **200** e está indexável:
  `/blog/solucosolucoes-automatizadas-avaliar-fornecedoreses-automatizadas-7-criterios-para-avaliar-fornecedores`
  — fragmentos duplicados; `INFERRED` erro de edição no CMS.
- A home é listada sem barra final: `https://www.rc2solucoes.com.br`.

### `/robots.txt` — `OBSERVED`

Regras para `*`, `OAI-SearchBot`, `GPTBot` e `Google-Extended`; todas com
`Allow: /` e `Disallow: /admin`, `/admin/`, `/api/`. Sitemap declarado em www.
**Sem problemas.**

### Redirects — `next.config.ts` `OBSERVED`

| Source | Destination | Permanent | HTTP medido | Chain? |
|---|---|---|---|---|
| apex `/:path*` | www | sim | **301** | não |
| `/index.htm` | `/` | sim | 308 | não |
| `/about` | `/sobre` | sim | 308 | não |
| `/about/` | `/sobre` | sim | 308 → `/about` → `/sobre` | **SIM — 2 saltos** |
| `/services` | `/servicos` | sim | 308 | não |
| `/services/` | `/servicos` | sim | 308 → `/services` → `/servicos` | **SIM — 2 saltos** |
| `/servicos/automacao-de-atendimento` | `/servicos/automacoes-com-ia` | sim | 308 | não |
| `/servicos/integracao-de-sistemas` | `/servicos/automacao-de-processos` | sim | 308 | não |
| `/servicos/operacoes-digitais` | `/servicos/automacao-de-processos` | sim | 308 | não |

| ID | Problema | Sev |
|---|---|---|
| RED-01 | Chains de 2 saltos em `/about/` e `/services/` — a normalização de trailing slash roda **antes** do redirect configurado | **P2** |
| RED-02 | 3 redirects apontam para `/servicos/*`, que a migração vai consolidar — viram chains no futuro se não forem reapontados junto | **P2** (risco futuro) |

`INFERRED` — RED-02 é o risco mais importante desta seção: consolidar
`/servicos/*` sem reapontar estes 3 redirects cria chains de 2 saltos em URLs
que já vieram do Search Console. Nenhum loop foi encontrado.

---

## 12. Structured data

`OBSERVED` — JSON-LD por rota.

| Rota | Tipos |
|---|---|
| `/` | Organization, LocalBusiness, WebSite, WebPage |
| `/solucoes` | os acima + CollectionPage |
| `/solucoes-com-ia`, `/servicos`, `/sobre`, `/blog`, `/contato`, `/avaliacoes`, `/privacidade`, `/termos` | Organization, LocalBusiness, WebSite, WebPage |
| `/servicos/*` (5) | + **Service**, **FAQPage** (Question/Answer), **BreadcrumbList**, BusinessAudience, ContactPoint, PostalAddress, City, Country |
| `/solucoes/*` (5) | + FAQPage, BreadcrumbList, ContactPoint, PostalAddress, City |
| `/blog/[slug]` | **BlogPosting**, Person, ImageObject, FAQPage, Organization, LocalBusiness, WebSite |

| ID | Observação | Sev |
|---|---|---|
| SD-01 | `/blog/[slug]` **não tem BreadcrumbList**, enquanto `/servicos/*` e `/solucoes/*` têm — cobertura inconsistente | P3 |
| SD-02 | Organization + LocalBusiness são emitidos em **todas** as páginas, inclusive `/privacidade` e `/termos` | P3 |
| SD-03 | `INFERRED` — o `Service` de `/servicos/*` descreve serviços que a estratégia-alvo consolida ou migra; o schema precisará acompanhar a migração | P2 (futuro) |

`OBSERVED` — Não foram encontrados campos vazios evidentes nem claims numéricos
inventados no JSON-LD das rotas auditadas. **Nenhum dado foi criado nesta
tarefa.**

---

## 13. Console / network

`OBSERVED` — Chromium sem extensões; nenhum ruído externo de browser.

### Erros de console recorrentes, em todas as rotas

| Origem | Mensagem | Classe |
|---|---|---|
| CSP | `analytics.ahrefs.com/analytics.js` bloqueado (`script-src`) | Script de terceiro bloqueado |
| CSP | `ad.doubleclick.net/ccm/s/collect` bloqueado (`connect-src`) | Ads / remarketing |
| CSP | `analytics.google.com/g/collect` bloqueado (`connect-src`) | Endpoint alternativo do GA4 |
| CSP | `stats.g.doubleclick.net/g/collect` bloqueado (`connect-src`) | Ads |
| Meta Pixel | `Invalid PixelID: null` | Configuração |

### Requests

`OBSERVED`:

- `www.google.com/g/collect` → **204** — o beacon principal do GA4 **passa**.
- `www.google.com/ccm/collect` → **200**.
- `analytics.ahrefs.com/analytics.js` → **FAILED (csp)**.
- **Nenhum 4xx ou 5xx** de recurso próprio do site.
- Nenhuma fonte ou imagem quebrada; nenhum erro de hidratação observado.

### Leitura correta do impacto

`INFERRED` — **A analítica não está quebrada, está degradada.** O `page_view`
do GA4 chega por `www.google.com/g/collect`, que a CSP permite. O que se perde
são os sinais de Ads/remarketing (`doubleclick`), o Ahrefs Analytics e o Meta
Pixel (PixelID nulo). O custo adicional é ruído permanente de console, que
mascara erros reais.

| ID | Problema | Sev |
|---|---|---|
| CN-01 | Meta Pixel com `PixelID: null` — carrega e não registra nada | **P2** |
| CN-02 | A CSP bloqueia `analytics.google.com` e `stats.g.doubleclick.net`; o comentário em `next.config.ts` afirma que o GA4 usa `google.com/g/collect` — verdade parcial, o GA4 tenta ambos | **P2** |
| CN-03 | Ahrefs Analytics é carregado mas bloqueado pela CSP — script inútil na página | **P3** |
| CN-04 | 4 a 6 erros de console por rota criam ruído que esconde erros reais | **P3** |

---

## 14. Performance observations

**Lighthouse não foi executado.** Nenhum número de Core Web Vitals é
apresentado, porque nenhum foi medido. Apenas sinais observáveis:

| Sinal | `OBSERVED` |
|---|---|
| Imagens na home | apenas **2** (o logo, 2×) — carga de imagem muito baixa |
| Dimensionamento | as imagens têm `width` / `height` definidos |
| Formatos | `next.config.ts` habilita AVIF e WebP |
| Fontes | Barlow com fallback `Barlow Fallback` declarado |
| Scripts de terceiros | GTM (`GTM-MQF4K77`), GA4 (`G-GS5SNWNKMT`), Meta Pixel, Ahrefs, Turnstile |
| Carregamento do GTM | via `DelayedGtm.tsx` — `INFERRED` carregamento adiado, positivo |
| Requests bloqueados | 4 por rota (CSP) — conexões desperdiçadas |
| Animação | reveals por CSS + IntersectionObserver, só `opacity` e `transform` |
| Componentes client | `ScrollReveal`, `FadeIn`, `ContactForm`, `DelayedGtm`, `PageViewTracker`, `TrackedLink`, `BackToTopButton`, `FloatingWhatsApp` |
| Layout shift | nenhum deslocamento evidente observado nas capturas |
| Requests duplicados | 2 chamadas RSC à home (`?_rsc=…`) — `INFERRED` prefetch do Next, comportamento normal |

`INFERRED` — O perfil de performance é favorável por construção: pouca imagem,
muito texto, animação barata. O maior peso é a stack de analytics de terceiros,
parte dela desperdiçada por bloqueio de CSP.

---

## 15. Component map

`OBSERVED` — 48 componentes em `src/components/`. Abaixo, os que servem as
rotas públicas auditadas. A coluna "Ação" é `TARGET`.

| Componente | Arquivo | Rotas | Papel | Ação | Motivo |
|---|---|---|---|---|---|
| `Header` | `layout/Header.tsx` | todas | Nav + CTA | **REFATORAR** | Contém "Solicitar diagnóstico" (2×) e nav desalinhada do alvo |
| `Footer` | `layout/Footer.tsx` | todas | Navegação secundária | **REFATORAR** | Lista serviços despriorizados; um link causa o overflow em 768px |
| `Logo` | `layout/Logo.tsx` | todas | Marca | **MANTER** | Correto, com variante clara para navy |
| `button` | `ui/button.tsx` | todas | Base de ação | **MANTER** | Tokens e foco corretos |
| `PageHero` | `marketing/PageHero.tsx` | páginas internas | Hero compartilhado | **MANTER** | Consistente com `DESIGN.md` |
| `SectionLabel` | `ui/SectionLabel.tsx` | várias | Eyebrow | **MANTER** | Padrão de marca correto |
| `ScrollReveal` / `FadeIn` | `ui/` | várias | Movimento | **MANTER** | `opacity`/`transform`, respeita a diretriz |
| `Breadcrumb` | `ui/Breadcrumb.tsx` | `/servicos/*`, `/solucoes/*` | Orientação | **MANTER** | Alimenta o BreadcrumbList |
| `CTABlock` | `marketing/CTABlock.tsx` | várias | CTA de seção | **REFATORAR** | `primaryLabel` default = "Solicitar diagnóstico" |
| `CTABlockBase` | `marketing/CTABlockBase.tsx` | base | Composição | **MANTER** | A base é sã; o problema é o default acima |
| `HomeCtaBlock` · `ContactCtaBlock` · `ServicesCtaBlock` | `marketing/` | Home, `/contato`, `/servicos` | CTAs por página | **REFATORAR** | Copy de diagnóstico |
| `ContactForm` | `marketing/ContactForm.tsx` | `/contato` | Formulário multi-etapa | **REFATORAR** | Falta `required`/`aria-required`; submit "Solicitar diagnóstico"; **honeypot deve ser preservado** |
| `ServiceCard` | `marketing/ServiceCard.tsx` | Home, `/servicos` | Card de serviço | **REFATORAR** | "Ver serviço" genérico; o modelo de 5 serviços muda |
| `StepList` | `marketing/StepList.tsx` | `/sobre` | Método | **MELHORAR** | H3 sem H2; o conteúdo do método é ativo |
| `HeroActions` | `marketing/HeroActions.tsx` | Home | CTAs do hero | **REFATORAR** | Rótulos legados |
| `FloatingWhatsApp` | `marketing/FloatingWhatsApp.tsx` | todas | Canal auxiliar | **INVESTIGAR** | WhatsApp é território Zapbox; decidir permanência |
| `HomeReviews` / `GoogleReviews` | `marketing/`, raiz | Home, `/avaliacoes` | Prova social | **MANTER** | Avaliações reais — ativo de autoridade |
| `PageAnchorNav` | `marketing/PageAnchorNav.tsx` | páginas longas | Navegação interna | **MANTER** | Útil para a `/solucoes` consolidada |
| `BlogCard` · `BlogPostArticle` · `TableOfContents` · `BackToTopButton` · `PreviewBanner` | `blog/` | `/blog`, `/blog/*` | Blog | **MANTER** | Fora do escopo da reformulação comercial |
| `DelayedGtm` · `PageViewTracker` · `TrackedLink` | `tracking/` | todas | Analytics | **INVESTIGAR** | Ver CN-01 / CN-02 |
| `CtaTab` | `admin/PostFormTabs/CtaTab.tsx` | CMS | Default de CTA de post | **REFATORAR** | Default = "Solicitar Diagnóstico Gratuito →" (frase proibida) |

---

## 16. Strategic gap matrix

| Área | Estado atual `OBSERVED` | Estado desejado `TARGET` | Gap | Ação | Prio | Dependência | Risco |
|---|---|---|---|---|---|---|---|
| Posicionamento | 5 serviços; entrada por leads/atendimento | 4 pilares + 3 ofertas + 2 produtos | Total | REFATORAR | **P1** | Proposta aprovada | Alto — toca tudo |
| Home | H1 de leads/tarefas; 8 seções | Hero operacional; 10 seções definidas | Alto | REFATORAR | **P1** | Posicionamento | Alto |
| Header | Serviços · Soluções com IA; CTA "Solicitar diagnóstico" | Nav consolidada; CTA "Falar com a RC2" | Alto | REFATORAR | **P1** | Arquitetura | Médio |
| Footer | Lista 5 serviços, incluindo despriorizados | Navegação alinhada | Médio | REFATORAR | P2 | Arquitetura | Baixo |
| `/solucoes` | Índice por problema, sem CTA | Página comercial única | Alto | REFATORAR | **P1** | Consolidação de `/servicos` | Alto — SEO |
| Zapbox | ausente (0 ocorrências) | Link externo + território definido | Total | CRIAR | **P1** | — | Médio |
| Agenda Confirmada | `/solucoes/agenda-confirmada` = **404** | Solução vertical | Total | CRIAR | P2 | Conteúdo | Baixo |
| Discovery Operacional | ausente | Oferta paga explícita | Total | CRIAR | **P1** | Definição comercial | Médio |
| Operação Gerenciada | ausente | Oferta recorrente (MRR) | Total | CRIAR | **P1** | Definição comercial | Médio |
| E-commerce | `/servicos/e-commerce` como serviço | Operações Digitais & Commerce | Médio | REPOSICIONAR | P2 | `/solucoes` | Médio — SEO |
| Sites / landing pages | página própria + footer | fora da navegação, URL preservada | Médio | REMOVER_DA_NAVEGAÇÃO | P2 | — | Médio — SEO |
| Avaliações / cases | "Cases de Sucesso" sem case | "Avaliações e Projetos" | Médio | REFATORAR | P2 | — | Baixo |
| Contato | promete roadmap grátis | conversa de fit; Discovery é pago | Alto | REFATORAR | **P1** | Ofertas | Alto — comercial |
| SEO — canonical | 4 rotas com canonical errado | self-canonical em www | Pontual | MELHORAR | **P1** | — | Baixo |
| URLs | 24 URLs vivas | árvore consolidada | Alto | PRESERVAR_POR_SEO | **P1** | Plano de migração | **Alto** |
| Redirects | 9 regras; 2 chains | um salto; destino equivalente | Médio | MELHORAR | P2 | Consolidação | Médio |
| Design system | 34 tokens, zero hex legado | manter | **Nenhum** | MANTER | — | — | Baixo |
| Mobile | 390 limpo; 768 com overflow | sem overflow em nenhum breakpoint | Pontual | MELHORAR | P2 | — | Baixo |
| Acessibilidade | boas bases; 6 findings | required, headings, rótulos de link | Baixo | MELHORAR | P2 | — | Baixo |
| Performance | perfil favorável; terceiros bloqueados | CSP coerente com as ferramentas | Baixo | INVESTIGAR | P3 | — | Baixo |
| Analytics | GA4 parcial; Pixel nulo | rastreio íntegro | Médio | INVESTIGAR | P2 | Decisão sobre ferramentas | Médio |

**Contagem por prioridade:** P1 = 9 · P2 = 9 · P3 = 1 · sem gap = 1 · sem
prioridade atribuída (MANTER) = 1.

---

## 17. Regression checklist

Comparar após **cada** fase da reformulação. Nenhum teste automatizado foi
criado nesta tarefa.

### Estrutural

- [ ] Header desktop e mobile — links, CTA, comportamento do hambúrguer
- [ ] Footer — colunas, links legais, WhatsApp
- [ ] `Escape` fecha o menu mobile **e devolve o foco ao gatilho**
- [ ] Skip link presente e funcional

### Rotas — todas devem continuar 200

- [ ] `/` · `/solucoes` · `/sobre` · `/blog` · `/contato` · `/avaliacoes`
- [ ] `/servicos` e as 5 `/servicos/*`
- [ ] As 5 `/solucoes/*`
- [ ] `/privacidade` · `/termos` · `/llms.txt` · `/llms-full.txt`
- [ ] Os 10 posts listados no sitemap

### SEO

- [ ] `sitemap.xml` — contagem de URLs e ausência de 404 entre as listadas
- [ ] `robots.txt` — regras e host do sitemap
- [ ] Canonical self-referente em www em **todas** as rotas indexáveis
- [ ] Redirects — nenhuma chain nova; apex→www continua 301
- [ ] Títulos e H1 sem "Solicitar diagnóstico" e sem "Cases de Sucesso"
- [ ] JSON-LD por rota — tipos preservados

### Visual e responsivo

- [ ] Screenshots desktop/tablet/mobile comparados com a baseline da seção 20
- [ ] `scrollWidth == innerWidth` em 1440, **768** e 390
- [ ] Fundo `#F7F5F1`, Barlow, anel de foco correto por superfície

### Qualidade

- [ ] Console — sem **novos** erros além dos 4 conhecidos de CSP
- [ ] Network — nenhum 4xx/5xx de recurso próprio
- [ ] Formulário de contato — labels, validação, honeypot, Turnstile
- [ ] Navegação por teclado em Home e `/contato`
- [ ] `npm run build` e `npm run audit:brand` passando

---

## 18. Recommended implementation sequence

`TARGET` — proposta de fatiamento. **Uma etapa por vez, validável
isoladamente**, conforme a regra de execução de `rc2-site-migration`. Nada
aqui foi executado.

**Fase 0 — correções independentes da reformulação.** Baixo risco, ganho
imediato, não dependem de nenhuma decisão comercial:

1. Canonical: home → www; `/avaliacoes`, `/privacidade` e `/termos` →
   self-canonical (SEO-01, SEO-02, SEO-03).
2. Overflow horizontal em 768px.
3. `required` / `aria-required` no formulário (A11Y-01).
4. Meta Pixel: corrigir ou remover; decidir sobre Ahrefs e CSP (CN-01 a CN-03).
5. Investigar o slug de blog corrompido e definir seu destino.

**Fase 1 — decisões comerciais.** Bloqueiam todo o resto: definir Discovery
Operacional, Operação Gerenciada e a fronteira exata entre RC2 e Zapbox.

**Fase 2 — vocabulário.** Substituir os CTAs descontinuados pelos aprovados nos
8 pontos, incluindo o default do CMS.

**Fase 3 — `/contato`.** Recompor a oferta da conversa gratuita.

**Fase 4 — Home.** Hero operacional e as 10 seções, uma por vez.

**Fase 5 — consolidação de `/solucoes`.** Com plano de redirect documentado,
reapontando também os 3 redirects legados que hoje vão para `/servicos/*`
(RED-02).

**Fase 6 — Agenda Confirmada** e território Zapbox.

`INFERRED` — A Fase 0 é separável de tudo o mais e pode começar sem nenhuma
decisão estratégica pendente.

---

## 19. Open questions / decisions

1. **Slug de blog corrompido** — a URL responde 200 e está no sitemap. Corrigir
   o slug (com redirect) ou preservar por histórico orgânico? Requer olhar o
   Search Console.
2. **`FloatingWhatsApp`** — WhatsApp é território Zapbox. O botão flutuante
   permanece no site da RC2, sai, ou passa a apontar para o Zapbox?
3. **`/solucoes/*` de território Zapbox** (`atendimento-lento`,
   `leads-sem-resposta`, `whatsapp-desorganizado`) — a regra exige página
   equivalente no produto antes do 301. Essas páginas já existem no Zapbox?
4. **`/servicos` × `/solucoes`** — ambas existem e são indexadas. Qual absorve
   qual, e qual URL sobrevive como canônica da página comercial?
5. **Ahrefs Analytics** — manter e liberar na CSP, ou remover o script?
6. **Meta Pixel** — há campanha ativa que justifique corrigir o PixelID?
7. **`/avaliacoes`** — renomear para "Avaliações e Projetos" muda H1 e title; a
   URL permanece? (recomendado: sim, preservar).
8. **Operação Gerenciada** — página própria, seção em `/solucoes`, ou ambas?
9. **Botão de menu 38px** — subir para 44px altera o header visualmente; entra
   na reformulação ou fica como está?

---

## 20. Screenshot index

> **LOCAL ARTIFACT — NOT VERSIONED**
>
> Todos os arquivos abaixo vivem em `.playwright-mcp/`, que está no
> `.gitignore` (linha 64). **Não foram copiados para `docs/` e não entram no
> commit.** São artefatos locais desta sessão, para comparação manual.

Capturados em 2026-08-30 contra produção, com `fullPage: true` e `scale: css`.

### Desktop — 1440×900 (6)

```
.playwright-mcp/baseline/desktop/home.png
.playwright-mcp/baseline/desktop/solucoes.png
.playwright-mcp/baseline/desktop/sobre.png
.playwright-mcp/baseline/desktop/blog.png
.playwright-mcp/baseline/desktop/contato.png
.playwright-mcp/baseline/desktop/avaliacoes.png
```

### Tablet — 768×1024 (4)

```
.playwright-mcp/baseline/tablet/home.png
.playwright-mcp/baseline/tablet/solucoes.png
.playwright-mcp/baseline/tablet/sobre.png
.playwright-mcp/baseline/tablet/contato.png
```

### Mobile — 390×844 (4)

```
.playwright-mcp/baseline/mobile/home.png
.playwright-mcp/baseline/mobile/solucoes.png
.playwright-mcp/baseline/mobile/sobre.png
.playwright-mcp/baseline/mobile/contato.png
```

**Total: 14 capturas.**
