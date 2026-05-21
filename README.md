# RC2 Soluções — Site Institucional

Site institucional da RC2 Soluções, consultoria especializada em IA, automações e operações digitais para PMEs.

**URL:** https://rc2solucoes.com.br  
**Admin:** https://rc2solucoes.com.br/admin

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack, TypeScript) |
| Estilo | Tailwind CSS v4 + shadcn/ui |
| Banco / Auth | Supabase (Postgres + Auth) |
| Deploy | Vercel |
| Anti-spam | Cloudflare Turnstile |
| E-mail | Resend |
| Analytics | Umami |
| Monitoramento | Sentry |
| Testes | Playwright (E2E) + Vitest (unitários) |

---

## Início rápido

```bash
# 1. Clonar e instalar
git clone https://github.com/rsazevedo82/rcc-02-site.git
cd rcc-02-site
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais

# 3. Aplicar migrations no Supabase
# Execute manualmente no SQL Editor do Supabase:
# supabase/migrations/001_leads.sql
# supabase/migrations/002_posts_settings.sql

# 4. Rodar em desenvolvimento
npm run dev
```

Acesse http://localhost:3000

---

## Scripts

```bash
npm run dev          # Servidor de desenvolvimento (Turbopack)
npm run build        # Build de produção
npm run start        # Servidor de produção local
npm run lint         # ESLint
npm run typecheck    # TypeScript sem emitir arquivos
npm run test         # Testes unitários (Vitest)
npm run test:e2e     # Testes E2E (Playwright, requer servidor rodando)
npm run test:e2e:ui  # Playwright com interface visual
npm run check        # typecheck + lint + test (ideal para CI)
```

---

## Variáveis de ambiente

Veja `.env.example` para a lista completa. Variáveis obrigatórias:

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service role (só servidor) |
| `IP_SALT` | Salt para anonimização de IPs (gere com `openssl rand -hex 16`) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Site key do Cloudflare Turnstile |
| `TURNSTILE_SECRET_KEY` | Secret key do Cloudflare Turnstile |
| `RESEND_API_KEY` | API key do Resend para e-mails |

Variáveis com valor `xxxx` são ignoradas silenciosamente — o sistema funciona em dev sem elas.

---

## Estrutura principal

```
src/
├── app/
│   ├── (public)/          # Páginas públicas com Header + Footer
│   │   ├── page.tsx        # Home
│   │   ├── servicos/       # Listagem e páginas individuais de serviços
│   │   ├── solucoes-com-ia/
│   │   ├── sobre/
│   │   ├── blog/           # Listagem e posts individuais
│   │   └── contato/
│   ├── admin/              # CMS protegido por autenticação
│   │   ├── page.tsx        # Login
│   │   └── (protected)/    # Dashboard, Posts, Leads, Configurações
│   └── api/contact/        # API route do formulário de contato
├── components/
│   ├── layout/             # Header, Footer, Logo
│   ├── marketing/          # PageHero, ServiceCard, CTABlock, ContactForm...
│   ├── admin/              # AdminSidebar, RichEditor, PostForm...
│   └── ui/                 # SectionLabel, Breadcrumb
├── lib/
│   ├── content/services.ts # Copy dos 5 serviços (hardcoded)
│   ├── supabase/           # Clientes browser, server e service-role
│   ├── types/              # Post, Lead
│   └── validations/        # Zod schemas
└── proxy.ts                # Proteção de rotas /admin/* (Next.js 16)
```

---

## Banco de dados

Duas migrations em `supabase/migrations/`:

| Migration | Tabelas |
|---|---|
| `001_leads.sql` | `leads` — solicitações do formulário de contato |
| `002_posts_settings.sql` | `posts` — blog CMS; `settings` — configurações do site |

---

## Deploy

Veja [`docs/DEPLOY.md`](docs/DEPLOY.md) para o guia completo incluindo rollback.

Resumo rápido:
```bash
npm i -g vercel
vercel login
vercel --prod
```

---

## Documentação

| Arquivo | Conteúdo |
|---|---|
| [`docs/DEPLOY.md`](docs/DEPLOY.md) | Guia de deploy, variáveis de ambiente e rollback |
| [`docs/CMS_GUIDE.md`](docs/CMS_GUIDE.md) | Guia do administrador (posts, leads, configurações) |
| [`docs/SEO_CHECKLIST.md`](docs/SEO_CHECKLIST.md) | Checklist de SEO técnico e pós-deploy |
| [`docs/BLOG_SEO_PLAYBOOK.md`](docs/BLOG_SEO_PLAYBOOK.md) | Diretrizes editoriais de SEO para novos artigos do blog |
| [`docs/BLOG_PUBLICATION_CHECKLIST.md`](docs/BLOG_PUBLICATION_CHECKLIST.md) | Checklist operacional para publicação de posts |
| [`docs/BLOG_INTERNAL_LINKING_GUIDE.md`](docs/BLOG_INTERNAL_LINKING_GUIDE.md) | Matriz de interlinking entre clusters editoriais e serviços |
| [`docs/BLOG_CMS_FIELDS_GUIDE.md`](docs/BLOG_CMS_FIELDS_GUIDE.md) | Guia de preenchimento dos campos do CMS de posts |
| [`docs/SOLUTIONS_PAGES_GUIDE.md`](docs/SOLUTIONS_PAGES_GUIDE.md) | Guia das páginas de soluções por dor/problema |
| [`docs/02-plano-fases-execucao.md`](docs/02-plano-fases-execucao.md) | Fases 0–9 do projeto |
| [`docs/03-backlog-tecnico.md`](docs/03-backlog-tecnico.md) | Backlog técnico completo |
