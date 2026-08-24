# 00 — Diagnóstico Inicial

> Documento gerado automaticamente a partir da leitura dos três documentos-base.
> **Não altere os documentos-base. Este arquivo é o produto da análise deles.**

---

## 1. Documentos encontrados

| Arquivo | Localização | Status |
|---|---|---|
| `Estrutura e copy - MVP.docx` | `documentos-base/` | Lido |
| `RC2_Brand_Guide_v2.1.md` | `documentos-base/` | Lido |
| `Plano_Consolidado_RC2_Site_Institucional_Blog_CMS.docx` | `documentos-base/` | Lido |
| `logo-base.png` | `documentos-base/` | Presente |
| `logo-base-transparente.png` | `documentos-base/` | Presente |

---

## 2. Escopo funcional

### 2.1 Tipo de projeto
Site institucional B2B para venda de serviços de consultoria em IA, automações e operações digitais — com blog, CMS administrativo próprio e formulário de captação de leads.

### 2.2 Empresa
**RC2 Soluções** — consultoria fundada por Robson Azevedo, com 20+ anos de experiência em TI, e-commerce e transformação digital. Público-alvo: PMEs de 5 a 200 colaboradores no Brasil.

### 2.3 Páginas públicas (conforme "Estrutura e copy - MVP")
| Página | Rota sugerida |
|---|---|
| Home | `/` |
| Serviços | `/servicos` |
| Soluções com IA | `/solucoes-com-ia` |
| Sobre a RC2 | `/sobre` |
| Contato / Diagnóstico | `/contato` |
| Blog | `/blog` |
| Post individual | `/blog/[slug]` |
| Serviço individual | `/servicos/[slug]` |
| Política de Privacidade | `/privacidade` |
| Termos de Uso | `/termos` |
| Erro 404 | `not-found` |
| Erro 500 | `error` |

### 2.4 Área administrativa
| Função | Descrição |
|---|---|
| Login | Acesso com Supabase Auth |
| Dashboard | Visão geral |
| Posts (CRUD) | Criar, editar, publicar, arquivar, excluir |
| Páginas institucionais | Editar conteúdo de páginas fixas |
| Serviços (CRUD) | Gerenciar lista de serviços |
| Leads | Visualizar captações do formulário |
| Settings | E-mail, redes sociais, OG padrão |

### 2.5 Serviços descritos (5 principais + pacotes)
1. Automações com IA para atendimento, vendas e operação
2. Implantação de agentes de IA para processos internos
3. Automação de processos com n8n, APIs e integrações
4. Implantação e estruturação de e-commerce
5. Modernização de sites, landing pages e interfaces com IA

**6 pacotes comerciais documentados:** Diagnóstico, Atendimento Inteligente, Agente IA Interno, Automação n8n, E-commerce Estruturado, Site Inteligente.

---

## 3. Escopo visual e de marca

### 3.1 Paleta de cores (Brand Guide v2.1)
| Nome | Hex | Uso | Proporção |
|---|---|---|---|
| Warm Base | `#F7F5F1` | Fundo principal de páginas e documentos | 60–70% junto aos demais neutros claros |
| Warm Alt | `#FBFAF8` | Fundo alternativo e seções de respiro | 60–70% junto aos demais neutros claros |
| Surface White | `#FFFFFF` | Cards, inputs, modais e superfícies elevadas | Apenas superfície, não fundo de página |
| Navy Core | `#081827` | Footer, CTA bands e áreas escuras principais | 20–30% junto à família Navy / Slate |
| Navy Secondary | `#0C2032` | Seções escuras secundárias, incluindo Diferencial | 20–30% junto à família Navy / Slate |
| Graphite Navy | `#0B1726` | Títulos e texto sobre Safety Orange | — |
| Body Slate | `#24313D` | Texto principal em fundo claro | — |
| Muted Slate | `#66717D` | Texto secundário | — |
| Safety Orange | `#FF5F1F` | CTA, ícones de ação, indicadores e estados ativos | até 10% |
| Orange Text | `#C2410C` | Links, labels e textos pequenos em fundo claro | uso pontual |

> ⛔ PROIBIDO: reintroduzir verde escuro como cor estrutural, usar azul saturado,
> roxo, ciano, neon ou gradientes coloridos. `#FFFFFF` é permitido apenas como
> superfície elevada, nunca como fundo predominante de página.

### 3.2 Tipografia
- **Família única:** Barlow (Google Fonts, gratuita)
- Display: Barlow Condensed ExtraBold (800) — uppercase, tracking +0.04em
- H1: Barlow Bold (700), tracking −0.02em
- H2: Barlow SemiBold (600)
- Body: Barlow Regular (400), 14–16px, line-height 1.7
- Labels/Tags: Barlow Condensed Medium — uppercase, letter-spacing +0.10em

### 3.3 Logo
- Conceito: **"Signal Interrupt"** — 3 barras horizontais, barra do meio interrompida em Safety Orange no ponto áureo (52–58% do comprimento)
- Arquivos disponíveis: `logo-base.png` e `logo-base-transparente.png`
- ⚠️ **Pendência:** verificar se os arquivos fornecidos já são o logo final "Signal Interrupt" ou são placeholders

### 3.4 Tagline
> "Tecnologia que funciona. Operação que entrega."

### 3.5 CTA único
> "Solicitar diagnóstico" (primário) / "Falar pelo WhatsApp" (secundário)

---

## 4. Stack tecnológica (Plano Consolidado)

| Camada | Tecnologia |
|---|---|
| Front-end | Next.js + TypeScript |
| UI | Tailwind CSS + shadcn/ui + componentes RC2 |
| CMS/Admin | Admin próprio no Next.js |
| Banco de dados | Supabase Postgres |
| Autenticação | Supabase Auth |
| Storage | Supabase Storage |
| Deploy | Vercel |
| Analytics | Plausible + Google Search Console |
| Monitoramento | Sentry |
| Testes | Playwright + Vitest + lint + typecheck |
| Segurança | RLS + rate limit + Turnstile/hCaptcha + Semgrep/Snyk |

---

## 5. MCPs necessários

| MCP | Fase | Prioridade |
|---|---|---|
| GitHub MCP | Desde o início | Essencial |
| Playwright MCP | Após cada página crítica | Essencial |
| Supabase MCP | Fase CMS/Admin | Essencial |
| Context7 MCP | Durante implementação | Essencial |
| Vercel MCP | Após base funcional | Recomendado |
| Sentry MCP | Após staging/produção | Recomendado |
| Semgrep ou Snyk | Antes do primeiro deploy público | Recomendado |

---

## 6. Skills necessárias

| Skill | Uso |
|---|---|
| `frontend-design` | Criação de UI profissional |
| `webapp-testing` | Apoio a testes com Playwright |
| `next-best-practices` / `vercel:nextjs` | Boas práticas de Next.js |
| `vercel:react-best-practices` | Composição e performance React |
| `vercel:shadcn` | Uso correto do shadcn/ui |
| `RC2 Brand System Skill` | A ser criada — identidade RC2 como regra operacional |
| `ui-ux-pro-max` | Design system e heurísticas de UX |
| `taste-skill` | Refinamento estético |
| `skill-creator` / `everything-claude-code:skill-create` | Criar a skill RC2 |

---

## 7. Requisitos não funcionais

- Lighthouse: Performance 90+, SEO 90+, Acessibilidade 90+
- Mobile First
- Sem WordPress
- 1 único administrador no MVP
- SEO técnico completo (metadata, sitemap, robots, OG, Schema.org)
- LGPD: Política de Privacidade, Termos de Uso, consentimento de cookies
- Operar preferencialmente em tiers gratuitos no MVP

---

## 8. Lacunas identificadas

| # | Lacuna | Documento de origem | Status |
|---|---|---|---|
| L1 | Número de WhatsApp não fornecido | Estrutura e copy | ⚠️ Pendente |
| L2 | Domínio `rc2solucoes.com.br` — confirmar se está registrado e apontado | Brand Guide | ⚠️ Pendente |
| L3 | Telefone do fundador aparece como `(11) XXXXX-XXXX` — incompleto | Brand Guide | ⚠️ Pendente |
| L4 | Logo fornecido — confirmar se é o Signal Interrupt final ou placeholder | Brand Guide | ⚠️ Pendente |
| L5 | Preços dos pacotes não definidos (estratégico agora, mas necessário antes de publicar) | Brand Guide | ⚠️ Pendente |
| L6 | Página "Soluções com IA" está no copy mas não listada no Plano Consolidado | Ambos | ⚠️ Ver Conflitos |
| L7 | Conta Supabase — confirmar se já existe projeto criado | Plano Consolidado | ⚠️ Pendente |
| L8 | Conta Vercel — confirmar se já existe e está vinculada ao repositório | Plano Consolidado | ⚠️ Pendente |
| L9 | Conta Plausible — pago após trial; confirmar opção (Plausible vs Umami gratuito) | Plano Consolidado | ⚠️ Pendente |
| L10 | Conta Sentry — free tier; confirmar se já criada | Plano Consolidado | ⚠️ Pendente |
| L11 | Casos/mini cases ainda não existem | Brand Guide | ℹ️ Informativo |
| L12 | Repositório GitHub — confirmar se já existe ou criar novo | Plano Consolidado | ⚠️ Pendente |

---

## 9. Conflitos identificados

| # | Conflito | Documentos | Decisão recomendada |
|---|---|---|---|
| C1 | "Soluções com IA" aparece como página no menu no copy, mas o Plano Consolidado lista as páginas públicas sem ela | Estrutura e copy vs Plano Consolidado | **Incluir a página** — o copy é explícito quanto a essa rota. Confirmar com o usuário antes de avançar |
| C2 | Página de Pacotes não está no Plano Consolidado, mas o copy descreve 6 pacotes com detalhe | Estrutura e copy vs Plano Consolidado | **Incorporar pacotes** na página de Serviços ou criar seção dedicada. Confirmar com usuário |

---

## 10. Pontos de decisão pendentes

1. **Logo:** os arquivos fornecidos são o logo definitivo ou precisam de ajuste/substituição?
2. **WhatsApp:** qual é o número para o CTA "Falar pelo WhatsApp"?
3. **Domínio:** `rc2solucoes.com.br` está registrado e apontado para Vercel?
4. **Plausible vs alternativa gratuita:** confirmar escolha de analytics.
5. **Página "Soluções com IA":** inclui no menu e como rota própria?
6. **Pacotes:** exibir na página de Serviços ou em seção separada?
7. **Repositório GitHub:** já existe? Qual é o nome/URL?
8. **Anti-spam:** Cloudflare Turnstile (requer conta Cloudflare) ou hCaptcha (tem free tier)?
