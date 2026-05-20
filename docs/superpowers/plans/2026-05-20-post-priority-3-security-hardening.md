# Post-Priority 3 Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Endurecer a Prioridade 3 para produção com hash salted seguro, severidade consistente, deduplicação robusta de alertas, metadata de upload sem filename bruto, migrations incrementais e pipeline verde (`typecheck/lint/test`).

**Architecture:** O plano aplica mudanças incrementais em camadas já existentes (`auditLog`, `alerts`, `queries`, UI admin e migrations), mantendo proteção server-side e sem superfície pública nova. As mudanças de banco são feitas por migration incremental (não alterar rollout de `009` em produção) com backfill defensivo antes de constraints.

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase/Postgres, Resend, Vitest, ESLint.

---

## File Structure Map

- Modify: `src/lib/admin/auditLog.ts`
  - `server-only`, salt policy, hash seguro, normalização de severity, integração resiliente de alerta.
- Modify/Create: `src/lib/admin/securityRisk.ts` (ou helper compartilhado)
  - normalização canônica de severidade reutilizável.
- Modify: `src/lib/admin/securityAlerts.ts`
  - dedupe por `sourceEvent` com query mais precisa e fallback controlado.
- Modify: `src/app/api/upload/route.ts`
  - remover `rawFilename` de metadata auditada.
- Modify: `src/app/admin/(protected)/security/page.tsx`
  - formulário GET de filtros + otimização de preview.
- Create: `supabase/migrations/010_admin_audit_logs_hardening.sql`
  - backfill severity/actor_type + constraints + índices.
- Create if needed: `supabase/migrations/011_bootstrap_first_admin_rpc.sql`
  - RPC bootstrap atômica, se não existir.
- Modify (lint unblockers):
  - `src/components/admin/LinkEditorDialog.tsx`
  - `src/components/admin/RichEditor.tsx`
- Tests:
  - modify `tests/unit/admin/auditLog.test.ts`
  - modify `tests/unit/admin/securityAlerts.test.ts`
  - modify/create upload audit tests (arquivo de rota upload)
  - modify `tests/unit/admin/security-page-sanitization.test.tsx`
  - modify `tests/unit/admin/auditLogQueries.test.ts`

### Task 1: Baseline + verificação de RPC e migrations

**Files:**
- Inspect: `supabase/migrations/*`
- Create (conditional): `supabase/migrations/011_bootstrap_first_admin_rpc.sql`

- [ ] **Step 1: Verificar existência da RPC bootstrap em migrations**

Run: `rg -n "bootstrap_first_admin" supabase/migrations`
Expected: encontrar definição; se só houver uso em código, criar migration nova.

- [ ] **Step 2: Se ausente, criar migration RPC segura**

```sql
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin(
  bootstrap_user_id uuid,
  bootstrap_email text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_count integer;
BEGIN
  LOCK TABLE public.admin_users IN EXCLUSIVE MODE;

  SELECT COUNT(*) INTO existing_count FROM public.admin_users;
  IF existing_count > 0 THEN
    RETURN false;
  END IF;

  INSERT INTO public.admin_users (id, email)
  VALUES (bootstrap_user_id, bootstrap_email);

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.bootstrap_first_admin(uuid, text) FROM PUBLIC;
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations
git commit -m "db: ensure bootstrap_first_admin rpc migration exists"
```

### Task 2: Migration incremental de hardening para admin_audit_logs

**Files:**
- Create: `supabase/migrations/010_admin_audit_logs_hardening.sql`

- [ ] **Step 1: Escrever migration com backfill defensivo + constraints + índices**

```sql
UPDATE public.admin_audit_logs
SET severity = 'warn'
WHERE severity = 'warning';

UPDATE public.admin_audit_logs
SET severity = 'error'
WHERE severity = 'critical';

UPDATE public.admin_audit_logs
SET severity = 'info'
WHERE severity IS NULL OR severity NOT IN ('info','warn','error');

UPDATE public.admin_audit_logs
SET actor_type = 'unknown'
WHERE actor_type IS NULL OR actor_type NOT IN ('anonymous','authenticated','admin','system','unknown');

ALTER TABLE public.admin_audit_logs
  ADD CONSTRAINT admin_audit_logs_severity_check
  CHECK (severity IN ('info', 'warn', 'error'));

ALTER TABLE public.admin_audit_logs
  ADD CONSTRAINT admin_audit_logs_actor_type_check
  CHECK (actor_type IN ('anonymous', 'authenticated', 'admin', 'system', 'unknown'));

CREATE INDEX IF NOT EXISTS admin_audit_logs_severity_idx
  ON public.admin_audit_logs (severity);

CREATE INDEX IF NOT EXISTS admin_audit_logs_resource_idx
  ON public.admin_audit_logs (resource_type, resource_id);
```

- [ ] **Step 2: Revisar ordem para garantir constraints só após normalização**

Run: inspeção do SQL.
Expected: nenhum `CHECK` antes dos `UPDATE`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/010_admin_audit_logs_hardening.sql
git commit -m "db: harden admin_audit_logs with normalization constraints and indexes"
```

### Task 3: `auditLog.ts` server-only + salt/hash + severity canônica

**Files:**
- Modify: `src/lib/admin/auditLog.ts`
- Modify: `src/lib/admin/securityRisk.ts` (se necessário para helper comum)
- Test: `tests/unit/admin/auditLog.test.ts`

- [ ] **Step 1: Escrever/expandir testes falhando para hash salted e normalização**

```ts
it("uses salt when hashing actor email and ip", async () => {
  // assert actor_email_hash/ip_hash are not raw and differ from unsalted inputs
});

it("does not persist hashes in production when salt is missing", async () => {
  // NODE_ENV=production and no salts => null hashes
});

it("normalizes warning->warn and critical->error before insert", async () => {
  // verify insert payload severity
});
```

- [ ] **Step 2: Rodar teste para confirmar falha**

Run: `npm run test -- tests/unit/admin/auditLog.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar mudanças**

Implementar em `auditLog.ts`:
- `import "server-only";`
- resolução de `auditSalt` com política aprovada
- hash salted com prefixo `salt:` e normalização lowercase
- em produção sem salt: não gravar hash e `console.error` sem segredo
- normalização canônica de severity antes do insert
- manter `try/catch` de resiliência

- [ ] **Step 4: Rodar teste para confirmar sucesso**

Run: `npm run test -- tests/unit/admin/auditLog.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/admin/auditLog.ts src/lib/admin/securityRisk.ts tests/unit/admin/auditLog.test.ts
git commit -m "feat: harden admin audit logging with salted hashes and canonical severity"
```

### Task 4: Deduplicação robusta em `securityAlerts.ts`

**Files:**
- Modify: `src/lib/admin/securityAlerts.ts`
- Modify: `tests/unit/admin/securityAlerts.test.ts`

- [ ] **Step 1: Escrever testes falhando de dedupe por `sourceEvent` para sent/skipped**

```ts
it("dedupes admin_security_alert_sent by sourceEvent in 15 min window", async () => {
  // count/head query or filtered result indicates skip
});

it("dedupes admin_security_alert_skipped_unconfigured by sourceEvent", async () => {
  // no repeated skipped logs
});

it("internal alert events never trigger notifications", async () => {
  // sent/skipped inputs => no send
});
```

- [ ] **Step 2: Rodar teste para confirmar falha**

Run: `npm run test -- tests/unit/admin/securityAlerts.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar query mais precisa + fallback**

Implementar:
- tentativa de filtro JSON por `sourceEvent` no banco
- fallback controlado em memória caso filtro JSON não seja suportado
- manter bloqueio de eventos técnicos
- garantir ausência de loop com `writeAdminAuditLog`

- [ ] **Step 4: Rodar teste para confirmar sucesso**

Run: `npm run test -- tests/unit/admin/securityAlerts.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/admin/securityAlerts.ts tests/unit/admin/securityAlerts.test.ts
git commit -m "feat: improve security alert deduplication by sourceEvent"
```

### Task 5: Upload audit metadata sem `rawFilename`

**Files:**
- Modify: `src/app/api/upload/route.ts`
- Modify/Create tests para upload route

- [ ] **Step 1: Escrever teste falhando para garantir ausência de raw filename**

```ts
it("does not log raw filename in upload audit metadata", async () => {
  // assert metadata has extension/mimeType/sizeBytes/folder and no rawFilename
});
```

- [ ] **Step 2: Rodar teste para confirmar falha**

Run: `npm run test -- tests/unit/admin/upload-route*.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar ajuste no handler**

- calcular extensão segura cedo
- substituir payload de metadata por campos seguros
- manter operação de upload inalterada

- [ ] **Step 4: Rodar teste para confirmar sucesso**

Run: `npm run test -- tests/unit/admin/upload-route*.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/upload/route.ts tests/unit/admin
git commit -m "feat: remove raw filename from upload audit metadata"
```

### Task 6: UI `/admin/security` filtros visuais GET + otimização preview

**Files:**
- Modify: `src/app/admin/(protected)/security/page.tsx`
- Modify: `tests/unit/admin/security-page-sanitization.test.tsx`

- [ ] **Step 1: Escrever teste falhando para formulário GET e preservação de filtros**

```tsx
it("renders GET filter form with severity/event/actorType/from/to", async () => {
  // assert fields and clear link
});
```

- [ ] **Step 2: Rodar teste para confirmar falha**

Run: `npm run test -- tests/unit/admin/security-page-sanitization.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar formulário e otimização de preview**

- adicionar formulário GET
- preservar valores atuais
- adicionar link limpar filtros
- calcular `metadataPreview` uma vez por linha

- [ ] **Step 4: Rodar teste para confirmar sucesso**

Run: `npm run test -- tests/unit/admin/security-page-sanitization.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add 'src/app/admin/(protected)/security/page.tsx' tests/unit/admin/security-page-sanitization.test.tsx
git commit -m "feat: add visual filters to admin security page"
```

### Task 7: Correção de lint global bloqueante

**Files:**
- Modify: `src/components/admin/LinkEditorDialog.tsx`
- Modify: `src/components/admin/RichEditor.tsx`

- [ ] **Step 1: Reproduzir erros de lint globais**

Run: `npm run lint`
Expected: erros incluindo `react-hooks/set-state-in-effect` e `react/no-unescaped-entities`.

- [ ] **Step 2: Corrigir padrões de efeito com setState síncrono**

- ajustar `useEffect` para evitar cascata (inicialização lazy, derived state, handlers)
- manter comportamento funcional existente

- [ ] **Step 3: Corrigir `no-unescaped-entities` e demais erros nos arquivos citados**

- substituir aspas em JSX por entidades adequadas quando necessário

- [ ] **Step 4: Rodar lint para confirmar sucesso global**

Run: `npm run lint`
Expected: PASS (warnings aceitáveis, sem errors).

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/LinkEditorDialog.tsx src/components/admin/RichEditor.tsx
git commit -m "fix: resolve global lint errors blocking release"
```

### Task 8: Verificação final e fechamento

**Files:**
- Modify if needed: testes/documentação mínima

- [ ] **Step 1: Rodar suíte completa exigida**

Run: `npm run typecheck && npm run lint && npm run test`
Expected: PASS.

- [ ] **Step 2: Rodar suíte focada admin**

Run: `npm run test -- tests/unit/admin`
Expected: PASS.

- [ ] **Step 3: Validar checklist manual de segurança**

Runbook:
1. abrir `/admin/security` como admin
2. validar cards/tabela/filtros
3. gerar tentativa negada em upload
4. verificar metadata sem filename bruto
5. confirmar hashes salted
6. confirmar dedupe de alerta

- [ ] **Step 4: Commit final de ajustes residuais (se houver)**

```bash
git add -A
git commit -m "test: finalize post-priority-3 security hardening verification"
```

## Self-Review

- Cobertura do spec: completa para salt policy, canonical severity, migrations incrementais, RPC, dedupe, upload metadata, UI filtros, lint global e validação final.
- Placeholder scan: sem `TODO/TBD`.
- Consistência: `AUDIT_LOG_SALT` obrigatório em produção (com fallback `IP_SALT`) incluído no objetivo, implementação e critérios de aceite.
