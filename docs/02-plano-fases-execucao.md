# 02 — Plano de Fases de Execução

> Baseado integralmente no "Plano_Consolidado_RC2_Site_Institucional_Blog_CMS.docx".
> Nenhum escopo foi adicionado além do que está na documentação.

---

## Fase 0 — Diagnóstico e preparação do ambiente

**Objetivo:** Validar decisões, configurar contas externas, criar repositório e estruturar o projeto antes de escrever qualquer código.

**Entregáveis:**
- Contas externas configuradas (Supabase, Vercel, GitHub, Sentry, Plausible/Umami)
- Repositório criado e configurado
- Variáveis de ambiente documentadas em `.env.example`
- MCPs instalados e testados
- RC2 Brand System Skill criada
- Decisões de bloqueadores resolvidas (D1–D10 do mapeamento)

**Tarefas técnicas:**
- [ ] Confirmar e resolver todos os 10 itens de decisão pendente (ver `01-mapeamento-requisitos.md`, seção 14)
- [ ] Criar ou confirmar repositório GitHub (nome: `rc2-site` ou similar)
- [ ] Criar projeto no Supabase (dev)
- [ ] Criar projeto no Vercel e vincular ao repositório
- [ ] Criar conta/configurar Sentry
- [ ] Confirmar analytics: Plausible ou Umami auto-hospedado
- [ ] Criar conta Cloudflare Turnstile ou hCaptcha
- [ ] Verificar e instalar MCPs: GitHub, Playwright, Supabase, Context7
- [ ] Criar a RC2 Brand System Skill (baseada no `documentos-base/RC2_Brand_Guide_v2.1.md`)
- [ ] Documentar tokens de acesso no gerenciador de senhas (nunca no código)
- [ ] Criar arquivo `.env.example` com todas as variáveis necessárias

**Arquivos afetados:**
- `CLAUDE.md` (atualizar com contexto do projeto)
- `.env.example`
- `docs/05-ambiente-mcps-skills.md`

**Dependências:** Nenhuma (é a fase inicial)

**Critérios de aceite:**
- [ ] Todos os bloqueadores de decisão respondidos
- [ ] Repositório acessível e MCPs conectados
- [ ] `.env.example` documentado
- [ ] RC2 Brand System Skill carregável no Claude Code

**Riscos:**
- Plausible exige pagamento após trial — definir substituto gratuito se necessário
- Domínio pode não estar registrado — bloqueia DNS na produção
- Número de WhatsApp ausente — bloqueia CTA secundário

**Perguntas pendentes:** Ver seção 14 de `01-mapeamento-requisitos.md`

---

## Fase 1 — Estrutura inicial do projeto

**Objetivo:** Criar o projeto Next.js com toda a base técnica configurada e documentação inicial.

**Entregáveis:**
- Projeto Next.js inicializado com TypeScript, Tailwind, ESLint
- shadcn/ui instalado e configurado
- Estrutura de pastas conforme arquitetura definida
- Documentação inicial: README, ARCHITECTURE, CHANGELOG
- Primeiras issues no GitHub criadas por funcionalidade

**Tarefas técnicas:**
```bash
npx create-next-app@latest rc2-site --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd rc2-site
npx shadcn@latest init
npm install @supabase/supabase-js @supabase/ssr zod react-hook-form @hookform/resolvers
npm install -D @playwright/test vitest @types/node
npx playwright install
```
- [ ] Criar estrutura de pastas (ver `Estrutura sugerida de arquivos` no Plano Consolidado)
- [ ] Configurar ESLint + Prettier + TypeScript strict mode
- [ ] Criar `README.md`, `ARCHITECTURE.md`, `CHANGELOG.md`
- [ ] Criar `docs/MASTER.md` com regras de design, código e conteúdo
- [ ] Criar `docs/CONTENT_MODEL.md`
- [ ] Configurar `.env.local` com variáveis do Supabase (desenvolvimento)
- [ ] Criar issues no GitHub por funcionalidade (baseadas no backlog)
- [ ] Primeiro commit e push

**Arquivos afetados:**
- Todo o projeto (criação)

**Dependências:** Fase 0 concluída

**Critérios de aceite:**
- [ ] `npm run dev` executa sem erros
- [ ] `npm run build` passa
- [ ] `npm run lint` sem erros
- [ ] `npx tsc --noEmit` passa
- [ ] Estrutura de pastas criada
- [ ] Documentação base criada

**Riscos:**
- shadcn/ui pode ter opiniões sobre tokens que conflitem com a paleta RC2 — ajustar após instalação

---

## Fase 2 — Design system e fundamentos visuais

**Objetivo:** Implementar a identidade visual RC2 como sistema de design funcional no projeto.

**Entregáveis:**
- Tokens de cor, tipografia, espaçamento e grid no Tailwind
- Componentes base criados e validados visualmente
- RC2 Brand System Skill guiando todas as decisões visuais

**Tarefas técnicas:**
- [x] Configurar tokens de cor no `tailwind.config.ts` (paleta RC2 completa)
- [x] Configurar fonte Barlow (Google Fonts ou local — preferir local para performance)
- [x] Configurar escala tipográfica (Display, H1, H2, H3, Body, Label, Caption)
- [x] Configurar espaçamentos e grid RC2
- [x] Criar componente `<Button>` (primário Safety Orange, secundário outline)
- [x] Criar componente `<SectionLabel>` (eyebrow uppercase)
- [x] Criar componente `<Logo>` com as variações do Brand Guide
- [x] Implementar `<Header>` com menu e CTA destacado
- [x] Implementar `<Footer>` com links, redes e LGPD
- [x] Criar página 404 (`not-found.tsx`)
- [x] Validar contraste de cores (WCAG AA)
- [x] Validar responsividade (mobile, tablet, desktop)

**Ferramentas:**
- RC2 Brand System Skill
- `frontend-design` skill
- `taste-skill`

**Arquivos afetados:**
- `tailwind.config.ts`
- `src/app/globals.css`
- `src/components/ui/`
- `src/components/layout/`
- `src/app/not-found.tsx`

**Dependências:** Fase 1

**Critérios de aceite:**
- [x] Tokens RC2 aplicados e funcionando no Tailwind
- [x] Header e Footer renderizando corretamente em mobile e desktop
- [x] Contraste WCAG AA validado
- [x] Lighthouse Acessibilidade 90+ no layout base
- [x] Lint e typecheck passando

**Riscos:**
- Logo fornecido pode não ser o Signal Interrupt final — usar provisoriamente e substituir quando confirmado

---

## Fase 3 — Páginas públicas institucionais

**Objetivo:** Implementar todas as páginas públicas do site com o copy completo dos documentos-base.

**Entregáveis:**
- Home completa
- Página de Serviços (listagem + individuais)
- Página Soluções com IA
- Sobre a RC2
- Contato / Diagnóstico (sem backend ainda)
- Páginas legais (Privacidade, Termos)
- Página de erro 500

**Tarefas técnicas:**
- [ ] Implementar Home (`/`) — Hero, Para quem é, O que entregamos, Diferencial, CTA
- [ ] Implementar Serviços (`/servicos`) — listagem dos 5 serviços com cards
- [ ] Implementar páginas individuais de serviço (`/servicos/[slug]`) — texto completo do copy
- [ ] Implementar Soluções com IA (`/solucoes-com-ia`) — 4 blocos + CTA
- [ ] Implementar Sobre (`/sobre`) — texto institucional + método em 5 etapas
- [ ] Implementar Contato (`/contato`) — formulário (UI apenas, sem submit por enquanto)
- [ ] Implementar Privacidade (`/privacidade`) — aguardar texto ou usar placeholder legal
- [ ] Implementar Termos (`/termos`) — aguardar texto ou usar placeholder legal
- [ ] Implementar página de erro (`error.tsx`)
- [ ] Configurar metadata (title, description, OG) para cada página
- [ ] Adicionar Schema.org Organization e WebSite no layout raiz

**Ferramentas:**
- RC2 Brand System Skill
- `frontend-design` skill
- `next-best-practices` / `vercel:nextjs`

**Arquivos afetados:**
- `src/app/(public)/` e subpastas
- `src/components/marketing/`

**Dependências:** Fase 2

**Critérios de aceite:**
- [ ] Todas as páginas renderizando com o copy correto
- [ ] Mobile First validado em cada página
- [ ] Metadata configurada em todas as páginas
- [ ] Playwright: navegação básica entre páginas funcionando
- [ ] Lighthouse Performance 90+, SEO 90+ em pelo menos Home e Serviços
- [ ] Lint e typecheck passando

**Riscos:**
- Textos de Privacidade e Termos não fornecidos — usar placeholder com aviso legal temporário

---

## Fase 4 — Formulário de contato e captação de leads

**Objetivo:** Implementar o formulário de contato com validação, anti-spam, rate limit e persistência de leads.

**Entregáveis:**
- Formulário funcionando com validação completa
- Leads gravados no Supabase
- Notificação por e-mail ao receber lead
- Proteção anti-spam ativa

**Tarefas técnicas:**
- [ ] Criar tabela `leads` no Supabase com RLS
- [ ] Criar rota de API (`/api/contact`) com validação server-side (Zod)
- [ ] Implementar rate limiting na rota de API
- [ ] Integrar Cloudflare Turnstile ou hCaptcha no formulário
- [ ] Adicionar honeypot field
- [ ] Configurar notificação por e-mail (via Supabase Edge Function ou Resend/SMTP)
- [ ] Validação client-side com react-hook-form + Zod
- [ ] Feedback visual de sucesso/erro para o usuário
- [ ] Testar com Playwright: submit válido, submit inválido, spam attempt

**Arquivos afetados:**
- `src/app/contato/`
- `src/app/api/contact/`
- `src/components/marketing/ContactForm.tsx`
- `supabase/migrations/`

**Dependências:** Fase 3, Supabase configurado

**Critérios de aceite:**
- [ ] Formulário valida todos os campos corretamente
- [ ] Lead gravado no Supabase após submit válido
- [ ] Notificação de e-mail recebida
- [ ] Anti-spam ativo e funcionando
- [ ] Rate limit impedindo abuso
- [ ] RLS impedindo acesso não autorizado
- [ ] Playwright cobrindo fluxos de sucesso e erro

**Riscos:**
- Provedor de e-mail SMTP não definido — pode bloquear notificações

---

## Fase 5 — CMS e área administrativa

**Objetivo:** Implementar o admin protegido com CRUD completo para posts, páginas, serviços, leads e settings.

**Entregáveis:**
- Login admin seguro (Supabase Auth)
- Dashboard simples
- CRUD de posts (com editor rico, rascunho/publicado/arquivado)
- CRUD de serviços
- Edição de páginas institucionais
- Visualização de leads
- Configurações básicas do site
- Upload/gestão de imagens via Supabase Storage

**Tarefas técnicas:**
- [ ] Criar schema completo no Supabase: `posts`, `pages`, `services`, `leads`, `settings`
- [ ] Configurar RLS para cada tabela
- [ ] Configurar Supabase Auth (1 usuário admin inicial)
- [ ] Implementar middleware de proteção para `/admin/*`
- [ ] Implementar tela de login (`/admin`)
- [ ] Implementar Dashboard (`/admin/dashboard`)
- [ ] Implementar CRUD de posts com editor rico (TipTap ou similar)
- [ ] Implementar upload de cover image para Supabase Storage
- [ ] Implementar CRUD de serviços
- [ ] Implementar edição de páginas institucionais
- [ ] Implementar visualização de leads com filtros básicos
- [ ] Implementar settings (contact_email, redes sociais, og_image)
- [ ] Registrar eventos básicos de auditoria (login, alteração de conteúdo)

**Arquivos afetados:**
- `src/app/admin/`
- `src/components/admin/`
- `supabase/migrations/`
- `src/lib/supabase/`

**Dependências:** Fase 4, Supabase totalmente configurado

**Critérios de aceite:**
- [ ] Login funcional e seguro
- [ ] CRUD de posts completo (criar, editar, publicar, arquivar, excluir)
- [ ] Upload de imagem funcionando
- [ ] Leads visíveis no admin
- [ ] Settings editáveis e refletidos no site
- [ ] Acesso sem autenticação resulta em redirect para login
- [ ] RLS validado no Supabase
- [ ] Playwright cobrindo login e publicação de post

**Riscos:**
- Editor rico (TipTap) pode ter curva de integração — avaliar alternativas simples se necessário

---

## Fase 6 — Blog público

**Objetivo:** Implementar as páginas públicas do blog renderizando conteúdo do Supabase.

**Entregáveis:**
- Listagem de posts publicados (`/blog`)
- Post individual com metadata completa (`/blog/[slug]`)
- Schema BlogPosting no post individual

**Tarefas técnicas:**
- [ ] Implementar listagem de posts publicados (`/blog`)
- [ ] Implementar post individual (`/blog/[slug]`) com renderização do conteúdo rico
- [ ] Configurar metadata (title, description, OG) dinâmicos por post
- [ ] Adicionar Schema.org BlogPosting
- [ ] Adicionar sitemap dinâmico incluindo posts
- [ ] Validar SEO técnico no post individual
- [ ] Validar responsividade e leiturabilidade do post

**Arquivos afetados:**
- `src/app/(public)/blog/`

**Dependências:** Fase 5 (admin com pelo menos 1 post publicado)

**Critérios de aceite:**
- [ ] Listagem exibe apenas posts com status "publicado"
- [ ] Post individual renderiza conteúdo rico corretamente
- [ ] Metadata dinâmica por post funcionando
- [ ] Sitemap inclui posts
- [ ] Lighthouse SEO 90+ na página de post

---

## Fase 7 — SEO técnico, performance e acessibilidade

**Objetivo:** Garantir que todos os requisitos não funcionais de SEO, performance e acessibilidade sejam atendidos.

**Entregáveis:**
- Lighthouse 90+ em todas as métricas nas páginas principais
- SEO técnico completo
- Acessibilidade WCAG AA nas páginas críticas

**Tarefas técnicas:**
- [ ] Auditar e corrigir metadata em todas as páginas
- [ ] Validar sitemap automático (`/sitemap.xml`)
- [ ] Validar `robots.txt` (bloqueando `/admin`)
- [ ] Validar Open Graph em todas as páginas
- [ ] Implementar Schema.org: Organization, WebSite, Service, BlogPosting, BreadcrumbList
- [ ] Otimizar imagens (WebP/AVIF, lazy loading, tamanhos corretos)
- [ ] Carregar fontes Barlow de forma otimizada (preload/local)
- [ ] Auditar e eliminar JavaScript desnecessário no client
- [ ] Auditar contraste de cores em todas as páginas
- [ ] Auditar navegação por teclado
- [ ] Adicionar skip links para acessibilidade
- [ ] Rodar Lighthouse em Home, Serviços, Blog, Post individual
- [ ] Corrigir todos os itens abaixo de 90

**Ferramentas:**
- Playwright + Lighthouse
- axe-playwright para acessibilidade

**Arquivos afetados:**
- Todos os arquivos de páginas
- `public/`

**Dependências:** Fase 6

**Critérios de aceite:**
- [ ] Lighthouse Performance 90+ nas páginas principais
- [ ] Lighthouse SEO 90+ nas páginas principais
- [ ] Lighthouse Acessibilidade 90+ nas páginas principais
- [ ] Sitemap e robots.txt corretos
- [ ] Schema.org validado no Rich Results Test do Google

---

## Fase 8 — Segurança, testes e homologação

**Objetivo:** Validar segurança, executar testes completos e homologar o sistema em staging antes da produção.

**Entregáveis:**
- Suite de testes Playwright cobrindo fluxos críticos
- Semgrep/Snyk executado sem bloqueadores críticos
- Headers de segurança configurados
- Staging validado e aprovado

**Tarefas técnicas:**
- [ ] Configurar CSP (Content-Security-Policy) nos headers do Next.js
- [ ] Configurar HSTS
- [ ] Validar que todos os secrets estão fora do código
- [ ] Configurar rate limit em todas as rotas de API
- [ ] Rodar Semgrep ou Snyk — corrigir todos os bloqueadores críticos
- [ ] Criar testes Playwright: Home (navegação), menu mobile, formulário de contato (sucesso e erro), login admin, criação e publicação de post, visualização de leads
- [ ] Criar testes Vitest para utilitários e validações
- [ ] Rodar lint + typecheck + testes completos
- [ ] Configurar Sentry
- [ ] Deploy em staging/preview
- [ ] Validação humana completa no staging

**Arquivos afetados:**
- `tests/e2e/`
- `tests/unit/`
- `next.config.ts` (headers)

**Dependências:** Fases 1–7

**Critérios de aceite:**
- [ ] Todos os testes Playwright passando
- [ ] Lint e typecheck limpos
- [ ] Semgrep/Snyk sem bloqueadores críticos
- [ ] Headers de segurança validados (securityheaders.com)
- [ ] Sentry capturando erros corretamente em staging
- [ ] Validação humana aprovada no staging

---

## Fase 9 — Deploy, monitoramento e documentação final

**Objetivo:** Publicar o site em produção com monitoramento ativo e documentação completa.

**Entregáveis:**
- Site publicado em produção no Vercel
- Analytics e monitoramento ativos
- Documentação final completa
- Rollback documentado

**Tarefas técnicas:**
- [ ] Configurar variáveis de ambiente no Vercel (produção)
- [ ] Configurar domínio (`rc2solucoes.com.br`) no Vercel
- [ ] Deploy em produção
- [ ] Configurar Plausible (ou alternativa) apontando para o domínio
- [ ] Configurar Google Search Console e fazer submit do sitemap
- [ ] Validar Sentry em produção
- [ ] Validar Lighthouse em produção (não apenas preview)
- [ ] Testar formulário de contato em produção
- [ ] Testar admin em produção
- [ ] Documentar processo de rollback
- [ ] Atualizar README com instruções de operação
- [ ] Atualizar `docs/CMS_GUIDE.md` para o administrador
- [ ] Atualizar `docs/SEO_CHECKLIST.md`
- [ ] Fechar issues do GitHub referentes ao MVP

**Dependências:** Fase 8 aprovada

**Critérios de aceite:**
- [ ] Site público acessível pelo domínio final
- [ ] Todos os itens do checklist definitivo do MVP marcados (seção 15 do Plano Consolidado)
- [ ] Analytics ativos e recebendo dados
- [ ] Sentry ativo em produção
- [ ] Google Search Console indexando
- [ ] Documentação de operação entregue
- [ ] Rollback documentado e testado

---

## Resumo do roadmap

| Fase | Nome | Estimativa |
|---|---|---|
| 0 | Diagnóstico e preparação | Antes de qualquer código |
| 1 | Estrutura inicial | 1 sessão |
| 2 | Design system | 1–2 sessões |
| 3 | Páginas públicas | 2–3 sessões |
| 4 | Formulário e leads | 1 sessão |
| 5 | CMS e admin | 2–3 sessões |
| 6 | Blog público | 1 sessão |
| 7 | SEO, performance, acessibilidade | 1–2 sessões |
| 8 | Segurança, testes, homologação | 1–2 sessões |
| 9 | Deploy e documentação final | 1 sessão |
