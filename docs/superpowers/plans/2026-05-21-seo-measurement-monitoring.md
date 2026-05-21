# Plano de Implementação — Fase Medição e Monitoramento SEO

Data: 2026-05-21
Baseado no spec: `docs/superpowers/specs/2026-05-21-seo-measurement-monitoring-design.md`

## Objetivo
Executar instrumentação leve e compatível para medição SEO/conversão, mantendo eventos legados de lead em paralelo, sem alterações visuais relevantes, sem PII no dataLayer e com documentação operacional completa.

## Escopo de execução
- Implementar novos eventos nativos no `dataLayer`:
  - `form_start`
  - `form_submit`
  - `form_success`
  - `form_error`
  - `service_link_click`
  - `solution_link_click`
  - `related_link_click`
  - `blog_share_click`
- Preservar eventos existentes:
  - `page_view`
  - `cta_click`
  - `whatsapp_click`
  - `generate_lead_*`
- Instrumentar páginas/componentes mapeados no spec.
- Criar/atualizar documentação de monitoramento e QA.

## Não-objetivos
- Não configurar GTM/GA4/Search Console externamente.
- Não criar/editar/publicar posts.
- Não tocar Supabase schema/migrations.
- Não adicionar dependências.
- Não refatorar arquitetura de tracking para wrapper único.

## Checklist de implementação

### Tarefa 1 — Expandir contrato de tracking
Arquivos:
- `src/lib/tracking.ts`

Ações:
- Adicionar novos tipos de payload para:
  - formulário (`form_start`, `form_submit`, `form_success`, `form_error`)
  - cliques de navegação (`service_link_click`, `solution_link_click`, `related_link_click`)
  - compartilhamento (`blog_share_click`)
- Adicionar novas funções exportadas:
  - `trackFormStart`
  - `trackFormSubmit`
  - `trackFormSuccess`
  - `trackFormError`
  - `trackServiceLinkClick`
  - `trackSolutionLinkClick`
  - `trackRelatedLinkClick`
  - `trackBlogShareClick`
- Manter `trackPageView`, `trackCtaClick`, `trackWhatsappClick`, `trackLeadEvent` sem regressão.

Critérios:
- Tipagem aceita apenas campos operacionais.
- Sem breaking changes para chamadas existentes.

### Tarefa 2 — Instrumentar formulário de contato
Arquivo:
- `src/components/marketing/ContactForm.tsx`

Ações:
- Em primeira interação relevante (gate já existente), adicionar `trackFormStart` (1x por montagem).
- Antes do envio, adicionar `trackFormSubmit`.
- Em sucesso, adicionar `trackFormSuccess`.
- Em erros controlados, adicionar `trackFormError` com `error_code` e `error_message` genéricos.
- Manter disparos legados `generate_lead_start`, `generate_lead_step_1`, `generate_lead_submit`, `generate_lead_success`.

Critérios:
- Nenhum campo pessoal enviado ao dataLayer.
- Eventos novos e legados coexistem.

### Tarefa 3 — Instrumentar links em páginas de serviços
Arquivo:
- `src/app/(public)/servicos/[slug]/page.tsx`

Ações:
- Adicionar tracking em links para outros serviços com `service_link_click`.
- Adicionar tracking em links relacionados com `related_link_click`.
- Não alterar tracking atual de CTA/WhatsApp.

Critérios:
- Sem alteração visual relevante.
- Sem duplicar `cta_click`/`whatsapp_click` já existentes.

### Tarefa 4 — Instrumentar hub e detalhe de soluções
Arquivos:
- `src/app/(public)/solucoes/page.tsx`
- `src/app/(public)/solucoes/[slug]/page.tsx`

Ações:
- Hub `/solucoes`: cards/links para solução disparam `solution_link_click`.
- Detalhe de solução:
  - serviços relacionados: `service_link_click`
  - links relacionados: `related_link_click`
- CTA final permanece no fluxo atual (`CTABlock`).

Critérios:
- Sem alteração de copy/layout.
- Eventos disparam com contexto (`location`, `label`, `destination`, `source_page`).

### Tarefa 5 — Instrumentar compartilhamento no blog
Arquivo:
- `src/app/(public)/blog/[slug]/page.tsx`

Ações:
- LinkedIn, WhatsApp e X disparam `blog_share_click`.
- Payload inclui `network`, `post_slug`, `destination`, `location`.
- CTA do artigo permanece no tracking atual (via `TrackedLink`).

Critérios:
- Sem enviar dados de usuário.
- Sem regressão de links externos.

### Tarefa 6 — Revisar TrackedLink (mínimo necessário)
Arquivo:
- `src/components/tracking/TrackedLink.tsx`

Ações:
- Avaliar se vale expandir `tracking.kind` para novos casos.
- Preferência: manter foco em `cta`/`whatsapp` e usar handlers locais para novos eventos quando isso reduzir risco.
- Aplicar mudança apenas se realmente necessária para simplicidade/consistência.

Critérios:
- Zero regressão para usos atuais.

### Tarefa 7 — Documentação operacional
Criar:
- `docs/ANALYTICS_EVENTS.md`
- `docs/SEO_MONITORING_PLAN.md`
- `docs/SEARCH_CONSOLE_MONITORING.md`
- `docs/SEO_MONTHLY_REVIEW_TEMPLATE.md`
- `docs/SEO_ANALYTICS_QA_CHECKLIST.md`

Atualizar:
- `docs/SEO_CHECKLIST.md`
- `README.md` (seção de docs)

Critérios:
- Cobrir eventos obrigatórios, conversões/microconversões, QA GTM/GA4 e rotina Search Console.

### Tarefa 8 — Verificação técnica final
Comandos:
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run test`

Critérios:
- Sem erros de build/typecheck/lint.
- Se houver warnings/falhas preexistentes não relacionadas, registrar no relatório final.

## Ordem recomendada
1. Tarefa 1
2. Tarefa 2
3. Tarefa 3
4. Tarefa 4
5. Tarefa 5
6. Tarefa 6
7. Tarefa 7
8. Tarefa 8

## Riscos e mitigação
- Risco: eventos duplicados em links já rastreados.
  Mitigação: adicionar apenas onde não há evento equivalente hoje.
- Risco: `form_start` múltiplo.
  Mitigação: manter gate de estado já existente.
- Risco: vazamento de PII por distração em payload.
  Mitigação: payloads tipados e revisão final por grep (`name|email|whatsapp|message` em chamadas de tracking).

## Evidências esperadas no fechamento
- Lista de arquivos criados/alterados.
- Lista dos eventos implementados por ponto de instrumentação.
- Confirmações explícitas:
  - sem post criado/alterado
  - sem migration
  - sem dependência nova
  - sem PII no dataLayer
- Saída resumida de `typecheck`, `lint`, `build`, `test`.
