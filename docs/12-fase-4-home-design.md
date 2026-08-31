# Fase 4 — Nova Home RC2 — Design

> **Especificação de design. Não é implementação.** Nenhum arquivo em `src/`,
> rota, componente, metadata, analytics ou banco foi alterado nesta tarefa.
>
> Este documento precisa de revisão do responsável pelo negócio antes da
> criação do plano técnico da Fase 4.

**Baseline:** `main @ 1897ca9` · Fases 0, 1, 2 e 3 publicadas.

### Convenção de marcação

| Marca | Significado |
|---|---|
| `APPROVED` | Consta em fonte oficial do projeto, citada. |
| `OBSERVED` | Verificado nesta tarefa, no código ou em produção. |
| `INFERRED` | Proposta de design derivada das fontes; decisão do documento, não das fontes. |
| `DEPENDÊNCIA EXTERNA` | Falta dado externo. O documento diz qual, por quê e como a Fase 4 funciona sem ele. |

---

## 1. Objetivo

Reposicionar a Home para que a RC2 seja lida como **consultoria de Automação,
Integrações e IA para Operações** — e não como fornecedora de atendimento
automático, leads ou WhatsApp, território que pertence ao Zapbox.

A Fase 4 **não reabre** nenhuma decisão comercial das Fases 1 e 3.

---

## 2. Fontes de verdade

Lidas integralmente, na ordem de autoridade: `AGENTS.md` · `PRODUCT.md` ·
`DESIGN.md` · `RC2_PROPOSTA_ATUALIZACAO.txt` ·
`RC2_PROMPT_MESTRE_REFORMULACAO.txt` · `RC2_Brand_Guide_v2.1.md` · `docs/08` ·
`docs/09` · `docs/10` · `docs/11` · skills `rc2-brand-system` e
`rc2-site-migration` · `src/app/(public)/page.tsx` e componentes diretos.

---

## 3. Estado atual

`OBSERVED` — a Home tem hoje **8 blocos**:

| # | Bloco | Observação |
|---|---|---|
| 1 | Hero | H1 sobre leads e tarefas; promessas de 2 min, 24h, 30 dias |
| 2 | Para quem é | 6 sintomas, fundo navy |
| 3 | Escolha pela sua dor | 5 dores → `/solucoes/*` e `/contato` |
| 4 | O que entregamos | grid de 5 `ServiceCard` |
| 5 | Posicionamento | "O que a RC2 não é" |
| 6 | Diferencial | "Tecnologia com visão de operação." |
| 7 | Avaliações | `HomeReviews` |
| 8 | CTA final | `HomeCtaBlock` |

`OBSERVED` — a Home já está em conformidade com as Fases 0–3: canonical em
`www`, CTAs aprovados, sem expressões descontinuadas, sem promessa gratuita de
Discovery.

---

## 4. Princípios de posicionamento

`APPROVED` — proposta §8 e skill `rc2-site-migration`.

A Home **deixa de abrir** pelo território de leads, WhatsApp, atendimento
automático, "resposta em menos de 2 minutos" e "24h por dia". Esse território é
do **Zapbox**.

A Home passa a posicionar a RC2 como **Automação de Processos + Integração de
Sistemas + IA para Operações + Operações Digitais & Commerce**.

**Problema central:** operações que cresceram, mas cujos processos e sistemas
não acompanharam.

**Mensagem central:** *A RC2 conecta sistemas, automatiza processos e aplica IA
para fazer sua operação funcionar melhor.*

A RC2 aparece **acima** dos produtos e ferramentas.

---

## 5. Arquitetura das 10 seções

### 5.1 Hero

| Campo | Definição |
|---|---|
| **Objetivo** | Em ~10s: o problema, o que a RC2 faz, para quem, e o próximo passo |
| **H1** `APPROVED` | **"Sua operação não precisa de mais ferramentas. Precisa funcionar melhor."** |
| **Subheadline** `APPROVED` | **"A RC2 conecta sistemas, automatiza processos e aplica inteligência artificial para reduzir trabalho manual, retrabalho e gargalos na operação."** — transcrita do hero aprovado na skill `rc2-site-migration` |
| **Eyebrow** `INFERRED` | "Automação · Integrações · IA para Operações" |
| **CTA primário** | "Falar sobre minha operação" → `/contato` |
| **CTA secundário** | "Conhecer soluções" → `/solucoes` |

**Conteúdo obrigatório:** headline, subheadline, dois CTAs, e a frase
institucional *"Tecnologia que funciona. Operação que entrega."* — já publicada
hoje e aprovada.

**Conteúdo proibido:** leads como território central · atendimento automático ·
"primeira resposta em menos de 2 minutos" · "24h por dia" · "no ar em 30 dias" ·
"sem contratar mais ninguém" · qualquer claim quantitativo não sustentado ·
diagnóstico gratuito.

**Elementos visuais** `INFERRED` — diagrama estrutural, não decorativo:

```
Processos  ─┐
Sistemas   ─┼──▶  RC2  ──▶  Operação integrada
Dados      ─┘
```

Três entradas convergindo para a RC2 e saindo como operação integrada.
Construído em **SVG inline ou CSS grid**, com tokens `--rc2-*`. Sem robôs,
cérebros, chips, blobs, glassmorphism, dashboard fictício ou número inventado.

O elemento decorativo `.rc2-hero-orbit` atual é reavaliado: mantém-se apenas se
não competir com o diagrama.

**Componentes reutilizáveis:** `SectionLabel`, `HeroActions` (refatorar
rótulos), `ScrollReveal`, `TrackedLink`.

**Analytics:** `cta_click` · `location: home_hero` · labels
`falar_sobre_minha_operacao` e `conhecer_solucoes`.

**Mobile:** diagrama empilha na vertical (Processos / Sistemas / Dados → RC2 →
Operação integrada); CTAs em coluna, largura total, altura mínima 44px.

**Acessibilidade:** único `<h1>` da página. O diagrama transmite informação,
portanto recebe alternativa textual (`role="img"` + `aria-label`, ou `<title>`
no SVG) descrevendo a relação. Nunca só cor para diferenciar as entradas.

**Dependências:** nenhuma.

**Aceite:** um visitante que lê apenas o hero consegue dizer o que a RC2 faz e
qual o próximo passo, sem mencionar WhatsApp ou leads.

---

### 5.2 Problemas operacionais

| Campo | Definição |
|---|---|
| **Objetivo** | Fazer o visitante se reconhecer **antes** de ver oferta |
| **Mensagem** `INFERRED` | "Se a operação cresceu e o processo não acompanhou, os sintomas são estes." |
| **CTA** | nenhum CTA próprio — a seção conduz para 5.3 |

**Quatro territórios obrigatórios** `APPROVED`: trabalho manual · sistemas
desconectados · informação espalhada e difícil de usar · operação digital
fragmentada.

**Exemplos permitidos** `APPROVED`: copiar e colar entre sistemas · planilha
usada como sistema · informação duplicada · sistemas isolados · tarefas
dependentes de pessoas específicas · retrabalho · falta de rastreabilidade.

**Proibido:** WhatsApp, leads ou atendimento como **centro** da seção. Podem
aparecer só como exemplo dentro de um contexto operacional maior.

**Reaproveitamento:** o bloco atual "Para quem é" contém 6 sintomas; **4 são
reaproveitáveis** e 2 são de território Zapbox (leads pelo WhatsApp,
atendimento lento) — estes saem ou são reescritos em chave operacional.

**Componentes:** `SectionLabel`, `ScrollReveal`, `FadeIn`. Lista semântica
(`<ul>`), **não** grid de cards — evita repetir a composição de 5.3.

**Analytics:** nenhum evento. Seção sem interação.

**Mobile:** lista em coluna única.

**Acessibilidade:** `<h2>` + `<ul>`; ícones decorativos com `aria-hidden`.

**Aceite:** nenhum dos quatro territórios está ausente; nenhum item coloca
WhatsApp/leads como problema central.

---

### 5.3 Competências / Soluções RC2

| Campo | Definição |
|---|---|
| **Objetivo** | Substituir "cinco serviços genéricos" por **quatro competências estratégicas** |
| **CTA** | "Conhecer soluções" → `/solucoes` |

**As quatro** `APPROVED`: Automação de Processos · Integração de Sistemas · IA
para Operações · Operações Digitais & Commerce.

Cada uma com: nome, o problema que resolve, e o que a RC2 faz na prática. Sem
preço, sem prazo, sem métrica.

**Proibido como oferta de primeiro nível** `APPROVED`: sites · landing pages ·
construção genérica de loja · chatbot · atendimento automático. Podem ser
citados como **componentes de projeto**, nunca como pilar.

**Nenhuma rota nova.** Os quatro blocos apontam para `/solucoes` (âncoras
internas só quando a Fase 5 criar as seções correspondentes).

**Componentes:** avaliar `ServiceCard` — hoje modelado para 5 serviços com
"Ver serviço". Provável **refatoração** para 4 competências com rótulo
específico por card, resolvendo o finding A11Y-04 (`docs/08`).

**Analytics:** `cta_click` · `location: home_solutions` · labels
`automacao_de_processos`, `integracao_de_sistemas`, `ia_para_operacoes`,
`operacoes_digitais_commerce`, `conhecer_solucoes`.

**Mobile:** 1 coluna; tablet 2; desktop 2 ou 4 conforme densidade.

**Acessibilidade:** `<h3>` por competência sob um `<h2>` de seção; rótulos de
link específicos, nunca "Ver serviço" repetido.

**Aceite:** as quatro competências aparecem; nenhum serviço despriorizado
aparece como pilar.

---

### 5.4 Produtos e soluções próprias

| Campo | Definição |
|---|---|
| **Objetivo** | Mostrar que a RC2 constrói produto próprio, e delimitar territórios |

#### Zapbox `APPROVED`

Categoria: **produto próprio da RC2**. Território: WhatsApp · equipe ·
atendimento · vendas · CRM · Sales AI.

**CTA:** "Conhecer Zapbox" → `https://zapbox.cloud/` — **link externo**,
`target="_blank"`, `rel="noopener noreferrer"`.

**Proibido:** duplicar a oferta Zapbox como serviço RC2.

#### Agenda Confirmada `APPROVED` (conteúdo) + `INFERRED` (tratamento)

Categoria: solução vertical RC2 para clínicas. Problema: confirmações manuais,
faltas, horários vagos, trabalho da recepção. Benefício: confirmações,
lembretes, previsibilidade da agenda, integração quando aplicável.

`OBSERVED` — **`/solucoes/agenda-confirmada` retorna 404 em produção.**

**Tratamento aprovado para a Fase 4:** apresentar o conteúdo factualmente com
**CTA contextual para `/contato`**, rotulado
**"Falar sobre agenda e confirmações"**.

Justificativa: o CTA aprovado em `AGENTS.md` é "Ver Agenda Confirmada", que
pressupõe a rota. Usar esse rótulo sem a rota criaria promessa falsa; usar link
para a rota criaria 404. `AGENTS.md` autoriza CTA contextual quando a página
pede, e todos os CTAs contextuais levam a `/contato` — exceto Zapbox. O rótulo
escolhido descreve a conversa, não uma página inexistente.

**A Fase 4 não cria a rota Agenda Confirmada.** Isso é Fase 6.

**Componentes:** provável componente novo de card de produto, com variação para
destino externo e interno.

**Analytics:** `cta_click` · `location: home_products` · labels
`conhecer_zapbox` e `agenda_confirmada`. O link do Zapbox usa `TrackedLink` com
`kind: "cta"` — **nenhum tracking kind novo** enquanto a dívida de `docs/10`
estiver aberta.

**Mobile:** dois blocos empilhados; Zapbox primeiro.

**Acessibilidade:** link externo com nome acessível explícito; indicação de que
abre em nova aba.

**Aceite:** Zapbox com destino funcional; Agenda Confirmada **sem link
quebrado**.

---

### 5.5 Método RC2

| Campo | Definição |
|---|---|
| **Objetivo** | Mostrar processo e maturidade de execução |
| **Fluxo** `APPROVED` | Entender → Desenhar → Implantar → Medir → Evoluir |

**Obrigatório tornar explícito:** *Entender ≠ Discovery gratuito.*

A conversa inicial gratuita serve para contexto, problema, fit e próximo passo.
Quando há incerteza arquitetural relevante, o trabalho estruturado pertence ao
**Discovery Operacional pago**.

**Discovery na Home** — mencionado nominalmente na etapa "Entender", **sem
repetir a faixa de preço**. A faixa continua publicada em `/contato`, onde tem
o contexto explicativo exigido pela decisão 1.1. Repetir o valor na Home
distorceria a hierarquia do hero. `docs/11` §1 não é alterado.

**Operação Gerenciada na Home** `APPROVED` (`docs/11` §2) — menção resumida na
etapa **"Evoluir"**, como continuidade após a implantação, com link para
`/solucoes#operacao-gerenciada`. Sem preço, sem SLA, sem prazo.

**Proibido:** prometer roadmap, arquitetura, mapeamento completo ou priorização
técnica de graça.

**Componentes:** avaliar `StepList` (usado em `/sobre`) para reuso.

**Analytics:** `cta_click` · `location: home_method` · label
`operacao_gerenciada`.

**Mobile:** as 5 etapas empilham verticalmente com conectores verticais.

**Acessibilidade:** lista ordenada (`<ol>`), já que a ordem é informação.
Conectores visuais com `aria-hidden`.

**Aceite:** um leitor entende que a conversa inicial não entrega o Discovery.

---

### 5.6 Autoridade e prova

| Campo | Definição |
|---|---|
| **Objetivo** | Substituir claim genérico por autoridade documentada |
| **CTA** | "Ver avaliações e projetos" → `/avaliacoes` |

**Fatos autorizados** `APPROVED` — proposta §16, material explicitamente
aprovado:

- Robson Azevedo, **+20 anos** em tecnologia e operações digitais
- **Edenred** — coordenou operação de suporte/monitoramento 24×7 para 10 países
  da América Latina
- **Uno Healthcare** — estruturou canal D2C nos EUA: **US$ 384 mil** em receita
  e **636 pedidos** em ~11 meses; liderou equipe de 10 profissionais
- **Forta Tech** — Shopify, Tray, Totvs, logística, CRM e atendimento com IA

A proposta traz uma **narrativa curta pronta para o site**, que deve ser a base
da redação. A mesma seção proíbe explicitamente na Home: lista de cursos,
dezenas de ferramentas, formação completa e tecnologias individuais.

**Avaliações:** preservar `HomeReviews` — avaliações reais já publicadas.

**Terminologia** `APPROVED` — usar **"Avaliações e Projetos"** ao se referir à
área de prova. **Proibido "Cases de Sucesso"** enquanto não houver case
documentado.

`OBSERVED` — a rota `/avaliacoes` ainda publica "Cases de Sucesso" em três
pontos. **A Fase 4 não renomeia essa rota nem seu conteúdo** (questão aberta #7
de `docs/08`); apenas não reproduz o termo na Home.

**Analytics:** `cta_click` · `location: home_proof` · label `avaliacoes`.

**Acessibilidade:** números como texto, não como imagem.

**Aceite:** nenhum número na seção sem origem na proposta §16.

---

### 5.7 Demonstrações

| Campo | Definição |
|---|---|
| **Objetivo** | Mostrar tecnologia real, não discurso |
| **Conceito** `APPROVED` | "Tecnologia que você pode ver funcionando." |

**Regra:** só entra o que tem ativo real verificável.

**Itens aprovados para a Fase 4:**

1. **Zapbox** — `OBSERVED` destino funcional (`zapbox.cloud` responde 200, com
   páginas de produto). Entra com CTA externo.
2. **O agente de IA do próprio comercial da RC2** — já publicado hoje na Home:
   *"A RC2 usa no próprio comercial o que implementa nos clientes: um agente de
   IA filtra, e quem conversa com você é o Robson."* Fato verificável pelo
   próprio visitante ao acionar o contato. Entra **sem CTA próprio**.

**Valéria — `DEPENDÊNCIA EXTERNA`.**
Qual dado falta: qualquer destino, descrição aprovada ou ativo verificável.
Por que é necessário: sem ele, citar Valéria seria claim não sustentado.
`OBSERVED` — **zero ocorrências** de "Valéria" em `src/`, `documentos-base/`,
`AGENTS.md` e `PRODUCT.md`.
Como a Fase 4 funciona sem: a seção fica com os dois itens acima. Valéria entra
numa fase posterior, se e quando houver ativo aprovado.

**Agenda Confirmada nesta seção:** não entra como demonstração — não há destino
comprovado. Já aparece em 5.4 como solução.

**Proibido:** demo falsa · dashboard simulado · screenshot inventado · número
fictício.

**Analytics:** `cta_click` · `location: home_demos` · label `conhecer_zapbox`.

**Aceite:** todo item da seção tem ativo verificável.

---

### 5.8 Filosofia

| Campo | Definição |
|---|---|
| **Objetivo** | Fixar a tese de marca |
| **Tese** `APPROVED` | **"A IA não substitui uma operação mal estruturada."** |

Explicar, em texto curto: tecnologia não corrige processo ruim sozinha ·
automação precisa de processo · IA precisa de contexto, dados e governança ·
integração reduz a dependência de pessoas como ponte entre sistemas.

**Formato obrigatório:** editorialmente **curta**. Proibido virar grid de
cards, manifesto longo ou texto genérico de IA.

**Reaproveitamento:** o bloco "Diferencial" atual — *"Tecnologia com visão de
operação. A RC2 não entrega só ferramenta. Entrega processo funcionando no dia
a dia"* — é conceito forte e alinhado; **preservar como base**, ajustando a
menção a "diagnóstico à implantação" para não conflitar com a Fase 3.

**Componentes:** bloco tipográfico simples sobre superfície navy.

**Analytics:** nenhum.

**Aceite:** cabe em uma tela; não vira grid.

---

### 5.9 Conteúdo / Blog

| Campo | Definição |
|---|---|
| **Objetivo** | Demonstrar conhecimento e dar continuidade a quem ainda não quer conversar |
| **CTA** | "Ver todos os artigos" → `/blog` |

**Três artigos existentes selecionados** `OBSERVED` — títulos verificados em
produção:

| Tema | Slug | Título |
|---|---|---|
| Automação de processos | `processos-manuais-o-que-automatizar` | Processos manuais: o que vale automatizar |
| Operação / custo de IA aplicada | `custo-de-agente-de-ia` | Custo de agente de IA: onde o gasto se concentra |
| IA aplicada / governança | `governanca-agentes-ia-pmes` | Governança de agentes de IA para PMEs |

**Lacuna registrada** `OBSERVED` — **não existe artigo publicado sobre
integração de sistemas.** Dos 10 posts, nenhum cobre o tema. A seleção acima usa
o melhor disponível para o eixo "operação". Não é lacuna bloqueante: é pauta
editorial futura, fora da Fase 4.

**O slug corrompido não é usado.** `OBSERVED` — a decisão SEO segue aberta
(`docs/08` §19 #1) e há alternativas suficientes.

**Proibido:** criar ou editar posts nesta fase.

**Componentes:** reutilizar `BlogCard` e a consulta existente de posts.

**Analytics:** `cta_click` · `location: home_content` · labels: slug de cada
artigo e `ver_todos_artigos`.

**Aceite:** os três artigos existem e respondem 200; nenhum post criado.

---

### 5.10 CTA final

| Campo | Definição |
|---|---|
| **Objetivo** | Converter quem se reconheceu ao longo da página |
| **Copy** `APPROVED` | **"Tem um processo que ainda depende demais de planilha, copiar e colar ou memória?"** |
| **CTA** | "Falar sobre minha operação" → `/contato` |

**Reforçar** `APPROVED` (Fase 3): primeira conversa de **20–30 minutos**, **sem
compromisso**, para entender contexto e indicar o próximo passo.

**Proibido prometer:** roadmap · arquitetura · mapeamento completo ·
priorização técnica · proposta detalhada gratuita.

**Componentes:** `HomeCtaBlock` — **refatorar copy**, preservando estrutura e
tracking. Hoje a description promete *"mapa de oportunidades"* e já foi
corrigida na Fase 3; o título ainda fala de IA e precisa ser realinhado.

**WhatsApp:** o CTA secundário atual permanece como canal auxiliar, **nunca**
substituto da rota principal.

**Analytics:** `cta_click` · `location: home_final_cta` · label
`falar_sobre_minha_operacao`. O label histórico `comenzar_diagnostico` do
`HomeCtaBlock` **é preservado** enquanto a dívida de `docs/10` estiver aberta —
ver §7.

**Aceite:** nenhuma promessa de entregável do Discovery.

---

## 6. Metadata e schema

`INFERRED` — direção proposta, a validar na implementação.

| Campo | Direção |
|---|---|
| `title` | **"RC2 Soluções — Automação, Integrações e IA para Operações"** (~57 chars; resolve o title de 75 chars com marca duplicada, finding SEO-04) |
| `description` | **"Consultoria e implementação de automação de processos, integração de sistemas e IA para operações de PMEs que cresceram e precisam funcionar melhor."** (~150 chars) |
| `og:title` | igual ao `title` |
| `og:description` | versão curta da description, mesmo território |
| `WebPage` schema `description` | igual à meta description |
| `keywords` | reescritas para automação de processos, integração de sistemas, IA para operações, operações digitais e commerce |

**Proibido no metadata:** leads como benefício principal · atendimento
automático · chatbot · WhatsApp como categoria RC2 · marketing digital · claim
quantitativo.

**Preservar** `APPROVED` — canonical `https://www.rc2solucoes.com.br/`, host
`www`, `og:url` em `www`, `metadataBase`. Nenhuma alteração de host.

`Organization`, `LocalBusiness` e `WebSite` continuam vindo do layout raiz,
inalterados.

---

## 7. Analytics

**Regra da fase** `APPROVED` (`docs/10`) — **não renomear nem apagar evento
histórico** para "limpar" taxonomia. Novas superfícies usam a taxonomia
existente.

**Evento:** `cta_click`, já existente. **Nenhum tracking kind novo.**

**Locations finais desta Home** — nomes fechados:

| Seção | `location` |
|---|---|
| 5.1 Hero | `home_hero` |
| 5.2 Problemas | — (sem interação) |
| 5.3 Competências | `home_solutions` |
| 5.4 Produtos | `home_products` |
| 5.5 Método | `home_method` |
| 5.6 Autoridade | `home_proof` |
| 5.7 Demonstrações | `home_demos` |
| 5.8 Filosofia | — (sem interação) |
| 5.9 Conteúdo | `home_content` |
| 5.10 CTA final | `home_final_cta` |

**Labels finais:** `falar_sobre_minha_operacao` · `conhecer_solucoes` ·
`automacao_de_processos` · `integracao_de_sistemas` · `ia_para_operacoes` ·
`operacoes_digitais_commerce` · `conhecer_zapbox` · `agenda_confirmada` ·
`operacao_gerenciada` · `avaliacoes` · `ver_todos_artigos` · slug de cada
artigo.

**Labels históricos preservados** `OBSERVED` — os 15 de `docs/10` continuam
intactos. Onde um componente reaproveitado já emite label histórico
(`HomeCtaBlock` → `comenzar_diagnostico`; `HeroActions` →
`solicitar_diagnostico`), **o label não muda nesta fase**, mesmo com a copy
nova. A divergência é a dívida já registrada.

**Zapbox** — link externo segue com `kind: "cta"`, **sem tracking kind
próprio**, enquanto a dívida de `docs/10` estiver aberta.

---

## 8. Design system

**Fundação preservada** `APPROVED` — Barlow como família única · tokens
`--rc2-*` · Navy · Safety Orange abaixo de 10% da área · `#F7F5F1` como fundo
de página · texto de botão primário em `--rc2-heading` · anel de foco
`#C2410C` claro / `#FF5F1F` navy · Lucide · sistema de spacing ·
`ScrollReveal`/`FadeIn` · Header e Footer existentes.

**Nenhum hex literal em componente.** Se a Home precisar de uma cor que não
existe como token, a implementação **para e pergunta**.

**Proibido:** nova fonte · nova paleta · shadcn genérico sem necessidade ·
glassmorphism · glow excessivo · blobs · pills decorativas em excesso · card
para todo conteúdo · o mesmo grid repetido em todas as seções · dashboard
fictício.

**Ritmo de composição** `INFERRED` — a Home deve alternar formatos para não
virar "grid de cards ×10": hero com diagrama → lista → grid de competências →
dois blocos de produto → fluxo horizontal do método → prova → demonstrações →
bloco tipográfico → cards de artigo → CTA. Superfícies claras e navy alternam,
com separação por borda `#294054` entre áreas escuras (regra 8).

A Home deve parecer **sistema técnico, operação, arquitetura e processo** — não
landing page SaaS genérica.

---

## 9. Responsividade

Obrigatório em **390×844 · 768×1024 · 1024 · 1440×900**:

- `scrollWidth == innerWidth` em todos — **nenhum overflow horizontal**
- hero legível sem redução excessiva de fonte; H1 mínimo 32px em 390
- diagramas degradam para empilhamento vertical, mantendo a relação legível
- nenhum conteúdo depende de `hover` para ser acessado
- CTAs empilham em coluna, largura total, altura mínima 44px em mobile
- ordem semântica do DOM preservada em todos os breakpoints
- alvos de toque ≥ 24px (WCAG 2.5.8); botões principais ≥ 44px

**Preservar** `OBSERVED` — a correção do Footer em 768px (`break-words` no
e-mail). Qualquer conteúdo novo com token longo (URL, e-mail, identificador)
recebe o mesmo tratamento.

**Atenção específica:** o decorativo `.rc2-hero-orbit` e o blur
`-right-32` já ultrapassam a viewport hoje e são contidos por
`overflow: hidden` do `<section>`. Todo elemento decorativo novo deve nascer
dentro de um container com clipping.

---

## 10. Acessibilidade

- **um único `<h1>`**, no hero
- hierarquia `<h2>`/`<h3>` sem saltos (corrige o padrão H1→H3 do finding
  A11Y-02)
- landmarks preservados: `header` · `nav` · `main#main-content` · `footer`
- **skip link preservado**
- links com nome específico — proibido "Ver serviço" repetido (A11Y-04)
- foco visível com o anel de foco do sistema; nunca `outline: none` sem
  substituto
- navegação completa por teclado
- decorativo com `aria-hidden="true"`
- **diagramas que transmitem informação recebem alternativa textual**
- cor nunca como único diferenciador
- `prefers-reduced-motion` respeitado pelo sistema existente de reveals

**Não regredir** `OBSERVED`: skip link · Header mobile com `aria-expanded`,
`aria-controls`, rótulo Abrir/Fechar, `Escape` fechando e devolvendo foco ao
gatilho · Footer.

---

## 11. Componentização

**Princípio:** extrair apenas unidades com responsabilidade própria. Não deixar
a Home crescer indefinidamente em `page.tsx`, nem transformar cada parágrafo em
componente.

| Componente | Estado | Responsabilidade | Ação | Motivo |
|---|---|---|---|---|
| `SectionLabel` | existente | eyebrow com régua | **REUTILIZAR** | padrão de marca correto |
| `ScrollReveal` / `FadeIn` | existente | entrada por seção | **REUTILIZAR** | respeitam a diretriz de movimento |
| `TrackedLink` | existente | link + analytics | **REUTILIZAR** | taxonomia existente |
| `HomeReviews` | existente | avaliações reais | **REUTILIZAR** | ativo de autoridade, dados reais |
| `HeroActions` | existente | CTAs do hero | **REFATORAR** | rótulos e variantes; preservar label histórico |
| `HomeCtaBlock` | existente | CTA final | **REFATORAR** | copy do título; preservar tracking |
| `ServiceCard` | existente | card de serviço | **REFATORAR** | modelado para 5 serviços com rótulo genérico; passa a 4 competências com rótulo específico |
| `BlogCard` | existente | card de artigo | **REUTILIZAR** | já usado em `/blog` |
| `StepList` | existente | etapas do método | **AVALIAR REUSO** | usado em `/sobre`; verificar aderência ao fluxo de 5 etapas |
| `Header` / `Footer` | existente | layout | **NÃO ALTERAR** | sem dependência real da Home |
| `HomeHeroDiagram` | **novo** | diagrama Processos+Sistemas+Dados → RC2 | **CRIAR** | SVG/CSS com alternativa textual; sem lib nova |
| `HomeProblems` | **novo** | os 4 territórios de problema | **CRIAR** | unidade própria, formato lista |
| `HomeCompetencies` | **novo** | as 4 competências | **CRIAR** | orquestra `ServiceCard` refatorado |
| `HomeProducts` | **novo** | Zapbox + Agenda Confirmada | **CRIAR** | trata destino externo e CTA contextual |
| `HomeMethod` | **novo** | fluxo de 5 etapas | **CRIAR** | ou composição sobre `StepList` |
| `HomeAuthority` | **novo** | trajetória aprovada + reviews | **CRIAR** | encapsula fatos da proposta §16 |
| `HomeContent` | **novo** | 3 artigos | **CRIAR** | consome dados existentes do blog |

`INFERRED` — a lista de componentes novos é proposta de design. O plano técnico
da Fase 4 pode consolidar dois deles se a implementação mostrar que não têm
responsabilidade própria.

---

## 12. Migração do conteúdo atual

| Bloco atual | Ação | Destino | Justificativa |
|---|---|---|---|
| **Hero** (H1 de leads/tarefas, 2min/24h/30dias) | **SUBSTITUIR** | 5.1 | território Zapbox e claims não sustentados |
| Frase institucional *"Tecnologia que funciona…"* | **PRESERVAR** | 5.1 | aprovada em `AGENTS.md` |
| Agente de IA no próprio comercial | **PRESERVAR** | 5.7 | fato verificável, já publicado |
| **"Para quem é"** (6 sintomas) | **REFATORAR** | 5.2 | 4 sintomas reaproveitáveis; 2 são território Zapbox |
| **"Escolha pela sua dor"** (5 dores → `/solucoes/*`) | **MIGRAR** | 5.2 + 5.3 | as dores viram reconhecimento; os destinos legados saem da Home |
| **Grid dos 5 serviços** (`ServiceCard`) | **SUBSTITUIR** | 5.3 | vira 4 competências; sites/landing/e-commerce deixam de ser pilar |
| **"O que a RC2 não é"** | **PRESERVAR** | 5.8 ou 5.4 | conceito forte e específico; não é template |
| **"Diferencial"** (*Tecnologia com visão de operação*) | **REFATORAR** | 5.8 | base da filosofia; ajustar menção a "diagnóstico à implantação" |
| **Avaliações** (`HomeReviews`) | **PRESERVAR** | 5.6 | avaliações reais |
| **CTA final** (`HomeCtaBlock`) | **REFATORAR** | 5.10 | copy do título; estrutura e tracking preservados |
| Social proof do hero variante B | **REFATORAR** | 5.6 | move para autoridade, com fatos da proposta §16 |
| Links diretos para `/solucoes/*` de território Zapbox | **REMOVER da Home** | — | a Home deixa de conduzir para esse território |

**Regra crítica:** *remover da navegação da Home ≠ remover a URL.* As rotas
legadas continuam vivas — ver §13.

---

## 13. SEO e limites da Fase 4

A Fase 4 altera **somente a Home**.

**Não alterar:** `/servicos` · `/servicos/*` · `/solucoes` · `/solucoes/*` ·
`/solucoes-com-ia` · redirects · `sitemap.ts` · `robots.ts` · canonical de
qualquer outra rota.

A Home deixará de linkar algumas ofertas legadas. Isso **não** autoriza
redirecionar nem remover essas URLs. `APPROVED` — skill `rc2-site-migration`:
*"Nunca remover uma URL apenas porque ela não fará parte da nova navegação."*

Rotas legadas permanecem vivas e indexadas até as Fases 5 e 6, que tratarão
consolidação e redirects com análise de SEO.

**Risco a monitorar** `INFERRED` — reduzir links internos da Home para
`/servicos/*` e `/solucoes/*` diminui o fluxo de autoridade interna para essas
páginas. É consequência aceita e temporária; a Fase 5 redistribui os links ao
consolidar `/solucoes`.

---

## 14. Performance

- **nenhuma biblioteca nova** sem necessidade comprovada
- nenhum vídeo no hero
- nenhuma animação JS complexa — manter CSS + IntersectionObserver existentes
- componentes **server** por padrão; `"use client"` só onde houver
  interatividade real
- imagens com `width`/`height` conhecidos; formatos AVIF/WebP já configurados
- o diagrama do hero em **SVG inline ou CSS**, não imagem raster
- não duplicar dados: reutilizar as consultas existentes de posts e reviews
- nenhuma dependência de terceiro nova

`OBSERVED` — a Home hoje carrega apenas 2 imagens (o logo). Manter esse perfil
leve é meta explícita.

**Nenhuma meta numérica de Lighthouse é declarada** — Lighthouse não foi
executado nesta tarefa.

---

## 15. Arquitetura técnica

| Aspecto | Definição |
|---|---|
| **Dados inline** | copy das seções 5.1, 5.2, 5.5, 5.8, 5.10 — conteúdo editorial estável |
| **Arquivos de conteúdo** | competências (5.3) avaliam reuso de `src/lib/content/`; se a modelagem de 4 competências divergir de `services.ts`, define-se estrutura própria |
| **Server components** | todas as seções por padrão; metadata e schema seguem server-side |
| **Client components** | apenas `ScrollReveal`, `FadeIn`, `TrackedLink` e `HeroActions` — os já existentes |
| **Interatividade necessária** | nenhuma nova: sem carrossel, sem accordion, sem tabs |
| **Analytics** | `TrackedLink` com `kind: "cta"`, via `dataLayer` já existente |
| **Links externos** | `target="_blank"` + `rel="noopener noreferrer"`; Zapbox sem tracking kind novo |
| **Metadata / schema** | `generateMetadata` e `getWebPageSchema` existentes, server-side |
| **Artigos do blog** | mesma consulta Supabase já usada por `/blog`, limitada a 3 slugs; nenhuma API nova |
| **Reviews** | `HomeReviews` com sua fonte de dados atual, sem alteração |

**Nenhuma API nova. Nenhum CMS novo. Nenhuma tabela nova.**

---

## 16. Dependências entre seções

| Seção | Depende de | Bloqueia | Isolável? |
|---|---|---|---|
| 5.1 Hero | `HomeHeroDiagram`, `HeroActions` refatorado | — | **sim** |
| 5.2 Problemas | — | 5.3 (narrativa) | **sim** |
| 5.3 Competências | `ServiceCard` refatorado | — | **sim** |
| 5.4 Produtos | decisão de CTA da Agenda Confirmada (fechada em 5.4) | — | **sim** |
| 5.5 Método | seção Operação Gerenciada em `/solucoes` (já existe) | — | **sim** |
| 5.6 Autoridade | `HomeReviews` (existe) | — | **sim** |
| 5.7 Demonstrações | destino Zapbox (existe) | — | **sim** |
| 5.8 Filosofia | — | — | **sim** |
| 5.9 Conteúdo | 3 slugs publicados (existem) | — | **sim** |
| 5.10 CTA final | `HomeCtaBlock` refatorado | — | **sim** |

**Todas as 10 seções são implementáveis isoladamente** e revisáveis uma a uma.

**Regra de release:** a Fase 4 **não publica narrativa intermediária**. As
unidades podem ser revisadas separadamente, mas o merge para produção acontece
com a Home coerente — hero novo e grid legado de 5 serviços não coexistem em
produção.

---

## 17. Critérios de aceite

| # | Pergunta | Resposta |
|---|---|---|
| 1 | Mensagem em 10s | A RC2 conecta sistemas, automatiza processos e aplica IA para a operação funcionar melhor |
| 2 | H1 | "Sua operação não precisa de mais ferramentas. Precisa funcionar melhor." |
| 3 | Subheadline | "A RC2 conecta sistemas, automatiza processos e aplica inteligência artificial para reduzir trabalho manual, retrabalho e gargalos na operação." |
| 4 | CTA principal | "Falar sobre minha operação" → `/contato` |
| 5 | CTA secundário | "Conhecer soluções" → `/solucoes` |
| 6 | 10 seções e ordem | Hero · Problemas · Competências · Produtos · Método · Autoridade · Demonstrações · Filosofia · Conteúdo · CTA final |
| 7 | O que cada seção resolve | §5.1–5.10 |
| 8 | Onde Zapbox aparece | 5.4 (produto, CTA externo) e 5.7 (demonstração) |
| 9 | Onde Agenda Confirmada aparece | 5.4 apenas |
| 10 | Como evitar link quebrado | CTA contextual "Falar sobre agenda e confirmações" → `/contato`; **nenhum link para a rota inexistente** |
| 11 | Onde Operação Gerenciada aparece | 5.5, etapa "Evoluir", link para `/solucoes#operacao-gerenciada` |
| 12 | Como Discovery aparece sem dominar | citado nominalmente em 5.5, **sem repetir a faixa de preço**; o valor permanece em `/contato` |
| 13 | Autoridade factual | +20 anos · Edenred · Uno Healthcare (US$ 384 mil / 636 pedidos / ~11 meses / equipe de 10) · Forta Tech — proposta §16 |
| 14 | Avaliações | as reais já publicadas via `HomeReviews` |
| 15 | Artigos | `processos-manuais-o-que-automatizar` · `custo-de-agente-de-ia` · `governanca-agentes-ia-pmes` |
| 16 | Os 5 serviços legados na Home | saem do grid; viram 4 competências. **As URLs continuam vivas** |
| 17 | O que é removido | hero de leads/2min/24h/30dias · grid de 5 serviços · links da Home para `/solucoes/*` de território Zapbox |
| 18 | O que é preservado | frase institucional · "O que a RC2 não é" · Diferencial · `HomeReviews` · agente de IA no comercial · Header/Footer |
| 19 | Componentes reutilizados | `SectionLabel` · `ScrollReveal` · `FadeIn` · `TrackedLink` · `HomeReviews` · `BlogCard` · Header · Footer |
| 20 | Componentes criados | `HomeHeroDiagram` · `HomeProblems` · `HomeCompetencies` · `HomeProducts` · `HomeMethod` · `HomeAuthority` · `HomeContent` |
| 21 | Analytics novos | `cta_click` com 9 locations e 12 labels — §7. Nenhum evento ou kind novo |
| 22 | Mobile / tablet | §9 — sem overflow em 390/768/1024/1440; empilhamento definido por seção |
| 23 | Acessibilidade | §10 — 1 H1, hierarquia sem salto, diagrama com alternativa textual, sem regressão de Header/skip link |
| 24 | SEO da Home | novo title/description/OG/schema em território de operação; **canonical `www` preservado** |
| 25 | Fora da Fase 4 | §18 |

Nenhuma resposta ficou como TBD, TODO ou "a decidir".

---

## 18. Fora do escopo

A Fase 4 **não** faz:

- criar a rota `/solucoes/agenda-confirmada` → Fase 6
- consolidar `/servicos` em `/solucoes` → Fase 5
- criar redirects ou alterar `sitemap`/`robots` → Fases 5/6
- migrar URLs de território Zapbox → Fase 6
- renomear `/avaliacoes` ou remover "Cases de Sucesso" da rota → questão aberta
  #7 de `docs/08`
- corrigir o slug corrompido do blog → questão aberta #1 de `docs/08`
- revisar a taxonomia de analytics → `docs/10`
- alterar `/contato`, preço do Discovery ou formato da Operação Gerenciada →
  fechados nas Fases 1 e 3
- criar posts, página de Operação Gerenciada, API, CMS ou dependência nova
- instrumentar o link externo do Zapbox → pendência 2.1-b de `docs/11`

---

## 19. Dependências externas

| ID | Dado que falta | Por que é necessário | Como a Fase 4 funciona sem |
|---|---|---|---|
| **DE-1** | **Valéria** — qualquer ativo, destino ou descrição aprovada. `OBSERVED` zero ocorrências no repositório e nas fontes | Sem isso, citá-la seria claim não sustentado | A seção 5.7 fica com Zapbox e o agente de IA do próprio comercial, ambos verificáveis |
| **DE-2** | Artigo publicado sobre **integração de sistemas**. `OBSERVED` nenhum dos 10 posts cobre o tema | O eixo temático de 5.9 previa integrações | A seleção usa o melhor disponível para "operação"; a pauta é editorial futura |
| **DE-3** | Confirmação de que a narrativa curta da proposta §16 pode ser usada **na íntegra** na Home | A proposta a apresenta como "narrativa curta para o site", sem especificar a página | A redação usa os fatos aprovados; se a íntegra for autorizada, entra sem alteração de escopo |

Nenhuma delas bloqueia a Fase 4.

---

## 20. Decisões fechadas

1. H1, subheadline e os dois CTAs do hero — §5.1
2. Ordem final das 10 seções — §5
3. Agenda Confirmada com CTA contextual para `/contato`, **sem link para a rota
   inexistente** — §5.4
4. Discovery citado na Home **sem repetir a faixa de preço** — §5.5
5. Operação Gerenciada na etapa "Evoluir", com link para
   `/solucoes#operacao-gerenciada` — §5.5
6. Os três artigos da seção de conteúdo — §5.9
7. Fatos de autoridade limitados à proposta §16 — §5.6
8. Valéria **fora** da Fase 4 — §19 DE-1
9. Locations e labels de analytics finais; labels históricos preservados — §7
10. Direção de title, description, OG e schema; canonical `www` preservado — §6
11. Componentes a reutilizar, refatorar e criar — §11
12. Rotas legadas permanecem vivas; a Home apenas deixa de linká-las — §13
13. Release da Fase 4 como Home coerente, sem narrativa intermediária em
    produção — §16
