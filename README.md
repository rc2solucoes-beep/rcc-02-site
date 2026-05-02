# RC2 Soluções — Site Institucional

Site institucional da RC2 Soluções, consultoria especializada em IA, automações e operações digitais para PMEs.

**URL:** https://rc2solucoes.com.br
**Repositório:** https://github.com/rsazevedo82/rcc-02-site

---

## Stack

- **Next.js 16** + TypeScript — App Router
- **Tailwind CSS v4** + shadcn/ui — UI e design system
- **Supabase** — Postgres + Auth + Storage
- **Vercel** — Deploy e preview
- **Playwright** + Vitest — Testes E2E e unitários
- **Cloudflare Turnstile** — Anti-spam
- **Resend** — E-mail de notificação de leads
- **Umami** — Analytics (privacidade)
- **Sentry** — Monitoramento de erros

## Comandos

```bash
npm run dev          # servidor local (http://localhost:3000)
npm run build        # build de produção
npm run start        # servidor de produção local
npm run lint         # ESLint
npx tsc --noEmit     # type check
npx playwright test  # testes E2E
npm test             # testes unitários (Vitest)
```

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

## Documentação

- `docs/00-diagnostico-inicial.md` — Análise dos documentos-base
- `docs/01-mapeamento-requisitos.md` — Requisitos por categoria
- `docs/02-plano-fases-execucao.md` — Fases 0–9 de execução
- `docs/03-backlog-tecnico.md` — Checklist técnico completo
- `docs/04-riscos-duvidas-decisoes.md` — Decisões e riscos
- `docs/05-ambiente-mcps-skills.md` — MCPs, Skills e contas externas
- `docs/06-politica-privacidade.md` — Política de Privacidade (LGPD)
- `docs/07-termos-de-uso.md` — Termos de Uso

## Documentos-base

Os documentos originais do projeto estão em `documentos-base/` e **não devem ser alterados**.
