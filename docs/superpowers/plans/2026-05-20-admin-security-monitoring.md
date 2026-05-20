# Admin Security Monitoring (Prioridade 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar monitoramento interno de segurança administrativa em `/admin/security` com leitura segura de `admin_audit_logs`, filtros para tabela, sanitização, risco e alertas críticos resilientes sem expor dados sensíveis.

**Architecture:** A implementação separa leitura/sanitização/risco/alerta em helpers server-side (`src/lib/admin/*`) e mantém a UI como Server Component protegido no grupo `admin/(protected)`. Cards de resumo usam janela fixa de 24h e a tabela usa filtros validados por query string com limite de 100 linhas. Alertas por e-mail são best-effort com deduplicação de 15 minutos usando o próprio `admin_audit_logs`.

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase SSR client (`createSessionClient`), Postgres RLS, Vitest, lucide-react.

---

## File Structure Map

- Create: `src/lib/admin/auditLogSanitizer.ts`
  - Sanitização de metadata e preview truncado seguro.
- Create: `src/lib/admin/auditLogQueries.ts`
  - Tipos + queries server-only para resumo e eventos com filtros.
- Create: `src/lib/admin/securityRisk.ts`
  - Classificação de risco de evento.
- Create: `src/lib/admin/securityAlerts.ts`
  - Envio de alerta, dedupe de `sent` e `skipped_unconfigured`, logs técnicos.
- Create: `src/app/admin/(protected)/security/page.tsx`
  - UI protegida com cards 24h, filtros de tabela e tabela de 100 eventos.
- Modify: `src/components/admin/AdminSidebar.tsx`
  - Link "Segurança" no menu.
- Modify: `src/lib/admin/auditLog.ts`
  - Trigger de alertas críticos + guard-rail para não alertar eventos internos.
- Modify: `supabase/migrations/009_admin_audit_logs.sql`
  - Política SELECT RLS para admins autenticados via `admin_users`.
- Create/Modify tests:
  - `tests/unit/admin/auditLogSanitizer.test.ts`
  - `tests/unit/admin/securityRisk.test.ts`
  - `tests/unit/admin/auditLogQueries.test.ts`
  - `tests/unit/admin/securityAlerts.test.ts`
  - `tests/unit/admin/auditLog.test.ts`
  - `tests/unit/admin/security-page-sanitization.test.tsx` (ou adaptar arquivo admin existente)

### Task 1: Baseline de RLS para leitura com sessão

**Files:**
- Modify: `supabase/migrations/009_admin_audit_logs.sql`
- Test: validação manual SQL + fluxo de sessão admin

- [ ] **Step 1: Escrever teste de política esperada (documentação executável em comentário de migration)**

```sql
-- expected: authenticated user in public.admin_users can SELECT
-- expected: authenticated user not in public.admin_users cannot SELECT
```

- [ ] **Step 2: Atualizar policy de SELECT**

```sql
DROP POLICY IF EXISTS "Admin audit logs - block select" ON public.admin_audit_logs;

CREATE POLICY "Admin audit logs - admin select"
  ON public.admin_audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.admin_users au
      WHERE au.user_id = auth.uid()
    )
  );
```

- [ ] **Step 3: Verificar que INSERT/UPDATE/DELETE continuam bloqueados**

Run: revisar migration para manter políticas `block insert/update/delete`.
Expected: somente SELECT muda.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/009_admin_audit_logs.sql
git commit -m "db: allow admin-only select on admin_audit_logs via RLS"
```

### Task 2: Sanitização de metadata

**Files:**
- Create: `src/lib/admin/auditLogSanitizer.ts`
- Test: `tests/unit/admin/auditLogSanitizer.test.ts`

- [ ] **Step 1: Escrever testes falhando para remoção case-insensitive e truncamento**

```ts
it("removes sensitive keys case-insensitively", () => {
  const input = { token: "x", Authorization: "y", safe: "ok" };
  expect(sanitizeAuditMetadata(input)).toEqual({ safe: "ok" });
});

it("formats preview with max 200 chars and fallback dash", () => {
  expect(formatAuditMetadataPreview(null)).toBe("—");
  const long = { a: "x".repeat(500) };
  expect(formatAuditMetadataPreview(long).length).toBeLessThanOrEqual(200);
});
```

- [ ] **Step 2: Rodar teste para confirmar falha**

Run: `npm run test -- tests/unit/admin/auditLogSanitizer.test.ts`
Expected: FAIL (funções ainda inexistentes).

- [ ] **Step 3: Implementar helper mínimo**

```ts
const SENSITIVE_KEYS = [
  "password","token","bootstrapToken","authorization","cookie",
  "serviceRole","secret","apiKey","accessToken","refreshToken",
];
```

Implementar filtragem case-insensitive e preview com `JSON.stringify` + truncamento.

- [ ] **Step 4: Rodar teste para confirmar sucesso**

Run: `npm run test -- tests/unit/admin/auditLogSanitizer.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/admin/auditLogSanitizer.ts tests/unit/admin/auditLogSanitizer.test.ts
git commit -m "feat: add admin audit metadata sanitizer and preview formatter"
```

### Task 3: Camada de risco

**Files:**
- Create: `src/lib/admin/securityRisk.ts`
- Test: `tests/unit/admin/securityRisk.test.ts`

- [ ] **Step 1: Escrever testes de matriz de risco**

```ts
it("forces error severity to high", () => {
  expect(getAuditEventRiskLevel("any_event", "error")).toBe("high");
});

it("maps known events and defaults warn->medium info->low", () => {
  expect(getAuditEventRiskLevel("admin_upload_success", "info")).toBe("low");
  expect(getAuditEventRiskLevel("unknown_warn", "warn")).toBe("medium");
});
```

- [ ] **Step 2: Rodar teste e confirmar falha**

Run: `npm run test -- tests/unit/admin/securityRisk.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar função e mapas**

```ts
export function getAuditEventRiskLevel(event: string, severity: string): "low" | "medium" | "high" {
  // map explicit events, then severity fallback
}
```

- [ ] **Step 4: Rodar teste e confirmar sucesso**

Run: `npm run test -- tests/unit/admin/securityRisk.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/admin/securityRisk.ts tests/unit/admin/securityRisk.test.ts
git commit -m "feat: add audit risk classification helper"
```

### Task 4: Queries server-only de audit log

**Files:**
- Create: `src/lib/admin/auditLogQueries.ts`
- Test: `tests/unit/admin/auditLogQueries.test.ts`

- [ ] **Step 1: Escrever testes de filtros e limites**

```ts
it("caps limit to 100", async () => {
  await getAdminAuditEvents({ limit: 999 });
  expect(mockRange).toHaveBeenCalledWith(0, 99);
});

it("ignores invalid filters and clamps date range to 90 days", async () => {
  await getAdminAuditEvents({ severity: "bad" as never, from: "2026-01-01", to: "2026-05-20" });
  expect(mockEq).not.toHaveBeenCalledWith("severity", "bad");
  expect(appliedFromToDiffDays).toBeLessThanOrEqual(90);
});
```

- [ ] **Step 2: Rodar teste e confirmar falha**

Run: `npm run test -- tests/unit/admin/auditLogQueries.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar `auditLogQueries.ts`**

Implementar:
- `import "server-only";`
- tipos `AdminAuditSeverity`, `AdminActorType`, `AdminAuditEvent`, `AdminAuditSummary`
- `getAdminAuditSummary({ from?, to? })`
- `getAdminAuditEvents({ severity?, event?, actorType?, from?, to?, limit? })`
- default da tabela: últimas 24h quando não houver filtros válidos de data
- `limit` máximo 100
- ordenação `created_at` desc
- uso de `createSessionClient()`
- sanitização de metadata com helper da Task 2

- [ ] **Step 4: Rodar teste e confirmar sucesso**

Run: `npm run test -- tests/unit/admin/auditLogQueries.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/admin/auditLogQueries.ts tests/unit/admin/auditLogQueries.test.ts
git commit -m "feat: add server-only admin audit log query helpers"
```

### Task 5: Alertas críticos com dedupe e eventos internos

**Files:**
- Create: `src/lib/admin/securityAlerts.ts`
- Test: `tests/unit/admin/securityAlerts.test.ts`

- [ ] **Step 1: Escrever testes de comportamento crítico**

```ts
it("does not send without SECURITY_ALERT_EMAIL/LEAD_NOTIFICATION_EMAIL and logs skipped event", async () => {
  await sendSecurityAlert({ event: "admin_access_forbidden", severity: "warn" });
  expect(mockResendSend).not.toHaveBeenCalled();
  expect(mockAuditLog).toHaveBeenCalledWith(expect.objectContaining({ event: "admin_security_alert_skipped_unconfigured" }));
});

it("dedupes sent and skipped_unconfigured by sourceEvent over 15 minutes", async () => {
  expect(await shouldSkipAlertByDedupe("admin_access_forbidden")).toBe(true);
});

it("never leaks sensitive fields in email payload", async () => {
  await sendSecurityAlert({ event: "admin_upload_rejected_size", severity: "warn", metadata: { token: "x", ok: 1 } });
  expect(serializedEmail).not.toContain("token");
});
```

- [ ] **Step 2: Rodar teste e confirmar falha**

Run: `npm run test -- tests/unit/admin/securityAlerts.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar helper de alerta**

Implementar:
- whitelist de eventos críticos
- blacklist/guardrail: nunca alertar `admin_security_alert_sent` e `admin_security_alert_skipped_unconfigured`
- resolução de env com fallback
- dedupe 15 min para `admin_security_alert_sent` e `admin_security_alert_skipped_unconfigured` por `metadata.sourceEvent`
- envio Resend best-effort
- logs técnicos mínimos em `admin_audit_logs`

- [ ] **Step 4: Rodar teste e confirmar sucesso**

Run: `npm run test -- tests/unit/admin/securityAlerts.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/admin/securityAlerts.ts tests/unit/admin/securityAlerts.test.ts
git commit -m "feat: add admin security alerts with dedupe and safe payload"
```

### Task 6: Integrar alerta no audit logger central

**Files:**
- Modify: `src/lib/admin/auditLog.ts`
- Test: `tests/unit/admin/auditLog.test.ts` (novo ou expansão)

- [ ] **Step 1: Escrever teste de resiliência**

```ts
it("does not throw when security alert fails", async () => {
  mockSendSecurityAlert.mockRejectedValue(new Error("mail down"));
  await expect(logAdminEvent({...})).resolves.not.toThrow();
});

it("does not trigger alerts for internal alert events", async () => {
  await logAdminEvent({ event: "admin_security_alert_sent", severity: "info" });
  expect(mockSendSecurityAlert).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Rodar teste e confirmar falha**

Run: `npm run test -- tests/unit/admin/auditLog.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar integração minimalista**

Adicionar chamada a `sendSecurityAlert()` após persistência, cercada por `try/catch`, somente para eventos críticos.

- [ ] **Step 4: Rodar teste e confirmar sucesso**

Run: `npm run test -- tests/unit/admin/auditLog.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/admin/auditLog.ts tests/unit/admin/auditLog.test.ts
git commit -m "feat: trigger resilient security alerts from admin audit logger"
```

### Task 7: Página `/admin/security` + sidebar

**Files:**
- Create: `src/app/admin/(protected)/security/page.tsx`
- Modify: `src/components/admin/AdminSidebar.tsx`
- Test: `tests/unit/admin/security-page-sanitization.test.tsx` (ou ajuste equivalente)

- [ ] **Step 1: Escrever teste de rendering seguro**

```tsx
it("does not render sensitive metadata keys", async () => {
  render(await SecurityPage({ searchParams: { severity: "warn" } }));
  expect(screen.queryByText(/authorization|cookie|token/i)).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Rodar teste e confirmar falha**

Run: `npm run test -- tests/unit/admin/security-page-sanitization.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar página protegida e filtros de tabela**

Implementar:
- cards fixos 24h (sempre)
- tabela com filtros query string (severity/event/actorType/from/to) aplicados só na tabela
- badges de severidade e risco
- colunas exigidas
- limite 100 e ordenação desc
- metadata preview segura

- [ ] **Step 4: Adicionar item "Segurança" no sidebar**

Adicionar link `/admin/security` com ícone `Shield` mantendo padrão visual atual.

- [ ] **Step 5: Rodar teste e confirmar sucesso**

Run: `npm run test -- tests/unit/admin/security-page-sanitization.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/(protected)/security/page.tsx src/components/admin/AdminSidebar.tsx tests/unit/admin/security-page-sanitization.test.tsx
git commit -m "feat: add protected admin security monitoring page"
```

### Task 8: Verificação final, regressão e evidências

**Files:**
- Modify (se necessário): `docs/superpowers/plans/2026-05-20-admin-security-monitoring.md` (checklist de execução)

- [ ] **Step 1: Rodar suíte unitária focada em admin**

Run: `npm run test -- tests/unit/admin`
Expected: PASS.

- [ ] **Step 2: Rodar quality gates exigidos**

Run: `npm run typecheck && npm run lint`
Expected: sem erros.

- [ ] **Step 3: Validar manualmente fluxo de aceite**

Runbook:
1. login admin
2. abrir `/admin/security`
3. validar cards
4. validar filtros
5. validar acesso negado para não-admin
6. gerar evento crítico e conferir linha na tabela
7. validar envio/skip de alerta conforme env

- [ ] **Step 4: Commit final de ajustes (se houver)**

```bash
git add -A
git commit -m "test: finalize admin security monitoring verification"
```

## Self-Review (Plan vs Spec)

- Cobertura do spec: UI protegida, cards 24h fixos, tabela filtrável por query, sanitização, risco, alertas, dedupe de `sent` e `skipped_unconfigured`, guard-rail de não autoalerta, RLS com `createSessionClient()`, testes e validação manual.
- Placeholder scan: sem `TODO`/`TBD`.
- Consistência de tipos/nomes: `admin_security_alert_sent` e `admin_security_alert_skipped_unconfigured` usados de forma consistente em tasks e critérios.
