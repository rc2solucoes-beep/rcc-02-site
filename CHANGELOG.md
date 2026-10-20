# Changelog

## [Unreleased]

### Adicionado
- Estrutura inicial do projeto Next.js 16 + TypeScript + Tailwind v4
- shadcn/ui inicializado e configurado
- Tokens visuais RC2 no globals.css (paleta "The High-End Tool 2.1": Warm Base + Navy / Slate + Safety Orange, tipografia Barlow)
- Estrutura de pastas completa (app, components, lib, supabase, tests)
- Documentação de planejamento (docs/00 a docs/07)
- Política de Privacidade e Termos de Uso (docs/06 e docs/07)
- README.md com visão geral do projeto
- CLAUDE.md com contexto completo para o Claude Code
- .env.example com todas as variáveis necessárias
- Fundação E0a da evolução do painel: runbook de migrations manuais (`docs/runbooks/`), ambiente Supabase isolado documentado (snapshot histórico, marcador e controle de isolamento), suíte de integração de RLS com guarda anti-produção reaplicada na criação de clientes (`npm run test:integration`) e descoberta de testes `.tsx` no Vitest.
- E0b.2/E0b.3: migrations 012 (remove acesso `anon` a `leads`) e 013 (leitura administrativa de `admin_audit_logs`), com runbooks, testes unitários e matriz de RLS de integração (29 verificações). Homologadas manualmente apenas no Supabase isolado; **não aplicadas em produção** (bloqueio PV-20). Incidente de exposição de credenciais segue aberto.
- E1 (CMS): listagem editorial de `/admin/posts` com busca literal, filtros de status e período (dias de Brasília), ordenação determinística, agrupamento por mês, paginação de 20 no servidor sem `content`, estados de carregamento/vazio/erro e indicadores de anomalia; agendamento exige data futura (histórico preservado); exclusão e atualização só auditam sucesso com uma linha afetada; `published_at`/`updated_at` do formulário passam a somente leitura. Migration 014 (`posts.sort_at`) aplicada e verificada **exclusivamente no Supabase isolado** (`rc2-test-isolated`); **não aplicada em produção** (assim como 012 e 013). Homologação no isolado: integração 39/39, E2E 9/9. PV-14 (cron real) permanece parcial.
