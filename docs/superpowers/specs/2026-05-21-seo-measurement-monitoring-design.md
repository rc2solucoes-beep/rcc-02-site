# Fase Medição e Monitoramento SEO — Design

Data: 2026-05-21
Status: Aprovado em brainstorming
Escopo: Instrumentação leve, documentação operacional, QA e rotina de monitoramento

## 1. Objetivo
Preparar o projeto para medir performance orgânica, indexação e conversão com eventos padronizados e documentação de operação contínua, sem alterar layout, conteúdo comercial, CMS/Supabase ou fluxo de publicação de posts.

## 2. Restrições e guardrails
- Não criar/editar/publicar posts.
- Não criar migration.
- Não adicionar dependências.
- Não alterar copy/layout visual de páginas públicas.
- Não alterar regras de indexação/sitemap/robots, salvo erro crítico (não previsto nesta fase).
- Não enviar PII ao `dataLayer`.

### 2.1 Dados permitidos no dataLayer
- `location`
- `label`
- `destination`
- `source_page`
- `source_type`
- `form_name`
- `solution_interest`
- `company_size`
- `company_segment`
- `post_slug`
- `network`
- `error_code`
- `error_message` (sempre genérico)

### 2.2 Dados proibidos no dataLayer
- nome, e-mail, telefone, WhatsApp, empresa, mensagem
- qualquer campo livre digitado
- stack trace
- erro bruto de API

## 3. Abordagem escolhida
Abordagem A (compatível e incremental):
- Manter `trackPageView` como está.
- Não duplicar `page_view`.
- Manter eventos legados `generate_lead_*` em paralelo.
- Adicionar eventos nativos novos no `dataLayer` para padronização futura.
- Instrumentar por componente/página com mudanças mínimas e baixo risco.

## 4. Arquitetura de tracking

### 4.1 Arquivo central
`src/lib/tracking.ts`

### 4.2 Eventos existentes preservados
- `page_view`
- `cta_click`
- `whatsapp_click`
- `generate_lead_start`
- `generate_lead_step_1`
- `generate_lead_submit`
- `generate_lead_success`

### 4.3 Novos eventos nativos
- `form_start`
- `form_submit`
- `form_success`
- `form_error`
- `service_link_click`
- `solution_link_click`
- `related_link_click`
- `blog_share_click`

### 4.4 Novas funções esperadas
- `trackFormStart`
- `trackFormSubmit`
- `trackFormSuccess`
- `trackFormError`
- `trackServiceLinkClick`
- `trackSolutionLinkClick`
- `trackRelatedLinkClick`
- `trackBlogShareClick`

Observação:
- Eventos legados `generate_lead_*` não serão removidos, renomeados ou substituídos nesta fase.
- Não será adotado wrapper único nesta fase.

## 5. Pontos de instrumentação

### 5.1 Formulário de contato
Arquivo: `src/components/marketing/ContactForm.tsx`

Implementação:
- Manter disparos legados (`generate_lead_*`).
- Adicionar em paralelo:
  - `form_start`: primeira interação relevante, 1x por montagem.
  - `form_submit`: antes do envio.
  - `form_success`: após sucesso.
  - `form_error`: erro controlado com código/mensagem genéricos.

Payload:
- sem PII
- com contexto operacional (`form_name`, `location`, `source_page`, `source_type`, `solution_interest`, `company_size`, `company_segment`).

### 5.2 Página de serviço
Arquivo: `src/app/(public)/servicos/[slug]/page.tsx`

Implementação:
- Links para outros serviços: `service_link_click`.
- Links relacionados: `related_link_click`.
- CTA principal/secundário continuam via `cta_click`/`whatsapp_click` (já existentes).

### 5.3 Hub de soluções
Arquivo: `src/app/(public)/solucoes/page.tsx`

Implementação:
- Clique nos cards/links para páginas de solução: `solution_link_click`.

### 5.4 Página de solução
Arquivo: `src/app/(public)/solucoes/[slug]/page.tsx`

Implementação:
- “Serviços relacionados”: `service_link_click`.
- “Links relacionados”: `related_link_click`.
- CTA final permanece em `cta_click`/`whatsapp_click` via bloco existente.

### 5.5 Página de post
Arquivo: `src/app/(public)/blog/[slug]/page.tsx`

Implementação:
- Compartilhamento LinkedIn/WhatsApp/X: `blog_share_click` com `network`, `post_slug`, `destination`.
- CTA do artigo segue com `cta_click`/`whatsapp_click` via `TrackedLink`.

### 5.6 TrackedLink
Arquivo: `src/components/tracking/TrackedLink.tsx`

Regra:
- Preservar funcionamento atual para `cta` e `whatsapp`.
- Expandir somente se necessário para novos tipos.
- Preferir handlers locais com helpers novos quando isso reduzir risco.

## 6. Documentação a produzir
Criar:
- `docs/ANALYTICS_EVENTS.md`
- `docs/SEO_MONITORING_PLAN.md`
- `docs/SEARCH_CONSOLE_MONITORING.md`
- `docs/SEO_MONTHLY_REVIEW_TEMPLATE.md`
- `docs/SEO_ANALYTICS_QA_CHECKLIST.md`

Atualizar:
- `docs/SEO_CHECKLIST.md` (seção “Medição e Monitoramento”)
- `README.md` (links de documentação, se seção já existir)

## 7. QA e validação

### 7.1 QA funcional
- GTM Preview: validar disparo dos eventos novos e legados relevantes.
- GA4 DebugView: validar recebimento e parâmetros.
- Garantir ausência de PII no payload.
- Garantir `form_start` uma única vez por montagem.
- Garantir ausência de duplicação de `page_view`.

### 7.2 Validação técnica
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run test` (se existir suíte, como verificação adicional)

## 8. Critérios de aceite desta fase
- Eventos novos implementados/revisados conforme lista aprovada.
- Eventos legados `generate_lead_*` mantidos em paralelo.
- Nenhum dado pessoal enviado ao `dataLayer`.
- Documentos de monitoramento e QA criados/atualizados.
- Projeto compila sem erro.
- Sem criação/alteração de post, migration ou dependência.

## 9. Riscos e mitigação
- Risco: duplicidade de eventos em links já rastreados.
  Mitigação: usar instrumentação pontual por contexto e revisão de handlers existentes.
- Risco: disparo múltiplo de `form_start`.
  Mitigação: preservar lógica de gate por estado já existente.
- Risco: envio acidental de PII.
  Mitigação: tipagem estrita de payload e revisão de pontos de envio.

## 10. Entregáveis finais esperados
- Código de tracking atualizado com novos eventos nativos.
- Pontos de instrumentação aplicados em contato/serviços/soluções/blog.
- Documentos operacionais criados.
- Relatório com validações executadas e confirmações de compliance de escopo.
