# Hardening Pós-Prioridade 3 — Ajustes Finais de Segurança (Design)

## 1. Objetivo
Aplicar hardening final na implementação da Prioridade 3 de monitoramento de segurança administrativa, preservando a arquitetura aprovada e preparando o sistema para produção com foco em proteção de dados, consistência de severidade, robustez de alertas e qualidade de pipeline (`lint/typecheck/test`).

## 2. Contexto validado
Branch de trabalho confirmado: `codex/html-mode-post-editor`.

Arquivos da Prioridade 3 confirmados:
- `src/lib/admin/auditLog.ts`
- `src/lib/admin/auditLogQueries.ts`
- `src/lib/admin/auditLogSanitizer.ts`
- `src/lib/admin/securityRisk.ts`
- `src/lib/admin/securityAlerts.ts`
- `src/app/admin/(protected)/security/page.tsx`
- `supabase/migrations/009_admin_audit_logs.sql`

Premissa explícita do usuário:
- A migration `009` já foi aplicada em produção.
- Portanto, ajustes estruturais de banco serão incrementais (novas migrations), sem reescrever `009` para rollout produtivo.

## 3. Escopo
Incluído:
- `auditLog.ts` explicitamente server-only.
- Hash de e-mail/IP com salt obrigatório em produção.
- Normalização de severity para `info|warn|error` antes de persistir.
- Migration incremental com constraints/índices de `admin_audit_logs`.
- Confirmação de existência (ou criação incremental) da RPC `bootstrap_first_admin`.
- Deduplicação de alertas mais precisa por `sourceEvent`.
- Remoção de `rawFilename` dos metadados de upload auditado.
- Formulário visual GET de filtros na `/admin/security`.
- Otimização de preview de metadata (evitar dupla chamada).
- Correção dos erros globais de lint já existentes fora do escopo de segurança para garantir `npm run lint` verde.
- Testes unitários e validações finais.

Fora de escopo:
- Nova superfície pública de API.
- Dashboard externo.
- Fila/worker para alertas.

## 4. Arquitetura de hardening

### 4.1 Server boundary no audit logger
Arquivo: `src/lib/admin/auditLog.ts`
- Adicionar `import "server-only";` no topo.
- Manter compatibilidade com imports server-side existentes.

### 4.2 Hash com salt obrigatório em produção
Arquivo: `src/lib/admin/auditLog.ts`

Regra de resolução de salt:
```ts
const auditSalt =
  process.env.AUDIT_LOG_SALT ??
  process.env.IP_SALT ??
  (process.env.NODE_ENV === "development" ? "rc2-dev-only" : undefined);
```

Comportamento:
- Se houver salt: gerar hash com prefixo de salt.
- E-mail: `sha256(`${auditSalt}:${email.toLowerCase()}`)`
- IP: `sha256(`${auditSalt}:${normalizedIp}`)`
- Se não houver salt em produção:
  - não persistir `actor_email_hash`/`ip_hash`;
  - registrar erro interno sem incluir segredo.
- Fluxo principal nunca quebra por falha de auditoria/alerta.

### 4.3 Normalização de severity na escrita
Arquivos:
- `src/lib/admin/auditLog.ts`
- `src/lib/admin/securityRisk.ts` (ou helper comum compartilhado)

Regra de persistência:
- `warning -> warn`
- `critical -> error`
- `warn -> warn`
- `error -> error`
- `info -> info`

Resultado:
- Banco recebe apenas `info|warn|error`.
- Camada de leitura deixa de depender de remapeamento de dados legados futuros.
- `toAlertSeverity()` opera sobre severidade já normalizada.

### 4.4 Hardening de deduplicação de alertas
Arquivo: `src/lib/admin/securityAlerts.ts`

Ajuste:
- Melhorar `hasRecentAlertEvent(sourceEvent)` para query precisa por:
  - `event in ('admin_security_alert_sent','admin_security_alert_skipped_unconfigured')`
  - janela `created_at >= now - 15min`
  - filtro de `sourceEvent` no banco quando possível.

Estratégia:
1. Tentar filtro JSON no banco via PostgREST/Supabase.
2. Se sintaxe JSON não for confiável no client atual, aplicar fallback controlado:
   - query mínima de payload;
   - filtro em memória apenas no subconjunto temporal/eventos técnicos.

Regras invariantes:
- `admin_security_alert_sent` e `admin_security_alert_skipped_unconfigured` nunca disparam alertas.
- sem destinatário: registrar `admin_security_alert_skipped_unconfigured` deduplicado por `sourceEvent`.
- sem loop entre `sendSecurityAlert()` e `writeAdminAuditLog()`.

### 4.5 Upload audit sem filename bruto
Arquivo: `src/app/api/upload/route.ts`

Ajuste:
- Remover `rawFilename` de metadata de audit log.
- Persistir apenas metadados seguros:
  - `sanitizedFilename` (se já normalizado para uso técnico e não original bruto)
  - `extension`
  - `mimeType`
  - `sizeBytes`
  - `folder`
- Em erros precoces (antes de MIME validado), usar campos mínimos seguros (`extension`, `contentTypeHeader` etc.).

## 5. Banco e migrations

## 5.1 Migration incremental de constraints/índices
Criar: `supabase/migrations/010_admin_audit_logs_hardening.sql`

Conteúdo lógico:
1. Backfill de severidade legada:
   - `UPDATE ... SET severity='warn' WHERE severity='warning'`
   - `UPDATE ... SET severity='error' WHERE severity='critical'`
   - `UPDATE ... SET severity='info' WHERE severity NOT IN ('info','warn','error') OR severity IS NULL`
2. Backfill de actor_type inválido:
   - `UPDATE ... SET actor_type='unknown' WHERE actor_type NOT IN ('anonymous','authenticated','admin','system','unknown') OR actor_type IS NULL`
3. Constraints:
   - `admin_audit_logs_severity_check`
   - `admin_audit_logs_actor_type_check`
4. Índices:
   - `admin_audit_logs_severity_idx`
   - `admin_audit_logs_resource_idx`

## 5.2 RPC bootstrap_first_admin
- Verificar existência em `supabase/migrations`.
- Se ausente, criar migration incremental (próximo número disponível; esperado `011_bootstrap_first_admin_rpc.sql`) com:
  - `CREATE OR REPLACE FUNCTION public.bootstrap_first_admin(uuid, text) RETURNS boolean`
  - `SECURITY DEFINER`
  - lock de `admin_users` para evitar corrida simples
  - inserir primeiro admin apenas com tabela vazia
  - retornar `true/false`
  - `REVOKE ALL ... FROM PUBLIC`

Se já existir:
- não recriar; apenas manter e validar aderência de segurança.

## 6. UI /admin/security
Arquivo: `src/app/admin/(protected)/security/page.tsx`

Ajustes:
- Adicionar formulário visual de filtros com método GET:
  - `severity`, `event`, `actorType`, `from`, `to`
  - botão `Filtrar`
  - ação `Limpar filtros`
- Preservar regra:
  - cards fixos em 24h
  - filtros afetam somente tabela
- Otimização local:
  - calcular `metadataPreview` uma vez por linha e reutilizar em `title` e célula.

## 7. Lint global obrigatório
Além do escopo de segurança, corrigir erros globais que quebram `npm run lint`, incluindo os já observados em:
- `src/components/admin/LinkEditorDialog.tsx`
- `src/components/admin/RichEditor.tsx`

Objetivo:
- `npm run lint` sem erros.

## 8. Estratégia de testes

### 8.1 Audit log
- hash usa salt;
- hash diferente do valor original;
- sem salt em produção não grava hash inseguro;
- severity normalizada antes de persistir;
- não quebra fluxo em falha de insert;
- não quebra fluxo em falha de alerta.

### 8.2 Security alerts
- eventos internos não disparam alerta;
- sem destinatário registra skipped sem loop;
- skipped deduplicado por `sourceEvent`;
- sent deduplicado por `sourceEvent`;
- payload de alerta sem token/cookie/authorization/password/apiKey/e-mail puro.

### 8.3 Upload
- eventos de upload não salvam `rawFilename`;
- logs com extensão/MIME/tamanho/pasta;
- upload segue funcional.

### 8.4 Queries/UI
- `getAdminAuditEvents()` limita em 100;
- filtros inválidos são ignorados;
- `/admin/security` não renderiza campos sensíveis.

## 9. Validação final
Executar:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run test -- tests/unit/admin`

Validação manual:
1. acessar `/admin/security` como admin;
2. validar cards/tabela;
3. validar filtros (`severity`, `event`);
4. gerar tentativa negada em upload;
5. confirmar ausência de filename bruto;
6. confirmar hash com salt;
7. confirmar dedupe de alerta.

## 10. Critérios de aceite consolidados
- `auditLog.ts` server-only.
- hash com salt e sem hash inseguro em produção sem salt.
- sem e-mail/IP puro persistido.
- produção com `AUDIT_LOG_SALT` configurado (com `IP_SALT` somente como fallback de compatibilidade).
- severity persistida só em `info|warn|error`.
- constraints/índices aplicados via migration incremental.
- RPC bootstrap confirmada ou criada com segurança.
- dedupe de alertas por `sourceEvent` para sent e skipped.
- eventos técnicos não geram alerta.
- upload não salva `rawFilename`.
- `/admin/security` mantém funcionalidade.
- sem superfície pública nova.
- `typecheck`, `lint` e testes passando.
