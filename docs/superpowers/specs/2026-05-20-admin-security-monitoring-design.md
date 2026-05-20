# Prioridade 3 — Monitoramento de Segurança Administrativa (Design)

## 1. Objetivo
Implementar visibilidade operacional interna sobre eventos de segurança administrativa já persistidos em `public.admin_audit_logs`, com tela protegida no painel admin, filtros básicos, resumo de risco e preparação para alertas por e-mail, sem criar nova superfície pública e sem expor dados sensíveis.

## 2. Escopo
Incluído nesta prioridade:
- Nova rota protegida `/admin/security` com Server Component.
- Cards de resumo de segurança (janela padrão: últimas 24h).
- Tabela de eventos recentes (até 100, ordenação `created_at DESC`).
- Filtros por query string com validação e limites.
- Helper server-only para leitura de audit logs.
- Camada de classificação de risco (`low|medium|high`).
- Sanitização e preview seguro de metadata.
- Alertas internos por e-mail para eventos críticos.
- Deduplicação de alertas por 15 minutos via próprio `admin_audit_logs`.
- Integração dos alertas ao fluxo de persistência de audit log.
- Inclusão de item “Segurança” no menu lateral do admin.
- Testes unitários relevantes + validação manual.

Fora de escopo nesta prioridade:
- Endpoint público para consulta de logs.
- Dashboard externo de segurança.
- Fila/worker assíncrono para alertas.
- Alterações em páginas públicas.

## 3. Restrições e premissas
- Proteção de acesso deve continuar server-side com padrões já existentes em `admin/(protected)` e `requireAdmin()`.
- Sem envio de eventos administrativos sensíveis para GA4.
- Nunca exibir ou persistir em UI dados sensíveis (token, password, cookie, authorization, secret, apiKey, serviceRole).
- Nunca exibir e-mail puro; apenas `actor_email_hash` quando existir.
- Range de filtro por data: máximo 90 dias.
- Limite máximo de registros retornados: 100.
- Cards permanecem sempre na janela fixa de 24h, independente de filtros.
- Filtros por query string afetam somente a tabela de eventos.
- Na tabela, quando não houver filtro explícito, o padrão é janela de últimas 24h.

## 4. Arquitetura proposta (Abordagem A)

### 4.1 Camada de leitura e transformação
Novo arquivo: `src/lib/admin/auditLogQueries.ts` (`import "server-only"`).

Responsabilidades:
- Definir tipos:
  - `AdminAuditSeverity`
  - `AdminActorType`
  - `AdminAuditEvent`
  - `AdminAuditSummary`
- Expor:
  - `getAdminAuditSummary(options?)`
  - `getAdminAuditEvents(filters?)`
- Construir queries com Supabase query builder (sem SQL interpolada manualmente).
- Aplicar validação/sanitização de filtros de entrada.
- Aplicar limites (`range <= 90 dias`, `limit <= 100`).
- Sanitizar payload retornado para UI (incluindo metadata).

### 4.2 Camada de sanitização
Novo arquivo: `src/lib/admin/auditLogSanitizer.ts`.

Responsabilidades:
- `sanitizeAuditMetadata(metadata)` remove chaves sensíveis case-insensitive.
- `formatAuditMetadataPreview(metadata, maxLength = 200)` gera texto seguro, truncado, sem HTML.
- Se metadata for `null`, retorno visual deve ser `—`.

### 4.3 Camada de risco
Função utilitária:
- `getAuditEventRiskLevel(event, severity): "low" | "medium" | "high"`

Regras:
- `severity === "error"` => no mínimo `high`.
- `severity === "warn"` não mapeado => `medium`.
- `info` não mapeado => `low`.
- Mapeamento explícito conforme lista aprovada do prompt.

### 4.4 Camada de alertas
Novo arquivo: `src/lib/admin/securityAlerts.ts`.

Responsabilidades:
- Expor `sendSecurityAlert(input)` para eventos críticos.
- Resolver destinatário:
  - `SECURITY_ALERT_EMAIL`
  - fallback `LEAD_NOTIFICATION_EMAIL`
- Sem destinatário:
  - não enviar,
  - registrar `admin_security_alert_skipped_unconfigured` (audit log técnico).
- Deduplicar envio:
  - verificar `admin_security_alert_sent` com `metadata.sourceEvent` igual ao evento, janela de 15 minutos.
- Deduplicar também `admin_security_alert_skipped_unconfigured` por `metadata.sourceEvent` em janela de 15 minutos.
- Se enviado com sucesso:
  - registrar `admin_security_alert_sent` com metadata mínima `{ sourceEvent }`.
- `admin_security_alert_sent` e `admin_security_alert_skipped_unconfigured` nunca podem disparar novos alertas.
- Falhas internas nunca quebram fluxo principal.

## 5. Design da UI `/admin/security`
Novo arquivo: `src/app/admin/(protected)/security/page.tsx`.

### 5.1 Acesso e proteção
- Página dentro do grupo `admin/(protected)` para herdar proteção existente.
- Apenas admin autenticado acessa.
- Sem API pública nova para essa consulta.

### 5.2 Cards de resumo (24h)
Exibir:
- Eventos nas últimas 24h
- Eventos warn nas últimas 24h
- Eventos error nas últimas 24h
- Tentativas negadas nas últimas 24h
- Bootstrap bloqueado nas últimas 24h
- Uploads administrativos nas últimas 24h

Conjuntos de eventos:
- Negados:
  - `admin_access_no_session`
  - `admin_access_forbidden`
  - `admin_init_no_session`
  - `admin_init_forbidden_existing_admin`
  - `admin_bootstrap_missing_token`
  - `admin_bootstrap_invalid_token`
  - `admin_bootstrap_not_configured`
  - `admin_action_forbidden`
- Bootstrap bloqueado:
  - `admin_bootstrap_missing_token`
  - `admin_bootstrap_invalid_token`
  - `admin_bootstrap_not_configured`
- Uploads:
  - `admin_upload_success`
  - `admin_upload_rejected_type`
  - `admin_upload_rejected_size`
  - `admin_upload_empty_file`

### 5.3 Tabela de eventos recentes
- Máximo de 100 registros.
- Ordenação: `created_at DESC`.
- Colunas:
  - Data/hora
  - Severidade
  - Risco
  - Evento
  - Ator
  - Status
  - Path
  - Recurso
  - Metadata resumida

Regras visuais e de segurança:
- Ator: mostrar hash/id (`actor_email_hash`, `actor_user_id`) sem e-mail puro.
- Metadata renderizada como texto, truncada, sem HTML.
- Sem tokens/cookies/authorization/etc.
- Layout simples, consistente com painel admin atual.

### 5.4 Filtros por query string
Filtros suportados:
- `severity=info|warn|error`
- `event=<nome_do_evento>`
- `actorType=anonymous|authenticated|admin|system|unknown`
- `from=YYYY-MM-DD`
- `to=YYYY-MM-DD`

Regras:
- Validar valores de entrada.
- Ignorar filtro inválido sem quebrar render.
- Aplicar range máximo de 90 dias.
- Limite sempre <= 100.
- Esses filtros influenciam apenas a tabela; os cards seguem fixos em 24h.

## 6. Integrações no código existente

### 6.1 Sidebar admin
Arquivo esperado: `src/components/admin/AdminSidebar.tsx`.
- Adicionar item:
  - `href: "/admin/security"`
  - `label: "Segurança"`
  - `icon: Shield` (lucide-react equivalente)

### 6.2 Integração com audit logger central
Arquivo: `src/lib/admin/auditLog.ts`.
- Após persistir evento crítico (`warn|error` conforme whitelist), acionar `sendSecurityAlert()`.
- Envio de alerta deve ser best-effort:
  - erro de alerta é capturado e isolado,
  - fluxo principal segue sem impacto.
- Guard-rail explícito: nunca disparar alerta para eventos internos de controle de alerta:
  - `admin_security_alert_sent`
  - `admin_security_alert_skipped_unconfigured`

### 6.3 Dependência de RLS para leitura via sessão
- Confirmar na migration `supabase/migrations/009_admin_audit_logs.sql` que a política de `SELECT` permite leitura para usuários autenticados presentes em `admin_users`.
- A tela `/admin/security` deve usar `createSessionClient()` e respeitar essa política.

Whitelist de eventos que disparam alerta:
- `admin_bootstrap_success`
- `admin_bootstrap_invalid_token`
- `admin_bootstrap_not_configured`
- `admin_access_forbidden`
- `admin_action_forbidden`
- `admin_upload_rejected_type`
- `admin_upload_rejected_size`

## 7. Segurança e privacidade
- Não criar endpoint público de logs.
- Não expor request body completo.
- Não exibir/propagar segredos.
- Não enviar dados sensíveis ao GA4.
- Alertas por e-mail com dados mínimos (hashes/ids/resumo).
- Sanitização aplicada antes de render e antes de composição de alerta.

## 8. Estratégia de testes

### 8.1 Unitários (obrigatórios)
- `getAuditEventRiskLevel()`
- `sanitizeAuditMetadata()`
- `formatAuditMetadataPreview()`
- `getAdminAuditEvents()` respeita limite máximo
- filtros inválidos são ignorados
- range máximo de datas é respeitado
- `securityAlerts` não envia sem `SECURITY_ALERT_EMAIL`/`LEAD_NOTIFICATION_EMAIL`
- `securityAlerts` não inclui token/cookie/authorization/password
- `auditLog` não quebra se alerta falhar

### 8.2 UI/integração (quando viável)
- `/admin/security` não renderiza valores sensíveis em metadata.
- Acesso negado para não-admin.

### 8.3 Validação manual
1. Acessar `/admin/security` como admin.
2. Confirmar cards de resumo.
3. Confirmar tabela dos últimos eventos.
4. Filtrar por `severity=warn`.
5. Filtrar por `event=admin_access_forbidden`.
6. Confirmar que não-admin não acessa `/admin/security`.
7. Gerar tentativa negada em `/api/upload`.
8. Confirmar evento em `admin_audit_logs`.
9. Confirmar alerta quando variável de e-mail estiver configurada.

## 9. Critérios de aceite
- Existe `/admin/security` protegido para admin autenticado.
- Link “Segurança” aparece no sidebar admin.
- Cards 24h implementados.
- Tabela com últimos 100 eventos implementada.
- Filtros por query string funcionam com validação.
- Metadata segura e truncada.
- Nenhum dado sensível aparece na UI.
- Helper server-only de queries implementado.
- Risco por evento implementado.
- Alertas críticos por e-mail implementados com deduplicação.
- Falha de alerta não quebra fluxo principal.
- Sem envio de eventos sensíveis para GA4.
- `npm run typecheck`, `npm run lint` e testes relevantes passando.

## 10. Plano de execução de alto nível
1. Implementar `auditLogSanitizer.ts` + testes.
2. Implementar `auditLogQueries.ts` + testes de filtros/limites.
3. Implementar `securityAlerts.ts` + testes de dedupe e fallback de env.
4. Integrar alerta em `auditLog.ts` com isolamento de falhas.
5. Construir `page.tsx` de `/admin/security` (cards, filtros, tabela).
6. Adicionar item no `AdminSidebar.tsx`.
7. Rodar typecheck, lint e suíte de testes afetada.
8. Executar checklist de validação manual.
