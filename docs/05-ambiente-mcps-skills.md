# 05 — Ambiente, MCPs e Skills

> Inventário completo de ferramentas, MCPs, Skills e dependências do projeto.
> Baseado no `Plano_Consolidado_RC2_Site_Institucional_Blog_CMS.docx`.

---

## 1. MCPs recomendados

### 1.1 MCPs essenciais

#### GitHub MCP
| Item | Detalhe |
|---|---|
| **Finalidade** | Repositório, issues, PRs, revisão de código, histórico e documentação |
| **Fase de uso** | Desde o início (Fase 0) |
| **Já instalado?** | Verificar: `claude mcp list` |
| **Como instalar** | Disponível via Claude Code — plugin oficial |
| **Credenciais necessárias** | Personal Access Token do GitHub com escopo mínimo: `repo`, `read:org` |
| **Cuidados** | Token com menor escopo possível; revisar manualmente antes de qualquer merge |

#### Playwright MCP
| Item | Detalhe |
|---|---|
| **Finalidade** | Testar navegação, responsividade, formulários, login/admin, publicação e erros |
| **Fase de uso** | Após cada página crítica e antes de deploy |
| **Já instalado?** | Verificar: `claude mcp list` |
| **Como instalar** | Disponível via Claude Code — plugin oficial |
| **Credenciais** | Nenhuma |
| **Cuidados** | Não substitui revisão visual humana |

#### Supabase MCP
| Item | Detalhe |
|---|---|
| **Finalidade** | Apoiar criação de tabelas, auth, RLS, storage, logs e permissões |
| **Fase de uso** | Fase 4 em diante (CMS/Admin) |
| **Já instalado?** | Verificar: `claude mcp list` |
| **Como instalar** | Disponível via Claude Code — plugin oficial |
| **Credenciais** | Supabase access token (service role apenas em dev/staging) |
| **Cuidados** | Usar dev/staging; revisar migrations, SQL e policies antes de produção |

#### Context7 MCP
| Item | Detalhe |
|---|---|
| **Finalidade** | Consultar documentação atualizada de Next.js, Supabase, Tailwind, shadcn e bibliotecas |
| **Fase de uso** | Durante toda a implementação |
| **Já instalado?** | Verificar: lista de MCPs disponíveis no Claude Code — aparece como `plugin:everything-claude-code:context7` |
| **Como instalar** | Já disponível como plugin no ambiente atual |
| **Credenciais** | Nenhuma |
| **Cuidados** | Validar decisões críticas na documentação oficial |

---

### 1.2 MCPs recomendados após a base funcional

#### Vercel MCP
| Item | Detalhe |
|---|---|
| **Finalidade** | Deploys, previews, logs, variáveis de ambiente e troubleshooting |
| **Fase de uso** | Fase 9 (deploy) |
| **Já instalado?** | Verificar: `claude mcp list` |
| **Como instalar** | Plugin oficial do Vercel para Claude Code |
| **Credenciais** | Vercel API Token |
| **Cuidados** | Configurar apenas quando Vercel estiver escolhido como plataforma |

#### Sentry MCP
| Item | Detalhe |
|---|---|
| **Finalidade** | Diagnóstico de erros reais após deploy |
| **Fase de uso** | Fase 8–9 (staging/produção) |
| **Já instalado?** | A verificar |
| **Como instalar** | Verificar disponibilidade no registro de MCPs |
| **Credenciais** | Sentry Auth Token |
| **Cuidados** | Instalar somente após staging estar ativo |

---

### 1.3 Regra de segurança para MCPs (do Plano Consolidado)

> - Conectar **somente o MCP necessário para a etapa atual**
> - Usar tokens com **menor escopo possível**
> - Separar ambientes: desenvolvimento, staging e produção
> - **Revisar manualmente** qualquer ação que altere banco, deploy, permissões ou código de produção

---

## 2. Skills recomendadas

### 2.1 Skills essenciais para o projeto

| Skill | Finalidade | Status no ambiente atual |
|---|---|---|
| `frontend-design` | Criar interfaces profissionais — UI, componentes, layouts | ✅ Disponível |
| `everything-claude-code:e2e` ou `webapp-testing` | Apoio a testes com Playwright | ✅ Disponível (`everything-claude-code:e2e`) |
| `vercel:nextjs` | Boas práticas de Next.js App Router, metadata, sitemap | ✅ Disponível |
| `vercel:react-best-practices` | Composição, performance e boas práticas React | ✅ Disponível |
| `vercel:shadcn` | Uso correto do shadcn/ui no projeto | ✅ Disponível |
| `vercel:vercel-functions` | Rotas de API, server actions, Edge | ✅ Disponível |
| `vercel:vercel-storage` | Supabase e storage via Vercel | ✅ Disponível |
| `everything-claude-code:security-review` | Revisão de segurança antes de deploy | ✅ Disponível |
| `everything-claude-code:tdd` | Desenvolvimento orientado a testes | ✅ Disponível |
| **RC2 Brand System Skill** | Identidade RC2 como regra operacional para o Claude Code | ❌ **Ainda não existe — precisa ser criada** |

### 2.2 Skills de apoio recomendadas

| Skill | Finalidade |
|---|---|
| `anthropic-skills:ui-ux-pro-max` | Design system avançado e heurísticas de UX |
| `everything-claude-code:skill-create` | Criar a RC2 Brand System Skill |
| `everything-claude-code:frontend-patterns` | Padrões de front-end |
| `design:design-system` | Sistema de design |
| `design:accessibility-review` | Revisão de acessibilidade |
| `everything-claude-code:database-migrations` | Migrations do Supabase |
| `everything-claude-code:security-scan` | Scan de segurança |

---

## 3. RC2 Brand System Skill — a criar

> Esta é a skill mais importante para o projeto. Deve ser criada **antes da Fase 2**.
> Objetivo: transformar o Brand Guide v2.1 em regras operacionais para o Claude Code.

**Conteúdo mínimo da skill:**

```markdown
# RC2 Brand System

## Paleta de cores
- Warm Base: #F7F5F1 (fundo principal)
- Warm Alt: #FBFAF8 (fundo alternativo)
- Surface White: #FFFFFF (cards, inputs, modais e superfícies elevadas; nunca fundo de página)
- Navy Core: #081827 (footer, CTA bands e seções escuras principais)
- Navy Secondary: #0C2032 (seções escuras secundárias)
- Navy Elevated: #11283A (superfície elevada em contexto dark)
- Graphite Navy: #0B1726 (títulos e texto sobre Safety Orange)
- Body Slate: #24313D (texto principal)
- Muted Slate: #66717D (texto secundário)
- Safety Orange: #FF5F1F (CTA, ícones de ação, indicadores e estados ativos; máximo 10%)
- Orange Text: #C2410C (links, labels e microtextos em fundo claro)
- Accent Soft: #FFF0E9 (badges e highlights suaves)
- PROIBIDO: verde estrutural, azul saturado, roxo, ciano, neon e gradientes coloridos

## Tipografia (Barlow — Google Fonts)
- Display: Barlow Condensed ExtraBold 800 | uppercase | tracking +0.04em
- H1: Barlow Bold 700 | tracking -0.02em
- H2: Barlow SemiBold 600 | tracking -0.01em
- H3: Barlow Medium 500
- Body: Barlow Regular 400 | 14-16px | line-height 1.7
- Labels: Barlow Condensed Medium | uppercase | letter-spacing +0.10em
- NUNCA usar #000000 para texto — usar #0B1726 para títulos ou #24313D para corpo

## CTA e botões
- Primário: fundo #FF5F1F, texto #0B1726, Barlow Bold
- Secundário: outline, borda #AEB7BF ou token equivalente, texto #0B1726
- CTA principal: "Solicitar diagnóstico" (consistente em todas as páginas)
- CTA secundário: "Falar pelo WhatsApp"

## Tom de voz
- Especialista confiável — parceiro, não fornecedor
- Sem hype, sem "revolução", sem "disruptivo"
- Usar: automatizar, implementar, integrar, operação, processo, resultado
- Evitar: chatbot (usar "agente de IA"), sistema (usar "solução"), barato (usar "acessível")

## O que evitar na UI
- Fundo branco puro (#FFFFFF) como página — usar #F7F5F1; branco fica reservado para cards e inputs
- Gradientes coloridos
- Ícones de robôs, cérebros digitais ou chips
- Layouts sobrecarregados
- Tipografias além de Barlow

## Proporção de layout
60–70% neutros claros · 20–30% Navy / Slate · até 10% Safety Orange e derivados
```

**Como criar:**
1. Usar a skill `everything-claude-code:skill-create` para gerar a skill com base no Brand Guide v2.1
2. Salvar em `C:\Users\rsaze\.claude\plugins\cache\` ou local equivalente
3. Testar carregando com: `Skill("rc2-brand-system")`

---

## 4. Contas externas necessárias

| Serviço | URL | Tier | Status | Observação |
|---|---|---|---|---|
| GitHub | github.com | Free | A verificar | Repositório do projeto |
| Supabase | supabase.com | Free | A verificar | Banco, Auth, Storage |
| Vercel | vercel.com | Free | A verificar | Deploy |
| Sentry | sentry.io | Free (5K erros/mês) | A verificar | Monitoramento |
| Umami | umami.is | Free tier (cloud) ou self-hosted gratuito | **Confirmado** | Substituiu Plausible por decisão do usuário |
| Google Search Console | search.google.com/search-console | Gratuito | A verificar | SEO |
| Cloudflare Turnstile | dash.cloudflare.com/turnstile | Gratuito | **Confirmado** | Anti-spam do formulário |
| Resend | resend.com | Free até 3K e-mails/mês | **Confirmado** | Notificação de novos leads |

---

## 5. Dependências Node.js do projeto

### Produção
```bash
npm install @supabase/supabase-js @supabase/ssr
npm install zod react-hook-form @hookform/resolvers
```

### Desenvolvimento
```bash
npm install -D @playwright/test vitest @types/node
npx playwright install
```

### shadcn/ui (inicialização)
```bash
npx shadcn@latest init
```

---

## 6. Verificação do ambiente atual

Para verificar MCPs instalados, execute no terminal do Claude Code:
```
/mcp
```
ou consulte as configurações em `Settings → MCP Servers`.

Para listar Skills disponíveis, consulte o painel de Skills do Claude Code.

---

## 7. Passo a passo para contas que exigem configuração manual

### Supabase (dev)
1. Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita
2. Crie um novo projeto (nome sugerido: `rc2-site-dev`)
3. Anote: `Project URL`, `anon key`, `service role key`
4. Crie arquivo `.env.local` na raiz do projeto com:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxx
SUPABASE_SERVICE_ROLE_KEY=xxxx
```
5. **NUNCA** commitar `.env.local`

### Cloudflare Turnstile
1. Acesse [dash.cloudflare.com](https://dash.cloudflare.com) e crie uma conta gratuita
2. Vá em "Turnstile" e crie um novo site
3. Anote: `Site Key` (público) e `Secret Key` (privado)
4. Adicione ao `.env.local`:
```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=xxxx
TURNSTILE_SECRET_KEY=xxxx
```

### hCaptcha (alternativa ao Turnstile)
1. Acesse [hcaptcha.com](https://hcaptcha.com) e crie uma conta gratuita
2. Obtenha `Site Key` e `Secret Key`
3. Adicione ao `.env.local`

### Sentry
1. Acesse [sentry.io](https://sentry.io) e crie uma conta (free tier)
2. Crie projeto Next.js
3. Instale o SDK: `npm install @sentry/nextjs`
4. Execute `npx @sentry/wizard@latest -i nextjs`
5. Adicione `SENTRY_DSN` ao `.env.local` e ao Vercel

### Resend (e-mail para leads)
1. Acesse [resend.com](https://resend.com) e crie uma conta (gratuito até 3K e-mails/mês)
2. Verifique o domínio `rc2solucoes.com.br` ou use e-mail Resend padrão
3. Obtenha `API Key` e adicione ao `.env.local`
