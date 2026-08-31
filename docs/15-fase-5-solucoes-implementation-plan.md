# Fase 5 — Consolidação de /solucoes — Implementation Plan

> **For agentic workers:** execute task-by-task with review gates. Follow
> `docs/14-fase-5-solucoes-design.md` as the authoritative spec.

**Goal:** transformar `/solucoes` na página comercial central da RC2 e alinhar
a navegação interna ao posicionamento vigente sem executar prematuramente
migrações de URL dependentes de SEO/Zapbox.

**Architecture:** server-first; conteúdo estrutural testável quando útil;
anchors estáveis; Header/Footer alinhados; analytics existente preservado;
redirects desacoplados da consolidação principal salvo autorização explícita.

**Tech Stack:** Next.js 16.3.3, React 19.2.4, TypeScript, Tailwind/CSS existente,
Lucide, Vitest e Playwright MCP.

**Spec:** `docs/14-fase-5-solucoes-design.md`

**Baseline documental:** `main @ c74b6f1`; branch `design/phase-5-solutions`;
commits `274e0ac` e `71ab5b2` intactos.

---

## 0. Decisões de arquitetura deste plano

Cada decisão abaixo é fechada. Divergências da spec estão marcadas e
justificadas; nenhuma reabre `docs/14`.

### 0.1 Escopo de redirect — **ABORDAGEM A**

O PR da Fase 5 **não contém nenhum redirect**. `next.config.ts` e
`src/app/sitemap.ts` não são tocados.

Motivo, além da preferência registrada no prompt: a consolidação é reversível
por `git revert`; um redirect permanente já emitido **não é** — ele entra em
cache de navegador e de crawler. Misturar as duas classes de mudança num PR
único obriga um rollback de conteúdo a arrastar consigo um rollback de URL que
o Google já pode ter processado. As tasks de redirect ficam na §8, **gated**.

Consequência aceita e registrada: entre o merge da Fase 5 e a execução das
migrações, `/servicos` e `/solucoes-com-ia` ficam 200 e indexáveis mas fora do
Header e do Footer. É perda temporária de autoridade interna, prevista em
`docs/14` §20.

### 0.2 Módulo de conteúdo — `src/lib/content/solucoesPage.ts`

`CREATE`. Nome escolhido para **não** colidir semanticamente com o legado
`src/lib/content/solutions.ts`, que continua existindo e descreve outra coisa
(as cinco páginas por dor). O sufixo `Page` marca que o módulo é a copy
estrutural de uma rota, como `home.ts` é a da `/`.

### 0.3 Disposição dos módulos legados

| Módulo | Decisão | Motivo |
|---|---|---|
| `src/lib/content/solutions.ts` | **PRESERVAR** | Consumido por `/solucoes/[slug]`, `/servicos/[slug]` (related), `llms-full.txt` e `sitemap.ts`. Só `/solucoes/page.tsx` deixa de importá-lo. |
| `src/lib/content/services.ts` | **PRESERVAR** | Consumido por `/servicos`, `/servicos/[slug]`, `llms-full.txt`, `sitemap.ts` e `tests/unit/services.test.ts`. Só o `Footer` deixa de importá-lo. |

Nenhum dos dois é removido. `REMOVER_FUTURAMENTE` só passa a ser avaliável
quando as páginas legadas correspondentes tiverem disposição — Fase 6 ou
posterior.

### 0.4 Componentização

Extrair só onde há responsabilidade própria, volume ou ganho de revisão:

| Seção | Decisão | Motivo |
|---|---|---|
| Hero | **inline** em `page.tsx`, via `PageHero` existente | `PageHero` já aceita `label`, `title`, `description` e `action` |
| Orientação | **inline** | ~25 linhas, sem estado |
| Quatro competências | **componente** `SolutionsCompetencies.tsx` | maior bloco da página, estrutura repetida com variação, quatro âncoras e tracking |
| Como a RC2 trabalha | **inline** | tabela simples de quatro níveis |
| Operação Gerenciada | **componente** `SolutionsManagedOps.tsx` | move literal de ~120 linhas já aprovadas na Fase 3; isolar torna verificável no diff que ela **não** foi reescrita |
| CTA final | **inline**, via `CTABlockBase` existente | componente já existe |

Não serão criados `SolutionsHero.tsx`, `SolutionsOrientation.tsx`,
`SolutionsMethod.tsx` nem um componente por competência.

### 0.5 Navegação testável — `src/lib/content/navigation.ts`

`CREATE`. `Header.tsx` é `"use client"` e o Vitest só carrega
`tests/unit/**/*.test.ts` (confirmado em `vitest.config.ts`), portanto não há
teste de render. Extrair os arrays de navegação para um módulo de dados dá
contrato testável sem renderizar TSX. `Header.tsx` e `Footer.tsx` passam a
importá-lo.

### 0.6 Link externo do Zapbox

| Superfície | Decisão |
|---|---|
| Fronteira dentro de `#ia-para-operacoes` | `<a>` externo **sem tracking**, seguindo o precedente já existente na seção Operação Gerenciada (`solucoes/page.tsx:205-212`) |
| Footer, linha "Produto" | `TrackedLink` `kind: "cta"`, conforme `docs/14` §9 |

`docs/14` §24 põe *instrumentar o link do Zapbox* fora de escopo — isso se
refere ao link já existente e não instrumentado. O link novo do Footer recebe a
instrumentação que a própria §9 lhe atribui.

### 0.7 CTA final sem secundário

`CTABlockBase` recebe `hideSecondary`. `docs/14` §5.9 define **um** CTA. O
WhatsApp continua disponível no Header, no Footer e na Home.

### 0.8 Divergências da spec — registradas

| # | Achado | Decisão |
|---|---|---|
| D-1 | `Footer.tsx:9` — a coluna **Empresa** rotula `/solucoes` como **"Soluções por Problema"**, copy legada. `docs/14` §9 diz "Empresa inalterada **em estrutura**" | **Alterar o rótulo** para "Soluções". É a mesma copy descontinuada que a fase substitui; a estrutura da coluna permanece |
| D-2 | `src/components/admin/PostFormTabs/CtaTab.tsx:46` — default de CTA de post: `{ text: "Conhecer soluções", url: "/servicos" }`. Não consta em `docs/14` §14 | **Alterar `url` para `/solucoes`**. O rótulo já diz "soluções"; a intenção mudou inequivocamente. Afeta apenas posts **novos**; nenhum post existente é editado |
| D-3 | `src/app/llms.txt/route.ts:12-19` — descreve o site pelas oito URLs legadas e pela copy antiga ("Soluções por Problema", "atendimento lento…") | **NÃO alterar nesta fase.** É superfície de descoberta, não de navegação, e as URLs continuam 200. Registrado como follow-up S5 na §8 |

---

## 1. Estrutura de arquivos

| Arquivo | Ação | Responsabilidade | Server/Client | Teste |
|---|---|---|---|---|
| `src/lib/content/solucoesPage.ts` | CREATE | H1, subheadline, eyebrow, orientação, 4 competências, âncoras, método, CTAs, termos proibidos | módulo puro | `tests/unit/solucoes/solucoesContent.test.ts` |
| `src/lib/content/navigation.ts` | CREATE | `NAV_LINKS`, `FOOTER_COMPANY_LINKS`, `FOOTER_SOLUTION_LINKS`, `FOOTER_PRODUCT_LINK` | módulo puro | `tests/unit/navigation/navigation.test.ts` |
| `src/app/(public)/solucoes/page.tsx` | MODIFY | metadata, schema, hero, orientação, método, CTA final | Server | `tests/unit/solucoes/solucoesMetadata.test.ts` |
| `src/components/marketing/solucoes/SolutionsCompetencies.tsx` | CREATE | 4 competências + 4 âncoras + tracking | Server (usa `TrackedLink`/`ScrollReveal`, ambos client) | via content + Playwright |
| `src/components/marketing/solucoes/SolutionsManagedOps.tsx` | CREATE | move da seção `#operacao-gerenciada` sem reescrita | Server | Playwright + teste de âncora |
| `src/components/layout/Header.tsx` | MODIFY | consome `NAV_LINKS` | Client | `navigation.test.ts` + Playwright |
| `src/components/layout/Footer.tsx` | MODIFY | consome `navigation.ts`; remove `import { services }` | Server | `navigation.test.ts` + Playwright |
| `src/lib/content/home.ts` | MODIFY | 4 `href` de `HOME_COMPETENCIES` | módulo puro | `tests/unit/home/homeContent.test.ts` |
| `src/app/(public)/blog/page.tsx` | MODIFY | link do estado vazio | Server | — |
| `src/components/marketing/ContactForm.tsx` | MODIFY | link `/servicos` → `/solucoes` | Client | — |
| `src/components/admin/PostFormTabs/CtaTab.tsx` | MODIFY | default `url` (D-2) | Client | — |
| `tests/unit/solucoes/solucoesContent.test.ts` | CREATE | contrato de copy e âncoras | — | — |
| `tests/unit/solucoes/solucoesMetadata.test.ts` | CREATE | metadata e canonical | — | — |
| `tests/unit/navigation/navigation.test.ts` | CREATE | Header/Footer | — | — |
| `tests/unit/home/homeContent.test.ts` | MODIFY | 4 destinations com âncora | — | — |

**Removidos de `/solucoes/page.tsx`:** `import { solutions }`, `schemaCollectionPage`,
o grid de 5 cards, o CTA "Ver solução completa" e o tracking `solution_hub_card`.

**Nenhum arquivo é deletado. `next.config.ts`, `sitemap.ts`, `robots.ts`,
`services.ts` e `solutions.ts` não são tocados** (o Footer apenas deixa de
importar `services`).

---

## 2. Copy aprovada — literal

Fonte: `docs/14` §5. Esta é a copy que vai ao código; nenhuma paráfrase.

### 2.1 Hero

- **eyebrow:** `Soluções RC2`
- **h1:** `Automação, integrações e IA aplicadas à sua operação.`
- **subheadline:** `A RC2 atua em quatro frentes conectadas para que processos e sistemas acompanhem o tamanho da operação — da automação de tarefas à integração entre plataformas, ERP e dados.`
- **cta:** `Falar sobre minha operação` → `/contato`
- **sem CTA secundário**

### 2.2 Orientação

- **h2:** `Você não precisa chegar sabendo qual ferramenta quer`
- **lead:** `Basta reconhecer o problema da operação. O caminho técnico é definido depois, junto.`

| Sintoma (texto do link) | Âncora |
|---|---|
| `A equipe repete a mesma tarefa todo dia` | `#automacao-de-processos` |
| `Os sistemas não conversam e alguém faz a ponte` | `#integracao-de-sistemas` |
| `Quero usar IA, mas o processo não está estruturado` | `#ia-para-operacoes` |
| `A operação digital cresceu em partes desconectadas` | `#operacoes-digitais-commerce` |

### 2.3 Automação de Processos — `#automacao-de-processos`

- **h2:** `Automação de Processos`
- **lead:** `O processo existe e a equipe sabe executá-lo. O problema é que ele roda no braço, depende de quem lembra da regra e não deixa registro do que aconteceu.`
- **sinais:**
  - `A mesma tarefa é refeita todo dia, na mão, por várias pessoas.`
  - `Dados são copiados de um sistema e colados em outro.`
  - `Uma planilha virou o sistema de controle de uma área inteira.`
  - `A regra de negócio está na cabeça de uma pessoa, não no processo.`
  - `Ninguém consegue dizer com precisão o que foi executado e quando.`
- **intervenções:**
  - `Mapeamento do fluxo real — como ele acontece hoje, não como está no manual.`
  - `Automação das etapas repetitivas, com as regras de negócio explícitas.`
  - `Tratamento de exceções: o que o fluxo faz quando o caso não é o padrão.`
  - `Registro do que foi executado, para a operação ter rastreabilidade.`
- **limite:** `O ganho depende do processo e é medido depois da implantação. A RC2 não trabalha com percentual prometido antes de conhecer o fluxo.`

### 2.4 Integração de Sistemas — `#integracao-de-sistemas`

- **h2:** `Integração de Sistemas`
- **lead:** `Cada sistema resolve bem o seu pedaço, mas eles não conversam. A ponte entre eles acaba sendo uma pessoa, digitando duas vezes a mesma informação.`
- **sinais:**
  - `O mesmo cadastro é digitado em mais de um sistema.`
  - `O ERP e a plataforma de vendas discordam sobre o mesmo pedido.`
  - `Alguém exporta uma planilha de um sistema para importar em outro.`
  - `O dado existe, mas não chega a tempo em quem precisa dele.`
  - `Cada área tem a sua própria versão do mesmo número.`
- **intervenções:**
  - `Integração entre ERP, CRM, plataformas e sistemas internos por API ou webhook.`
  - `Definição de qual sistema é a fonte da verdade para cada dado.`
  - `Sincronização com tratamento de erro, reprocessamento e log.`
  - `Conexão de ferramentas que não têm integração nativa entre si.`
- **limite:** `Integração é competência própria, não um detalhe da automação: decidir como o dado circula entre sistemas é decisão de arquitetura.`

### 2.5 IA para Operações — `#ia-para-operacoes`

- **h2:** `IA para Operações`
- **lead:** `IA aplicada sobre processo estruturado resolve. Aplicada sobre processo indefinido, ela apenas automatiza a confusão mais rápido.`
- **sinais:**
  - `Há interesse em usar IA, mas o processo ainda não está descrito.`
  - `Documentos e mensagens chegam em volume e alguém lê tudo na mão.`
  - `Informação é classificada e encaminhada manualmente, caso a caso.`
  - `A equipe repete consultas às mesmas fontes para responder perguntas internas.`
- **intervenções:**
  - `Agentes de IA aplicados a etapas específicas de um processo definido.`
  - `Classificação e triagem de informação com critérios explícitos.`
  - `Leitura e interpretação de documentos e mensagens para alimentar o fluxo.`
  - `Apoio operacional interno: consulta às bases da empresa com contexto controlado.`
  - `Governança: o que o agente pode fazer, com quais dados e até qual limite.`
  - `Handoff humano definido — quando o caso sai do agente e vai para uma pessoa.`
- **fronteira Zapbox** (`<a>` externo sem tracking, §0.6): `Atendimento e vendas pelo WhatsApp, equipe de atendimento, CRM comercial e Sales AI são território do Zapbox, produto da própria RC2. Não é o que esta competência cobre.`

### 2.6 Operações Digitais & Commerce — `#operacoes-digitais-commerce`

- **h2:** `Operações Digitais & Commerce`
- **lead:** `A operação digital cresceu em partes: a loja veio primeiro, depois o ERP, depois a logística, depois o atendimento. Cada uma resolvida isoladamente.`
- **sinais:**
  - `O estoque da loja não reflete o estoque real.`
  - `O pedido é criado na plataforma e recriado no ERP.`
  - `Status de pagamento e de entrega vivem em telas diferentes.`
  - `Cada canal de venda tem o seu próprio processo paralelo.`
- **intervenções:**
  - `Integração entre plataforma, ERP, logística, meios de pagamento e estoque.`
  - `Fluxo de pedido único, do checkout à entrega, com status consistente.`
  - `Automação das rotinas que hoje dependem de conferência manual.`
  - `Consolidação dos dados da operação em uma visão só.`
- **limite:** `A RC2 não se posiciona como fábrica de lojas virtuais. Loja, site e interface podem fazer parte de um projeto; o trabalho é a operação digital integrada.`

### 2.7 Como a RC2 trabalha

- **h2:** `Como a RC2 trabalha`

| Nível | Texto |
|---|---|
| `Conversa inicial` | `Uma conversa de 20 a 30 minutos, sem compromisso, para entender o cenário, o problema e se há aderência.` |
| `Discovery Operacional` | `Quando há incerteza estrutural, o passo seguinte é o Discovery Operacional — uma etapa paga, com levantamento, arquitetura, riscos, prioridades e roadmap.` |
| `Implantação` | `A construção das automações e integrações, com a operação acompanhando cada entrega.` |
| `Operação Gerenciada` | `Depois da implantação, o acompanhamento técnico contínuo do que já está rodando.` |

**Sem faixa de preço** (`docs/11` §1: a faixa vive em `/contato`).

### 2.8 CTA final

- **title:** `Qual processo da sua operação ainda depende de alguém lembrar?`
- **description:** `Comece por uma conversa de 20 a 30 minutos, sem compromisso, para entender o cenário e definir o próximo passo.`
- **primaryLabel:** `Falar sobre minha operação` → `/contato`

### 2.9 Metadata

| Campo | Valor |
|---|---|
| `title` | `Soluções — Automação, Integrações e IA para Operações` |
| `description` | `Automação de processos, integração de sistemas, IA para operações e operações digitais & commerce. As quatro competências da RC2 para a operação da sua empresa funcionar melhor.` |
| `og:title` | idêntico ao `title` |
| `og:description` | `As quatro competências da RC2: automação de processos, integração de sistemas, IA para operações e operações digitais & commerce.` |
| `canonical` | `https://www.rc2solucoes.com.br/solucoes` |
| `og:url` | `https://www.rc2solucoes.com.br/solucoes` |

### 2.10 Footer

- **copy institucional:** `Consultoria e implementação de automação de processos, integração de sistemas e IA para operações.`
- **heading da coluna:** `Soluções`
- **linha de produto:** `Zapbox — atendimento e vendas pelo WhatsApp` → `https://zapbox.cloud/`

---

## 3. Matriz final de analytics

Evento único `cta_click`. **Nenhum event kind novo.**

| Superfície | Event | Location | Label | Destination | Status |
|---|---|---|---|---|---|
| Header desktop CTA | `cta_click` | `header_desktop` | `diagnostico_gratuito` | `/contato` | `PRESERVED` |
| Header mobile CTA | `cta_click` | `header_mobile` | `diagnostico_gratuito` | `/contato` | `PRESERVED` |
| Footer — Empresa/Contato | `cta_click` | `footer_empresa` | `contato` | `/contato` | `PRESERVED` |
| Footer — WhatsApp | `whatsapp_click` | `footer_contact` | `whatsapp` | `https://wa.me/5511988028550` | `PRESERVED` |
| Home — competências ×4 | `cta_click` | `home_solutions` | `automacao_de_processos` · `integracao_de_sistemas` · `ia_para_operacoes` · `operacoes_digitais_commerce` | `/solucoes#<âncora>` | `REPOINTED` |
| Home — método | `cta_click` | `home_method` | `operacao_gerenciada` | `/solucoes#operacao-gerenciada` | `PRESERVED` |
| `/solucoes` — Operação Gerenciada | `cta_click` | `solutions_managed_ops` | `operacao_gerenciada` | `/contato` | `PRESERVED` |
| `/solucoes` — grid de 5 cards | `solution_link_click` | `solution_hub_card` | *(5 shortTitles)* | `/solucoes/<slug>` | `ENDED_SURFACE` |
| `/solucoes` — Hero CTA | `cta_click` | `solutions_hero` | `falar_sobre_minha_operacao` | `/contato` | `NEW` |
| `/solucoes` — Orientação ×4 | `cta_click` | `solutions_orientation` | `automacao_de_processos` · `integracao_de_sistemas` · `ia_para_operacoes` · `operacoes_digitais_commerce` | `#<âncora>` | `NEW` |
| `/solucoes` — CTA final | `cta_click` | `solutions_final_cta` | `falar_sobre_minha_operacao` | `/contato` | `NEW` |
| Footer — coluna Soluções ×5 | `cta_click` | `footer_solucoes` | os 4 acima + `operacao_gerenciada` | `/solucoes#<âncora>` | `NEW` |
| Footer — Zapbox | `cta_click` | `footer_produto` | `conhecer_zapbox` | `https://zapbox.cloud/` | `NEW` |
| `service_detail_*`, `solution_detail_*`, `*_related_*`, `service_navigation_*` | — | — | — | — | `PRESERVED` — as páginas continuam |

**Regras:** `solution_hub_card` fica **encerrada, não renomeada**; nenhum
identificador antigo é reutilizado com novo significado; os labels das âncoras
usam a forma com underscore já adotada em `home.ts`.

---

## 4. Estratégia de testes

| Camada | Cobre | Não cobre |
|---|---|---|
| **UNIT** (`tests/unit/**/*.test.ts`) | constantes de copy, âncoras, destinations, metadata, arrays de navegação | render de TSX — o `include` do Vitest é só `.test.ts` |
| **BUILD/TYPES** | `npm run typecheck`, `npm run build` | — |
| **PLAYWRIGHT MCP** | layout, hash navigation, Header mobile, foco, overflow, verificação visual | — |

**Nunca criar `.test.tsx`** — `vitest.config.ts` define
`include: ["tests/unit/**/*.test.ts"]`; um `.test.tsx` nunca roda
(`tests/unit/admin/security-page-sanitization.test.tsx` é a prova viva disso).

**Não** criar teste de RSC async só para cobertura. O contrato testável vive
nos módulos de conteúdo.

---

## 5. Tasks

### Task 1 — Preflight e observação do baseline real

**Files** — Create: — · Modify: — · Remove: — · Test: —

**Consumes** — estado do repositório.

**Produces** — baseline observado e feature branch criada.

- [ ] `git status && git branch --show-current && git log --oneline -3`
- [ ] confirmar `design/phase-5-solutions @ 71ab5b2`, tree limpa
- [ ] `git checkout main && git pull --ff-only && git checkout -b feat/phase-5-solutions`
- [ ] `npm run typecheck` — registrar resultado real
- [ ] `npm run lint` — registrar erros e warnings reais
- [ ] `npm run test` — registrar arquivos e testes reais
- [ ] `npm run audit:brand` — registrar resultado real
- [ ] comparar com o baseline documentado (typecheck PASS · lint 0 erros/11 warnings · 21 arquivos/138 testes · brand PASS · build PASS). **Divergência não bloqueia, mas precisa ser registrada antes de qualquer edição.**

---

### Task 2 — RED: contrato de conteúdo de `/solucoes`

**Files**
- Create: `tests/unit/solucoes/solucoesContent.test.ts`
- Modify: —
- Remove: —
- Test: o próprio arquivo

**Consumes** — §2.1–2.8 deste plano; `docs/14` §5 e §6.

**Produces** — suíte vermelha por módulo inexistente.

- [ ] escrever os testes contra `@/lib/content/solucoesPage` (ainda inexistente):
  - `SOLUCOES_COPY.h1` === a string da §2.1
  - `SOLUCOES_COPY.subheadline` === a string da §2.1
  - `SOLUCOES_COPY.eyebrow` === `"Soluções RC2"`
  - `SOLUCOES_COMPETENCIES` tem exatamente 4 itens, na ordem Automação · Integração · IA · Commerce
  - os `id` são exatamente `automacao-de-processos`, `integracao-de-sistemas`, `ia-para-operacoes`, `operacoes-digitais-commerce`
  - `SOLUCOES_ANCHORS` tem 5 entradas e inclui `operacao-gerenciada`
  - todos os ids são únicos
  - cada competência tem `lead`, `signals.length >= 4` e `interventions.length >= 4`
  - `SOLUCOES_CTAS.hero.label` === `"Falar sobre minha operação"` e `.href` === `"/contato"`
  - `SOLUCOES_CTAS.hero.secondary` é `undefined`
  - `SOLUCOES_ORIENTATION.items` tem 4 entradas, cada uma com `href` começando em `#`
  - nenhuma string do módulo contém, em minúsculas: `solicitar diagnóstico`, `diagnóstico gratuito`, `cases de sucesso`, `chatbot`
  - `whatsapp`, `crm` e `sales ai` só aparecem dentro de `SOLUCOES_COMPETENCIES[2].boundary`
  - `SOLUCOES_METHOD` tem 4 níveis e nenhuma string contém `R$`
- [ ] `npx vitest run tests/unit/solucoes/solucoesContent.test.ts` → **falha por módulo não encontrado**
- [ ] não commitar ainda; segue na Task 3

---

### Task 3 — GREEN: `src/lib/content/solucoesPage.ts`

**Files**
- Create: `src/lib/content/solucoesPage.ts`
- Test: `tests/unit/solucoes/solucoesContent.test.ts`

**Consumes** — §2.1–2.8, literalmente.

**Produces** — módulo de conteúdo tipado e verde.

- [ ] declarar os tipos **antes** das constantes, para evitar a narrowing trap
      do `as const` que apareceu na Fase 4 com `HOME_DEMOS`:
      `type Competency = { id: string; eyebrow: string; title: string; lead: string; signals: readonly string[]; interventions: readonly string[]; limit?: string; boundary?: string; analyticsLabel: string }`
- [ ] exportar `SOLUCOES_COPY`, `SOLUCOES_CTAS`, `SOLUCOES_ORIENTATION`,
      `SOLUCOES_COMPETENCIES: readonly Competency[]`, `SOLUCOES_METHOD`,
      `SOLUCOES_ANCHORS`, `FORBIDDEN_SOLUCOES_TERMS`
- [ ] copiar a copy da §2 **sem paráfrase**
- [ ] `npx vitest run tests/unit/solucoes/solucoesContent.test.ts` → **verde**
- [ ] `npm run typecheck`
- [ ] `git add src/lib/content/solucoesPage.ts tests/unit/solucoes/solucoesContent.test.ts`
- [ ] `git commit -m "test: contract for solucoes page content"`

---

### Task 4 — Navegação testável

**Files**
- Create: `src/lib/content/navigation.ts`, `tests/unit/navigation/navigation.test.ts`
- Test: `tests/unit/navigation/navigation.test.ts`

**Consumes** — Rulings 3 e 4; `docs/14` §8 e §9.

**Produces** — contrato de Header/Footer verificável sem render.

- [ ] RED — escrever `navigation.test.ts`:
  - `NAV_LINKS` === `[{href:"/",label:"Início"},{href:"/solucoes",label:"Soluções"},{href:"/sobre",label:"Sobre"},{href:"/blog",label:"Blog"}]`
  - nenhum `href` de `NAV_LINKS` é `/servicos` ou `/solucoes-com-ia`
  - `FOOTER_SOLUTION_LINKS` tem 5 entradas, todas com `href` começando em `/solucoes#`
  - os cinco `href` correspondem exatamente às cinco âncoras de `SOLUCOES_ANCHORS`
  - `FOOTER_SOLUTION_LINKS` inclui `/solucoes#operacao-gerenciada`
  - `FOOTER_COMPANY_LINKS` contém `{href:"/solucoes",label:"Soluções"}` — e **não** `"Soluções por Problema"` (D-1)
  - `FOOTER_PRODUCT_LINK.href` === `"https://zapbox.cloud/"`
  - nenhum `href` de `FOOTER_*` aponta para `/servicos/`
- [ ] `npx vitest run tests/unit/navigation/navigation.test.ts` → **falha**
- [ ] GREEN — criar `src/lib/content/navigation.ts` derivando os `href` das
      âncoras de `solucoesPage.ts`, para que âncora e link não possam divergir
- [ ] `npx vitest run tests/unit/navigation/navigation.test.ts` → **verde**
- [ ] `git commit -m "test: contract for site navigation"`

---

### Task 5 — Metadata e schema de `/solucoes`

**Files**
- Create: `tests/unit/solucoes/solucoesMetadata.test.ts`
- Modify: `src/app/(public)/solucoes/page.tsx`
- Test: `tests/unit/solucoes/solucoesMetadata.test.ts`

**Consumes** — §2.9; `docs/14` §16.

**Produces** — metadata no posicionamento vigente; `CollectionPage` removido.

- [ ] RED — testes no modelo de `tests/unit/home/homeMetadata.test.ts`:
  - `meta.title` === `"Soluções — Automação, Integrações e IA para Operações"`
  - `meta.description` === a string da §2.9
  - `meta.alternates?.canonical` === `"https://www.rc2solucoes.com.br/solucoes"`
  - `meta.openGraph?.url` === `"https://www.rc2solucoes.com.br/solucoes"`
  - `title + description` em minúsculas não contém `atendimento lento`, `leads sem resposta`, `whatsapp`, `chatbot`
- [ ] `npx vitest run tests/unit/solucoes/solucoesMetadata.test.ts` → **falha**
- [ ] GREEN — em `page.tsx`: substituir `generateMetadata`; atualizar
      `schemaWebPage.name` e `.description`; **remover `schemaCollectionPage`,
      o seu `<script>` e o `import { solutions }`**
- [ ] **não** introduzir `Service` schema
- [ ] `npx vitest run tests/unit/solucoes/` → **verde**
- [ ] `npm run typecheck` — confirmar que `solutions` não ficou como import morto
- [ ] `git commit -m "feat: reposition solucoes metadata and schema"`

---

### Task 6 — Hero e Orientação

**Files** — Modify: `src/app/(public)/solucoes/page.tsx`

**Consumes** — §2.1 e §2.2.

**Produces** — as duas primeiras seções no novo enquadramento.

- [ ] substituir o `PageHero` atual por
      `label={SOLUCOES_COPY.eyebrow}`, `title={SOLUCOES_COPY.h1}`,
      `description={SOLUCOES_COPY.subheadline}` e
      `action={<TrackedLink href="/contato" tracking={{kind:"cta",location:"solutions_hero",label:"falar_sobre_minha_operacao",destination:"/contato"}} …>Falar sobre minha operação</TrackedLink>}`
- [ ] **nenhum** CTA secundário no hero
- [ ] substituir a seção "Mapeamento por dor" pela Orientação: o `<h2>` da §2.2,
      o lead e os 4 links de âncora com `location:"solutions_orientation"` e
      label = slug com underscore
- [ ] remover o grid de 5 cards, o CTA "Ver solução completa" e o bloco
      `solution_hub_card`
- [ ] `npm run build`; inspeção visual em `npm run dev`
- [ ] `git commit -m "feat: rebuild solucoes hero and orientation"`

---

### Task 7 — As quatro competências

**Files**
- Create: `src/components/marketing/solucoes/SolutionsCompetencies.tsx`
- Modify: `src/app/(public)/solucoes/page.tsx`

**Consumes** — §2.3–2.6; `docs/14` §6 e §17.

**Produces** — quatro `<h2>`, quatro âncoras, composição variada.

- [ ] cada competência renderiza `<section id={competency.id}>` com o `<h2>`
      **dentro** da section, para o leitor de tela anunciar o título no salto
- [ ] **variação editorial obrigatória** — não podem ser 4 cards iguais:
  - Automação: lead + sinais em lista vertical + intervenções em coluna ao lado
  - Integração: sinais e intervenções em duas colunas de peso igual
  - IA: lead largo + intervenções em fluxo de duas colunas + **bloco de fronteira Zapbox** em superfície destacada
  - Commerce: lead + intervenções como sequência numerada da jornada do pedido
- [ ] alternar o fundo entre `bg-rc2-bg` e `bg-rc2-bg-alt`; no máximo **uma**
      competência em superfície navy, para o Safety Orange ficar sob 10% da área
- [ ] ícones Lucide de traço fino, cor `--rc2-heading`; **nenhum hex literal**
- [ ] fronteira Zapbox: `<a href="https://zapbox.cloud/" target="_blank" rel="noopener noreferrer">`, **sem tracking** (§0.6)
- [ ] `npm run audit:brand`
- [ ] `git commit -m "feat: add solucoes competencies sections"`

---

### Task 8 — Como a RC2 trabalha

**Files** — Modify: `src/app/(public)/solucoes/page.tsx`

**Consumes** — §2.7; `docs/11` §1; `docs/14` §5.7.

**Produces** — os quatro níveis, sem preço e sem promessa gratuita indevida.

- [ ] renderizar os 4 níveis da §2.7 na ordem dada
- [ ] **proibido:** `R$`, "diagnóstico gratuito", "levantamento completo
      gratuito", "roadmap gratuito", "arquitetura gratuita"
- [ ] Discovery citado **nominalmente como etapa paga**, sem faixa de preço
- [ ] sem CTA próprio — a seção informa, não converte
- [ ] `git commit -m "feat: add solucoes engagement model section"`

---

### Task 9 — Operação Gerenciada preservada

**Files**
- Create: `src/components/marketing/solucoes/SolutionsManagedOps.tsx`
- Modify: `src/app/(public)/solucoes/page.tsx`

**Consumes** — `solucoes/page.tsx:132-251` (código atual); Ruling 6.

**Produces** — a seção da Fase 3 intacta, agora isolada.

- [ ] **mover** o JSX das linhas 132–251 sem reescrever texto
- [ ] preservar literalmente: `id="operacao-gerenciada"` · os **nove**
      entregáveis · "não é terceirização nem BPO" · "a operação do negócio
      permanece com o cliente" · a fronteira Zapbox · as integrações
      Zapbox ↔ sistemas quando contratadas · "projetos novos … voltam a ser
      tratados como projeto" · contratação mensal · **sem preço público**
- [ ] preservar o tracking `location:"solutions_managed_ops"`, `label:"operacao_gerenciada"`
- [ ] refino apenas de espaçamento e superfície, para integrar ao ritmo novo
- [ ] acrescentar ao `solucoesContent.test.ts`: `SOLUCOES_ANCHORS` contém `operacao-gerenciada`
- [ ] `git diff` — confirmar que a seção aparece como **move**, não como rewrite
- [ ] `git commit -m "refactor: extract managed operations section"`

---

### Task 10 — CTA final

**Files** — Modify: `src/app/(public)/solucoes/page.tsx`

**Consumes** — §2.8; §0.7.

**Produces** — fechamento da página.

- [ ] usar `CTABlockBase` com `title`, `description` e `primaryLabel` da §2.8,
      `primaryHref="/contato"`,
      `primaryTracking={{kind:"cta",location:"solutions_final_cta",label:"falar_sobre_minha_operacao",destination:"/contato"}}`,
      `hideSecondary` e `variant="dark"`
- [ ] **proibido:** prometer roadmap, arquitetura ou mapeamento gratuitos
- [ ] `npm run build`
- [ ] `git commit -m "feat: add solucoes final cta"`

---

### Task 11 — Header

**Files** — Modify: `src/components/layout/Header.tsx`

**Consumes** — Ruling 3; `src/lib/content/navigation.ts`.

**Produces** — Início · Soluções · Sobre · Blog + CTA.

- [ ] substituir o `navLinks` local por `import { NAV_LINKS } from "@/lib/content/navigation"`
- [ ] **preservar sem tocar:** `isActive`, `aria-current`, o listener de scroll,
      o focus trap do `Tab`, o `Escape` que fecha e devolve o foco ao gatilho,
      `aria-expanded`, `aria-controls="mobile-main-menu"`, o `aria-label`
      dinâmico, o alvo de 44px no mobile e o CTA com
      `label:"diagnostico_gratuito"` em `header_desktop` e `header_mobile`
- [ ] **atenção ao `isActive`:** `pathname.startsWith("/solucoes" + "/")` faz
      `/solucoes/atendimento-lento` marcar "Soluções" como página atual. É o
      comportamento correto e não deve ser alterado
- [ ] `npx vitest run tests/unit/navigation/` → verde
- [ ] `git commit -m "feat: align header navigation to solucoes"`

---

### Task 12 — Footer

**Files** — Modify: `src/components/layout/Footer.tsx`

**Consumes** — Ruling 4; §2.10; D-1.

**Produces** — coluna "Soluções" por âncora, sem dependência do legado.

- [ ] **remover** `import { services } from "@/lib/content/services"` e o
      `footerLinks.servicos`
- [ ] importar `FOOTER_COMPANY_LINKS`, `FOOTER_SOLUTION_LINKS` e `FOOTER_PRODUCT_LINK`
- [ ] heading `Serviços` → `Soluções`
- [ ] os 5 links viram `TrackedLink` `kind:"cta"`, `location:"footer_solucoes"`,
      label = slug com underscore
- [ ] rótulo de `/solucoes` na coluna Empresa: `Soluções por Problema` → `Soluções` (D-1)
- [ ] copy institucional → a string da §2.10
- [ ] linha de produto Zapbox: `TrackedLink` externo,
      `location:"footer_produto"`, `label:"conhecer_zapbox"`,
      `target="_blank" rel="noopener noreferrer"`
- [ ] **preservar:** links legais, o `break-words` do e-mail (Fase 0), o
      WhatsApp com `footer_contact`, o `footer_empresa` do contato, o grid
      responsivo e o `ui-focus-ring`
- [ ] `npm run typecheck` — confirmar que `services` não é mais importado aqui
- [ ] `git commit -m "feat: align footer to solucoes anchors"`

---

### Task 13 — Home → âncoras

**Files** — Modify: `src/lib/content/home.ts`, `tests/unit/home/homeContent.test.ts`

**Consumes** — Ruling 5; `docs/14` §7.

**Produces** — os 4 links da Home nas âncoras, com analytics intacto.

- [ ] RED — acrescentar ao `homeContent.test.ts`:
  - os 4 `href` de `HOME_COMPETENCIES` são exatamente
    `/solucoes#automacao-de-processos`, `/solucoes#integracao-de-sistemas`,
    `/solucoes#ia-para-operacoes` e `/solucoes#operacoes-digitais-commerce`
  - os 4 `analyticsLabel` permanecem `automacao_de_processos`,
    `integracao_de_sistemas`, `ia_para_operacoes` e `operacoes_digitais_commerce`
  - `HOME_METHOD.managedOpsHref` continua `/solucoes#operacao-gerenciada`
- [ ] `npx vitest run tests/unit/home/` → **falha nos 4 href**
- [ ] GREEN — alterar **apenas** os 4 campos `href`. **Nenhum componente é tocado**
- [ ] `git diff src/lib/content/home.ts` — confirmar 4 linhas alteradas e zero
      alterações em `analyticsLabel`, `title` ou `linkLabel`
- [ ] `npx vitest run tests/unit/home/` → verde
- [ ] `git commit -m "feat: point home competencies to solucoes anchors"`

---

### Task 14 — Links internos pontuais

**Files** — Modify: `src/app/(public)/blog/page.tsx`,
`src/components/marketing/ContactForm.tsx`,
`src/components/admin/PostFormTabs/CtaTab.tsx`

**Consumes** — `docs/14` §14; D-2.

**Produces** — as três origens cuja intenção mudou inequivocamente.

| Arquivo | Linha | Categoria | Ação |
|---|---|---|---|
| `blog/page.tsx` | 101-102 | `STATIC_PAGE` | `href` e `destination` → `/solucoes`; **`label:"explorar_servicos"` preservado** (identificador histórico, `docs/10`) |
| `ContactForm.tsx` | 292 | `COMMERCIAL_COMPONENT` | `href` → `/solucoes` |
| `CtaTab.tsx` | 46 | `ADMIN_DEFAULT` | `url` → `/solucoes` (D-2) |

- [ ] **não** tocar: `/servicos/page.tsx`, `/servicos/[slug]`, `/solucoes/[slug]`,
      `llms.txt`, `llms-full.txt`, `sitemap.ts` — categorias `LEGACY_PAGE` e
      `SHARED_CONTENT`, cujas páginas continuam vivas
- [ ] **nenhum** search/replace global; três edições pontuais
- [ ] **nenhum** post do CMS é editado (`BLOG_CMS` intocado)
- [ ] `git commit -m "feat: repoint internal links to solucoes"`

---

### Task 15 — Copy audit Unicode-safe e acessibilidade

**Files** — Modify: apenas o que a auditoria reprovar.

**Consumes** — `docs/14` §19; `AGENTS.md`.

**Produces** — página sem copy descontinuada e com hierarquia correta.

- [ ] auditar **em Python com UTF-8 explícito**, nunca com `grep` de classe
      acentuada — em locale C, `[óo]` casa bytes e produz falso negativo
      (o erro real da Fase 2):

```bash
python - <<'PY'
import io, unicodedata
alvos = ["src/app/(public)/solucoes/page.tsx",
         "src/components/marketing/solucoes/SolutionsCompetencies.tsx",
         "src/components/marketing/solucoes/SolutionsManagedOps.tsx",
         "src/lib/content/solucoesPage.ts",
         "src/lib/content/navigation.ts",
         "src/components/layout/Header.tsx",
         "src/components/layout/Footer.tsx"]
proibidos = ["solicitar diagnóstico", "diagnóstico gratuito",
             "cases de sucesso", "chatbot"]
territorio = ["whatsapp", "lead", "atendimento", "crm", "sales ai"]
for a in alvos:
    low = unicodedata.normalize("NFC", io.open(a, encoding="utf-8").read()).lower()
    for p in proibidos:
        if p in low:
            print(f"REPROVA {a}: {p!r}")
    for termo in territorio:
        for i, ln in enumerate(low.splitlines(), 1):
            if termo in ln:
                print(f"REVISAR {a}:{i} {termo!r}")
PY
```

- [ ] cada ocorrência de `whatsapp`, `lead`, `atendimento`, `crm` ou `sales ai`
      só pode sobreviver **explicando a fronteira Zapbox** — nunca como
      competência RC2. Revisar uma a uma, no contexto
- [ ] confirmar **um único `<h1>`** e um `<h2>` por competência
- [ ] confirmar que nenhum link genérico do tipo "Ver serviço" ou
      "Ver solução completa" sobreviveu (A11Y-04)
- [ ] confirmar os landmarks `header` · `nav` · `main#main-content` · `footer` e o skip link
- [ ] `npm run audit:brand`
- [ ] `git commit -m "fix: solucoes copy and accessibility audit"` *(só se houver mudança)*

---

### Task 16 — Playwright: responsividade, âncoras e Header mobile

**Files** — Modify: apenas o que a validação reprovar. Capturas em
`.playwright-mcp/phase-5/` — **não versionadas**.

**Consumes** — `docs/14` §6, §18 e §19.

**Produces** — evidência de que a página funciona nos quatro viewports.

- [ ] `npm run build && npm run start`
- [ ] para cada viewport **390×844**, **768×1024**, **1024×768**, **1440×900**:
  - [ ] `document.documentElement.scrollWidth <= document.documentElement.clientWidth` — **zero overflow**
  - [ ] hero, quatro competências, Operação Gerenciada e CTA final legíveis
  - [ ] captura em `.playwright-mcp/phase-5/`
- [ ] hash navigation — para cada uma das cinco âncoras
      (`#automacao-de-processos`, `#integracao-de-sistemas`, `#ia-para-operacoes`,
      `#operacoes-digitais-commerce`, `#operacao-gerenciada`):
  - [ ] o elemento existe e o id é único: `document.querySelectorAll('[id="…"]').length === 1`
  - [ ] o topo do alvo **não** fica sob o Header sticky:
        `el.getBoundingClientRect().top >= 64` depois do salto
        (`globals.css:223` já define `:where([id]){scroll-margin-top:5.5rem}` —
        **não adicionar CSS novo se essa regra resolver**)
  - [ ] a URL permanece com o hash depois do salto
  - [ ] o foco continua compreensível na navegação por teclado
- [ ] Header mobile em 390×844: abrir · `aria-expanded="true"` · `Tab` circula
      dentro do menu · `Escape` fecha e devolve o foco ao gatilho
- [ ] validar `/solucoes#operacao-gerenciada` **a partir da Home**, que já
      publica esse destino desde a Fase 3
- [ ] `git commit -m "fix: solucoes responsive and anchor adjustments"` *(só se houver mudança)*

---

### Task 17 — Quality gate e preparação do PR

**Files** — Modify: —

**Consumes** — tudo acima.

**Produces** — branch pronta para revisão. **Sem merge.**

- [ ] fresh run, nesta ordem:

```bash
npm run typecheck
npm run lint
npm run test
npm run audit:brand
npm run build
```

- [ ] comparar com o baseline **observado na Task 1**, não com o documentado
- [ ] `lint`: qualquer warning novo precisa de causa identificada. Warning que
      apareça por **import morto** é para ser removido, não silenciado
- [ ] `test`: a contagem sobe (3 arquivos novos). Nenhum teste pré-existente
      pode passar a falhar
- [ ] `git log --oneline` — confirmar commits pequenos, **sem squash**
- [ ] `git diff main --stat` — confirmar **zero** alterações em
      `next.config.ts`, `src/app/sitemap.ts`, `src/app/robots.ts`,
      `src/lib/content/services.ts` e `src/lib/content/solutions.ts`
- [ ] `git push -u origin feat/phase-5-solutions`
- [ ] abrir **um** PR de consolidação, descrevendo as 9 seções, as 5 âncoras,
      Header, Footer, Home, analytics (com `solution_hub_card` encerrada) e a
      declaração explícita de que **nenhum redirect e nenhuma entrada de
      sitemap foram alterados**
- [ ] **PARAR antes do merge**

---

## 6. Estratégia de commits

Seis unidades revisáveis, sem squash:

| # | Commits | Tasks |
|---|---|---|
| 1 | `test: contract for solucoes page content` · `test: contract for site navigation` | 2–4 |
| 2 | `feat: reposition solucoes metadata and schema` | 5 |
| 3 | `feat: rebuild solucoes hero and orientation` · `feat: add solucoes competencies sections` · `feat: add solucoes engagement model section` · `refactor: extract managed operations section` · `feat: add solucoes final cta` | 6–10 |
| 4 | `feat: align header navigation to solucoes` · `feat: align footer to solucoes anchors` | 11–12 |
| 5 | `feat: point home competencies to solucoes anchors` · `feat: repoint internal links to solucoes` | 13–14 |
| 6 | `fix: solucoes copy and accessibility audit` · `fix: solucoes responsive and anchor adjustments` | 15–16 |

Os commits documentais `274e0ac` e `71ab5b2` permanecem intactos. **Nenhum
amend, nenhum rebase, nenhum force push.**

---

## 7. Sitemap nesta fase

`src/app/sitemap.ts` **não é alterado** — e o motivo é positivo, não uma
omissão: nenhuma URL passa a redirecionar, logo nenhuma sai do sitemap
(`docs/14` §12.1).

As 12 URLs legadas continuam 200, indexáveis, self-canonical e publicadas,
inclusive `/servicos`, `/solucoes-com-ia` e `/servicos/sites-e-landing-pages`,
que saem da navegação nesta fase. **Sair do menu não é sair do sitemap.**

Armadilha registrada para as tasks futuras: `serviceRoutes` e `solutionRoutes`
derivam de `services.ts` e `solutions.ts`. Um redirect criado em
`next.config.ts` **não** remove a origem do sitemap.

---

## 8. POST-PHASE-5 SEO MIGRATION TASKS — gated

**Nenhuma destas tasks é executada pelo plano principal.** Cada uma exige nova
autorização explícita e entrega, na mesma unidade:
**redirect + sitemap + internal links + canonical/destino + testes.**

### S1 — SAFE_NOW, conteúdo já absorvido

| Source | Target | Pré-condição |
|---|---|---|
| `/solucoes-com-ia` | `/solucoes#ia-para-operacoes` | conteúdo útil absorvido na competência de IA |
| `/servicos/agentes-de-ia` | `/solucoes#ia-para-operacoes` | idem |
| `/servicos/automacao-de-processos` | `/solucoes#automacao-de-processos` | idem |

Checklist por URL: redirect permanente em `next.config.ts` · remoção do sitemap
na mesma unidade · nenhum link interno versionado remanescente · destino 200 e
self-canonical · teste de rota.

### S2 — RED-02, reapontar dois aliases

| Source | Target hoje | Target futuro |
|---|---|---|
| `/servicos/integracao-de-sistemas` | `/servicos/automacao-de-processos` | `/solucoes#integracao-de-sistemas` |
| `/servicos/operacoes-digitais` | `/servicos/automacao-de-processos` | `/solucoes#operacoes-digitais-commerce` |

Um salto cada, para a âncora semanticamente correta. Aliases **não** entram no
sitemap.

`/servicos/automacao-de-atendimento` **não é tocado** — território Zapbox,
`DEFER_PHASE_6` (Ruling 7).

### S3 — `/services` e trailing slash

`/services` → `/solucoes` em um salto. `/services/` aceita 2 saltos via
normalização do framework. **Não criar middleware** só para eliminar esse salto
(Ruling 9). Reavaliar o trailing slash no gate de execução.

### S4 — `/servicos` hub

**Bloqueada.** Só quando os cinco `/servicos/*` tiverem disposição definida — o
que hoje depende do território Zapbox (Fase 6) e dos dados de SEO
(`docs/14` §11). Até lá, `/servicos` é 200, está no sitemap e está fora da
navegação.

### S5 — Follow-up registrado: `llms.txt`

`src/app/llms.txt/route.ts:12-19` descreve o site pela arquitetura e pela copy
legadas. Não é navegação e as URLs continuam 200, por isso ficou fora da Fase 5
(D-3). Deve ser revisto junto com S1, quando os destinos finais existirem.

### Bloqueadas por dado externo

`NEEDS_SEO_DATA` — `/servicos/e-commerce`, `/solucoes/processos-manuais` e
`/solucoes/sistemas-desconectados`: **nenhum redirect** sem dados do Search
Console (Ruling 10).

`DEFER_PHASE_6` — `/servicos/automacoes-com-ia`, `/solucoes/atendimento-lento`,
`/solucoes/leads-sem-resposta` e `/solucoes/whatsapp-desorganizado`: só migram
quando houver destino equivalente no Zapbox (Ruling 7).

`KEEP` — `/servicos/sites-e-landing-pages`: sai da navegação, **não**
redireciona. Despriorização não é motivo para redirecionar (Ruling 11).

---

## 9. Riscos

| # | Risco | Mitigação |
|---|---|---|
| R-1 | `/servicos` e `/solucoes-com-ia` perdem links sitewide antes de qualquer redirect, reduzindo autoridade interna | Consequência prevista em `docs/14` §20. Temporária: consolida em `/solucoes` quando S1/S4 forem autorizadas. As URLs seguem no sitemap e com malha interna própria |
| R-2 | A página virar quatro cards gigantes iguais | Task 7 define composição diferente por competência; gate visual na Task 16 |
| R-3 | Território Zapbox reentrar pela copy de IA ou de Commerce | Auditoria Unicode-safe da Task 15 + teste que restringe os termos ao campo `boundary` |
| R-4 | Perda de série histórica de analytics | Matriz da §3: só o `destination` muda na Home; `solution_hub_card` é encerrada, não renomeada; labels do Header preservados |
| R-5 | `#operacao-gerenciada` quebrar — a Home já publica esse destino desde a Fase 3 | Task 9 move sem reescrever; teste de âncora e validação a partir da Home na Task 16 |
| R-6 | Reescrever a Operação Gerenciada "por estética" | Task 9 exige que o `git diff` mostre um move |
| R-7 | Falso negativo de auditoria por acento em locale C | Auditoria em Python com UTF-8 explícito, nunca `grep` com classe acentuada |
| R-8 | Criar `.test.tsx` que nunca roda | Regra na §4; o `include` do Vitest é só `.test.ts` |
| R-9 | Import morto de `solutions`/`services` derrubando o lint | Typecheck explícito nas Tasks 5 e 12 |
| R-10 | Um redirect entrar no PR por descuido | Abordagem A + verificação de `git diff main --stat` na Task 17 |

---

## 10. Critérios de aceite do PR

Os 15 critérios de `docs/14` §23, mais:

16. `next.config.ts`, `src/app/sitemap.ts` e `src/app/robots.ts` **não aparecem no diff**.
17. `services.ts` e `solutions.ts` **não aparecem no diff**.
18. Nenhum arquivo `.test.tsx` foi criado.
19. Nenhum post do CMS foi editado.
20. Os commits documentais `274e0ac` e `71ab5b2` permanecem intactos.

---

## 11. Fora do escopo desta fase

Tudo o que `docs/14` §24 lista, mais: executar qualquer task da §8 · alterar
`llms.txt` ou `llms-full.txt` · tocar `/servicos/*` e `/solucoes/[slug]` ·
criar middleware · renomear labels de analytics históricos · iniciar a Fase 6.
