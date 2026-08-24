# 03 — Backlog Técnico

> Checklist técnico completo, organizado por prioridade.
> Baseado no Plano Consolidado e no mapeamento de requisitos.
> Marque cada item com `[x]` quando concluído.

---

## Prioridade Alta (bloqueantes ou MVP crítico)

### Setup e fundação
- [ ] Resolver todos os bloqueadores de decisão (D1–D10 em `01-mapeamento-requisitos.md`)
- [ ] Criar repositório GitHub `rc2-site`
- [ ] Inicializar projeto Next.js + TypeScript + Tailwind + ESLint + App Router
- [ ] Instalar e configurar shadcn/ui
- [ ] Instalar dependências: `@supabase/supabase-js`, `@supabase/ssr`, `zod`, `react-hook-form`, `@hookform/resolvers`
- [ ] Instalar dependências de dev: `@playwright/test`, `vitest`, `@types/node`
- [ ] Criar estrutura de pastas conforme `Plano_Consolidado_RC2_Site_Institucional_Blog_CMS.docx` (seção 18)
- [ ] Criar `README.md` com contexto do projeto
- [ ] Criar `ARCHITECTURE.md` com diagrama de arquitetura
- [ ] Criar `docs/MASTER.md` com regras de design, código e conteúdo
- [ ] Criar `docs/CONTENT_MODEL.md`
- [ ] Criar `.env.example` com todas as variáveis necessárias
- [ ] Criar projeto no Supabase (ambiente dev)
- [ ] Configurar variáveis de ambiente no `.env.local`
- [ ] Primeiro commit e push para GitHub

### Design system
- [ ] Configurar tokens de cor RC2 no `tailwind.config.ts` conforme `documentos-base/RC2_Brand_Guide_v2.1.md`: Warm Base `#F7F5F1`, Warm Alt `#FBFAF8`, Surface White `#FFFFFF`, família Navy / Slate (`#081827`, `#0C2032`, `#11283A`, `#0B1726`, `#24313D`, `#66717D`) e Safety Orange `#FF5F1F` com Orange Text `#C2410C`
- [ ] Configurar fonte Barlow (Google Fonts — pesos 300, 400, 500, 600, 700, 800 + Condensed)
- [ ] Configurar escala tipográfica no Tailwind (Display, H1, H2, H3, Body, Label, Caption)
- [ ] Criar componente `<Button>` com variantes: primário (Safety Orange), secundário (outline), ghost
- [ ] Criar componente `<SectionLabel>` (eyebrow uppercase, letter-spacing generoso)
- [ ] Criar componente `<Logo>` com variantes (claro, escuro, monocromático)
- [ ] Implementar `<Header>` com menu de navegação e CTA "Solicitar diagnóstico" destacado
- [ ] Implementar `<Footer>` com links, redes sociais e aviso LGPD
- [ ] Validar contraste WCAG AA para todas as combinações de cor
- [ ] Criar página 404 (`not-found.tsx`) com design RC2

### Páginas públicas
- [ ] Implementar Home (`/`) com Hero, Para quem é, O que entregamos, Diferencial, CTA final
- [ ] Implementar Serviços (`/servicos`) com listagem dos 5 serviços
- [ ] Implementar 5 páginas individuais de serviço (`/servicos/[slug]`) com texto completo do copy
- [ ] Implementar Soluções com IA (`/solucoes-com-ia`) com 4 blocos + CTA
- [ ] Implementar Sobre (`/sobre`) com texto institucional e método em 5 etapas
- [ ] Implementar Contato (`/contato`) com formulário (UI + backend)
- [ ] Configurar `<metadata>` em cada página (title, description únicos)
- [ ] Configurar Open Graph padrão e por página
- [ ] Adicionar Schema.org Organization e WebSite no layout raiz

### Formulário e leads
- [ ] Criar migration Supabase para tabela `leads`
- [ ] Configurar RLS na tabela `leads`
- [ ] Criar rota de API `/api/contact` com validação Zod server-side
- [ ] Implementar rate limiting na rota de API
- [ ] Integrar anti-spam (Turnstile ou hCaptcha) no formulário
- [ ] Adicionar honeypot field
- [ ] Configurar notificação por e-mail ao receber lead
- [ ] Feedback visual de sucesso/erro no formulário

### Supabase e schema
- [ ] Criar migrations para: `posts`, `pages`, `services`, `leads`, `settings`
- [ ] Configurar RLS para cada tabela
- [ ] Configurar Supabase Auth (usuário admin inicial)
- [ ] Configurar Supabase Storage (bucket para imagens)

### Área administrativa
- [ ] Implementar middleware de proteção para `/admin/*`
- [ ] Implementar tela de login (`/admin`)
- [ ] Implementar Dashboard com resumo básico
- [ ] Implementar CRUD de posts (criar, editar, publicar, arquivar, excluir)
- [ ] Implementar editor rico para conteúdo de posts (TipTap ou similar)
- [ ] Implementar upload de imagem (cover) para Supabase Storage
- [ ] Implementar CRUD de serviços
- [ ] Implementar edição de páginas institucionais
- [ ] Implementar visualização de leads
- [ ] Implementar settings básicos (e-mail, redes sociais, OG)

### Blog público
- [ ] Implementar listagem de posts publicados (`/blog`)
- [ ] Implementar post individual (`/blog/[slug]`) com renderização do conteúdo
- [ ] Configurar metadata dinâmica por post
- [ ] Adicionar Schema.org BlogPosting

### SEO técnico
- [ ] Gerar `sitemap.xml` automático (incluindo posts e serviços)
- [ ] Criar `robots.txt` bloqueando `/admin`
- [ ] Implementar URLs canônicas
- [ ] Adicionar Schema.org Service nas páginas de serviço
- [ ] Adicionar Schema.org BreadcrumbList nas páginas internas
- [ ] Validar alt text em todas as imagens

### Segurança
- [ ] Configurar CSP nos headers do `next.config.ts`
- [ ] Configurar HSTS
- [ ] Validar que todos os secrets estão no `.env.local` (nunca no código)
- [ ] Configurar rate limit nas rotas de API
- [ ] Rodar Semgrep ou Snyk — corrigir bloqueadores críticos

### Testes
- [ ] Criar teste Playwright: navegação entre páginas na Home
- [ ] Criar teste Playwright: menu mobile (abrir, fechar, navegar)
- [ ] Criar teste Playwright: formulário de contato (submit válido, campos inválidos)
- [ ] Criar teste Playwright: login no admin (sucesso e falha)
- [ ] Criar teste Playwright: criar e publicar post no admin
- [ ] Criar teste Playwright: visualizar lead no admin
- [ ] Configurar Vitest para testes unitários de utilitários e validações

### Deploy
- [ ] Criar projeto no Vercel e vincular ao repositório GitHub
- [ ] Configurar variáveis de ambiente no Vercel (staging)
- [ ] Configurar preview deploys por branch/PR
- [ ] Validar Lighthouse no preview/staging
- [ ] Configurar domínio no Vercel (produção)
- [ ] Deploy em produção
- [ ] Documentar processo de rollback

---

## Prioridade Média (importante mas não bloqueante imediatamente)

### Monitoramento e analytics
- [ ] Configurar Sentry (error tracking)
- [ ] Configurar Plausible ou Umami (analytics)
- [ ] Configurar Google Search Console e submeter sitemap
- [ ] Implementar auditoria básica de eventos no admin (login, alterações)

### Performance
- [ ] Otimizar todas as imagens para WebP/AVIF
- [ ] Implementar `<Image>` do Next.js em todas as imagens
- [ ] Auditar e eliminar JavaScript desnecessário no client
- [ ] Preload de fontes Barlow críticas
- [ ] Atingir Lighthouse Performance 90+ nas páginas principais

### Acessibilidade
- [ ] Auditar navegação por teclado em todos os formulários e menus
- [ ] Adicionar skip links para conteúdo principal
- [ ] Validar com axe-playwright nas páginas críticas
- [ ] Atingir Lighthouse Acessibilidade 90+

### Páginas legais
- [ ] Implementar Política de Privacidade (`/privacidade`) — aguardar texto final ou usar template legal
- [ ] Implementar Termos de Uso (`/termos`) — aguardar texto final ou usar template legal
- [ ] Implementar banner/aviso de cookies (se necessário para LGPD)
- [ ] Página de erro 500 (`error.tsx`)

### Documentação
- [ ] Criar `docs/CMS_GUIDE.md` para o administrador
- [ ] Criar `docs/SEO_CHECKLIST.md`
- [ ] Criar `docs/SECURITY.md`
- [ ] Atualizar `CHANGELOG.md` a cada fase

### Skills e ambiente
- [ ] Criar RC2 Brand System Skill com: paleta, tipografia, grid, CTAs, tom de voz, proibições
- [ ] Instalar e configurar GitHub MCP
- [ ] Instalar e configurar Playwright MCP
- [ ] Instalar e configurar Supabase MCP
- [ ] Instalar e configurar Context7 MCP
- [ ] Instalar e configurar Vercel MCP (após deploy configurado)
- [ ] Atualizar `CLAUDE.md` com contexto completo do projeto

---

## Prioridade Baixa (pós-MVP ou melhorias incrementais)

- [ ] Configurar Sentry MCP (após staging/produção)
- [ ] Configurar Semgrep ou Snyk no CI/CD (GitHub Actions)
- [ ] Implementar página de busca no blog
- [ ] Implementar tags ou categorias no blog
- [ ] Implementar paginação no blog e listagem de serviços
- [ ] Adicionar GA4 se houver mídia paga ou funil avançado
- [ ] Criar Storybook de componentes (opcional, pós-MVP)
- [ ] Testes de regressão visual com Playwright (screenshots)
- [ ] Configurar backup/export de conteúdo do Supabase
- [ ] Avaliar migração para CMS mais robusto (Payload/Sanity) quando admin próprio virar gargalo
- [ ] Preparar estrutura para múltiplos administradores (RBAC no Supabase)
- [ ] Preparar estrutura para área logada de clientes
- [ ] Preparar integração com n8n para automações

---

## Pendências bloqueadas por decisão humana

> ✅ Todas resolvidas em 2026-05-01.

- [x] **D1** — Logo: tratar `logo-base.png` como **placeholder** até aprovação do logo Signal Interrupt final
- [x] **D2** — WhatsApp: **11988028550** → link `https://wa.me/5511988028550`
- [x] **D3** — Domínio `rc2solucoes.com.br`: **registrado, DNS sob controle do usuário** — apontar para Vercel na Fase 9
- [x] **D4** — Analytics: **Umami** (https://umami.is/)
- [x] **D5** — "Soluções com IA": **incluir no menu** e como rota `/solucoes-com-ia`
- [x] **D6** — Pacotes: **incorporados na página de Serviços**
- [x] **D7** — Repositório GitHub: **https://github.com/rsazevedo82/rcc-02-site**
- [x] **D8** — Anti-spam: **Cloudflare Turnstile**
- [x] **D9** — E-mail de leads: **Resend** (resend.com)
- [x] **D10** — Textos legais: **gerados pelo Claude Code** — ver `docs/06-politica-privacidade.md` e `docs/07-termos-de-uso.md`
