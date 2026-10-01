# Tracking P0 Foundation Implementation Plan

> **Para execução:** usar `superpowers:executing-plans` tarefa por tarefa. Cada etapa tem verificação antes de avançar.

**Goal:** Entregar uma base P0 de page_view único, Consent Mode v2 antes do GTM, preferências first-party e CSP compatível com Google Ads.

**Architecture:** Manter GTM e os eventos existentes. Um bootstrap síncrono no `<head>` enfileira o default de consentimento restaurando apenas storage válido; o componente client gerencia preferências e updates. `PageViewTracker` reage só ao pathname. CSP recebe apenas hosts exatos documentados.

**Tech Stack:** Next.js 16.3.3 App Router, React 19, TypeScript, Tailwind v4, Vitest/Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-01-tracking-p0-foundation-design.md`

## Global Constraints

- Basear a branch `fix/tracking-p0-foundation` em `origin/main`; não incluir a branch de sitemap.
- Nenhum novo pacote, `gtag.js` direto, Meta Pixel direto ou mudança de taxonomia P1.
- `page_view` mantém `page_path`, `page_location`, `page_title`, sem query/fragment.
- Consent default dos quatro sinais = `denied`; Marketing controla os três sinais Ads.
- Storage `rc2.consent.v1`, versão 1; evento `consent_update` somente com dois estados, sem PII.
- UI em PT-BR, tokens RC2, Barlow, contraste/foco conforme `AGENTS.md`.
- Não alterar configuração externa de GTM, GA4, Meta ou Google Ads; documentar handoff.

## Review Focus

- Storage inválido ou indisponível → estado negado antes do GTM e banner disponível.
- Navegação com query de Preview/UTM/GCLID/FBCLID → mesmo pathname gera zero eventos adicionais.
- Escolha granular Analytics on / Marketing off → sinais Ads negados e evento sem dados pessoais.
- Reload após escolha → default restaurado na fila antes de `gtm.js`, sem update tardio na hidratação.
- Reabrir e alterar escolha → update e evento únicos, persistência coerente.

---

### Fase 0 — Baseline e caracterização

**Arquivos:** `PageViewTracker.tsx`, `DelayedGtm.tsx`, `layout.tsx`, `Footer.tsx`, `next.config.ts`, `privacidade/page.tsx`, `tracking.ts`, docs de GTM; novos testes em `tests/unit/tracking/` ou padrão existente.

- [x] Confirmar branch/status, buscar `origin/main`, criar worktree dedicado e instalar dependências.
- [x] Executar `npm test` no baseline: 52 arquivos, 611 testes passando.
- [ ] Registrar testes atuais de `PageViewTracker`/consentimento e o estado do `noscript`.

**Validação e saída:** evidência do baseline registrada na spec; nenhum código alterado antes da spec e do plano.

### Fase 1 — Corrigir page_view

**Arquivos:** `src/components/tracking/PageViewTracker.tsx`, `tests/unit/tracking/PageViewTracker.test.tsx`.

- [ ] Escrever teste de componente que monta `/contato`, muda apenas query e exige um único evento; mudar pathname para `/solucoes` e `/sobre` e exigir um novo por rota. Testar payload sem query/fragment.
- [ ] Executar teste e confirmar falha pela dependência atual em `useSearchParams`.
- [ ] Remover hook de query e observar somente `pathname`, preservando os três campos e `event`.
- [ ] Executar teste e confirmar sucesso; revisar comportamento de back/forward no mesmo teste por mudança de pathname.
- [ ] Commit `fix(tracking): prevent duplicate page views on query changes`.

**Validação e saída:** regressão reproduzida antes da mudança e teste verde depois; diff só no tracker/teste.

### Fase 2 — Modelo, bootstrap e noscript

**Arquivos:** criar `src/lib/consent.ts`, `tests/unit/consent.test.ts`; modificar `src/app/layout.tsx`.

**Interfaces:** `ConsentPreference = {version: 1; analytics: boolean; marketing: boolean; updatedAt: string}`; `parseConsentPreference(raw: string | null): ConsentPreference | null`; `toConsentState(preference: Pick<ConsentPreference,"analytics"|"marketing">): ConsentState`; `getConsentBootstrapScript(): string`; `saveConsentPreference(analytics: boolean, marketing: boolean): ConsentPreference`; `publishConsentUpdate(preference: ConsentPreference): void`.

- [ ] Escrever testes para default negado, objeto salvo válido, JSON inválido, versão desconhecida, booleans ausentes, storage indisponível e ordenação do bootstrap (`consent default` antes de `gtm.js`). Executar e verificar vermelho.
- [ ] Implementar modelo/storage/bootstrap. O script no `<head>` inicializa `dataLayer`, lê `localStorage` em `try/catch`, enfileira o default e não baixa `gtag.js`.
- [ ] Mover a inicialização de dataLayer do `<body>` para o bootstrap do `<head>`; remover iframe `noscript` após registrar a decisão na spec. Manter `DelayedGtm` e `PageViewTracker`.
- [ ] Executar testes unitários, typecheck parcial e inspeção de HTML/ordem.
- [ ] Commit `feat(consent): initialize consent mode before GTM`.

**Validação e saída:** default e preferência salva enfileirados antes do container; falhas de storage negam opcionais; nenhuma tag nova.

### Fase 3 — UI, update e persistência

**Arquivos:** criar `src/components/tracking/ConsentManager.tsx` e teste `tests/unit/tracking/ConsentManager.test.tsx`; modificar `src/app/layout.tsx`, `src/components/layout/Footer.tsx`, `src/app/(public)/privacidade/page.tsx` apenas para coerência técnica.

- [ ] Escrever testes para aceitar todos, rejeitar opcionais, Analytics on / Marketing off, persistência e reabrir preferências; confirmar vermelho.
- [ ] Implementar UI first-party com três ações, toggles separados, essenciais fixas, link `/privacidade`, botão no footer, foco visível e responsividade por tokens existentes.
- [ ] Em escolha, salvar `rc2.consent.v1`, chamar `gtag('consent','update',estado)` e publicar `consent_update` com apenas `analytics_consent` e `marketing_consent`. Não alterar `generate_lead_*` ou `form_*`.
- [ ] Atualizar §7 da Política de Privacidade somente para descrever tecnicamente categorias e o botão de preferências; não fazer alegação jurídica nova.
- [ ] Executar testes, inspecionar UI e fazer screenshot antes/depois quando possível.
- [ ] Commit `feat(consent): add accessible preference controls`.

**Validação e saída:** usuário escolhe e reabre; estados técnicos correspondem às categorias; evento sem PII; build e brand audit após estilo.

### Fase 4 — CSP

**Arquivos:** `next.config.ts`, teste de contrato em `tests/unit/tracking/csp.test.ts` se a configuração for importável sem efeitos.

- [ ] Escrever verificação de hosts exatos a adicionar e ausência de `connect-src https:`; confirmar vermelho.
- [ ] Incluir hosts oficiais e observados listados na spec em `connect-src`; incluir os hosts oficiais necessários em `script-src` e `frame-src`. Não mudar outras diretivas.
- [ ] Executar verificação e conferir diff da CSP contra `origin/main`.
- [ ] Commit `fix(csp): allow documented Google Ads measurement hosts`.

**Validação e saída:** `ad.doubleclick.net` permitido, escopo da política restrito a hosts explícitos; GA4/GTM/Turnstile/Supabase preservados.

### Fase 5 — Documentação e handoff

**Arquivos:** `docs/gtm-tagging-strategy.md`, criar `docs/TRACKING_P0_HANDOFF.md`; ajustar spec/plano somente se implementação exigir decisão registrada.

- [ ] Corrigir a linha antiga que dizia page_view em mudanças de search params.
- [ ] Documentar bootstrap, schema de storage, `consent_update`, limites de comportamento das tags e decisão `noscript`.
- [ ] Escrever checklist Preview/produção para page_view, consentimento, Meta, GA4, Ads, CSP e ações manuais pós-deploy, incluindo `CONST | Meta | Pixel ID` e `SEU_PIXEL_ID` apenas em documentação.
- [ ] Revisar para não transformar sugestões P1 em alterações nesta PR.
- [ ] Commit `docs(tracking): add P0 ads validation handoff`.

**Validação e saída:** checklist reproduzível, com separação clara entre código e GTM/GA4/Meta/Ads externos.

### Fase 6 — QA automatizado e manual local

**Arquivos:** testes unitários criados; E2E em `tests/e2e/` somente se determinístico no setup.

- [ ] Conferir os dez comportamentos unitários exigidos pelo pedido. Incluir teste E2E do banner e reabertura se o servidor de teste puder usar evento/estado determinístico.
- [ ] Rodar testes direcionados; corrigir apenas falhas P0.
- [ ] Validar DOM/HTML inicial e `dataLayer` ordenado por script de bootstrap, sem timer arbitrário.
- [ ] Inspecionar UI desktop/mobile em desenvolvimento, se browser local disponível, e capturar screenshots.

**Validação e saída:** casos P0 cobertos; limitações de ambiente registradas.

### Fase 7 — Gates finais

**Arquivos:** diff completo.

- [ ] Executar `npm run check`.
- [ ] Executar `npm run build`.
- [ ] Executar `npm run audit:brand`.
- [ ] Executar `npm run test:e2e` se testes E2E diretamente afetados ou novos existirem; investigar só falhas de escopo.
- [ ] Conferir `git diff --check`, `git status`, `git diff origin/main...HEAD`, segredos/PII/IDs e ausência de P1.

**Validação e saída:** saídas e códigos de retorno registrados, sem afirmar sucesso sem evidência.

### Fase 8 — Git e PR

**Arquivos:** somente commits e descrição da PR.

- [ ] Confirmar todos os arquivos pretendidos em commits atômicos e status limpo.
- [ ] Push `fix/tracking-p0-foundation` para `origin`.
- [ ] Abrir PR para `main` com problema, causa raiz, solução, arquivos, testes, QA manual, ações externas, riscos e rollback.
- [ ] Informar link da PR e deixar sem merge.

**Validação e saída:** PR aberta contra `main`; worktree e branch preservados para revisão.
