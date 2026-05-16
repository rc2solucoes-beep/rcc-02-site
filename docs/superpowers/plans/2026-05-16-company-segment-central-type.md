# Company Segment Central Type Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce `company_segment` as a centralized bucket-only type in tracking payloads and keep docs/tests aligned with the same taxonomy.

**Architecture:** Define `CompanySegmentCategory` once in `src/lib/tracking.ts` and reuse it in `ContactForm` and tests via type-only imports. Keep runtime behavior unchanged by only tightening type contracts and updating documentation language to reflect the existing normalized buckets.

**Tech Stack:** TypeScript, Next.js App Router, React Hook Form, Vitest.

---

## File Structure

- Modify: `src/lib/tracking.ts`
- Modify: `src/components/marketing/ContactForm.tsx`
- Modify: `tests/unit/tracking.test.ts`
- Modify: `docs/gtm-tagging-strategy.md`
- Modify: `docs/superpowers/specs/2026-05-16-gtm-datalayer-strategy-design.md`
- Modify: `docs/superpowers/plans/2026-05-16-gtm-datalayer-strategy.md`

---

### Task 1: Centralize Company Segment Type In Tracking

**Files:**
- Modify: `src/lib/tracking.ts`
- Test: `tests/unit/tracking.test.ts`

- [ ] **Step 1: Add and export the central union type**

Insert in `src/lib/tracking.ts` (near other exported types):

```ts
export type CompanySegmentCategory =
  | "varejo"
  | "saude"
  | "logistica"
  | "servicos"
  | "educacao"
  | "industria"
  | "tecnologia"
  | "financeiro"
  | "alimentacao"
  | "outro";
```

- [ ] **Step 2: Tighten LeadEventPayload**

Change:

```ts
company_segment?: string;
```

To:

```ts
company_segment?: CompanySegmentCategory;
```

- [ ] **Step 3: Verify no other tracking contract changed**

Run:

```bash
rg -n "type LeadEventName|type DataLayerEventName|interface LeadEventPayload|company_segment" src/lib/tracking.ts
```

Expected: only `company_segment` typing changed; no event names changed.

- [ ] **Step 4: Commit**

```bash
git add src/lib/tracking.ts
git commit -m "refactor: centralize company segment tracking type"
```

---

### Task 2: Reuse Central Type In ContactForm Without Behavior Changes

**Files:**
- Modify: `src/components/marketing/ContactForm.tsx`

- [ ] **Step 1: Remove local CompanySegmentCategory type**

Delete local union declaration currently defined in `ContactForm.tsx`.

- [ ] **Step 2: Import type-only from tracking module**

Update tracking import to include:

```ts
import { trackLeadEvent, trackWhatsappClick, type CompanySegmentCategory } from "@/lib/tracking";
```

Keep it type-only for `CompanySegmentCategory`.

- [ ] **Step 3: Keep categorization logic unchanged**

Confirm `categorizeCompanySegment(segment): CompanySegmentCategory` still has:
- the same return buckets
- the same keyword arrays
- the same normalization strategy

Run:

```bash
rg -n "categorizeCompanySegment|categoryKeywords|varejo|saude|logistica|servicos|educacao|industria|tecnologia|financeiro|alimentacao|outro" src/components/marketing/ContactForm.tsx
```

Expected: same bucket logic, no UX or flow changes.

- [ ] **Step 4: Commit**

```bash
git add src/components/marketing/ContactForm.tsx
git commit -m "refactor: reuse central company segment type in contact form"
```

---

### Task 3: Reuse Central Type In Tracking Test

**Files:**
- Modify: `tests/unit/tracking.test.ts`

- [ ] **Step 1: Import CompanySegmentCategory as type-only**

Add type import from tracking module:

```ts
import type { CompanySegmentCategory } from "@/lib/tracking";
```

- [ ] **Step 2: Use typed bucket value in lead-success test**

In the `trackLeadEvent("generate_lead_success", ...)` test, assign:

```ts
const segment: CompanySegmentCategory = "varejo";
```

And use:

```ts
company_segment: segment,
```

Do not change test semantics or expected assertions.

- [ ] **Step 3: Commit**

```bash
git add tests/unit/tracking.test.ts
git commit -m "test: reuse central company segment category type"
```

---

### Task 4: Align Public And Internal Documentation

**Files:**
- Modify: `docs/gtm-tagging-strategy.md`
- Modify: `docs/superpowers/specs/2026-05-16-gtm-datalayer-strategy-design.md`
- Modify: `docs/superpowers/plans/2026-05-16-gtm-datalayer-strategy.md`

- [ ] **Step 1: Update bucket-only language in GTM strategy doc**

Ensure `docs/gtm-tagging-strategy.md` explicitly states allowed `company_segment` values:

- `varejo`
- `saude`
- `logistica`
- `servicos`
- `educacao`
- `industria`
- `tecnologia`
- `financeiro`
- `alimentacao`
- `outro`

Also reinforce: no free text is allowed in `company_segment`.

- [ ] **Step 2: Update historical spec and plan wording**

In both internal docs, replace any phrasing that implies `company_segment` is free string with bucket-only wording aligned to the same 10 values.

Run:

```bash
rg -n "company_segment|string livre|texto livre|Varejo|bucket" docs/gtm-tagging-strategy.md docs/superpowers/specs/2026-05-16-gtm-datalayer-strategy-design.md docs/superpowers/plans/2026-05-16-gtm-datalayer-strategy.md
```

Expected: no references implying free-string `company_segment`.

- [ ] **Step 3: Commit**

```bash
git add docs/gtm-tagging-strategy.md docs/superpowers/specs/2026-05-16-gtm-datalayer-strategy-design.md docs/superpowers/plans/2026-05-16-gtm-datalayer-strategy.md
git commit -m "docs: align company segment taxonomy across tracking docs"
```

---

### Task 5: Verify Acceptance Criteria

**Files:**
- Verify all files changed in Tasks 1-4.

- [ ] **Step 1: Run typecheck**

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 2: Run tracking unit tests**

```bash
npm run test -- tests/unit/tracking.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run lint on changed files**

```bash
npx eslint src/lib/tracking.ts src/components/marketing/ContactForm.tsx tests/unit/tracking.test.ts
```

Expected: PASS.

- [ ] **Step 4: Final safety scan for unintended functional changes**

```bash
rg -n "generate_lead_start|generate_lead_step_1|generate_lead_submit|generate_lead_success|cta_click|whatsapp_click" src/components/marketing/ContactForm.tsx src/lib/tracking.ts
```

Expected: event names unchanged.

- [ ] **Step 5: Commit final fixups only if needed**

```bash
git add src/lib/tracking.ts src/components/marketing/ContactForm.tsx tests/unit/tracking.test.ts docs/gtm-tagging-strategy.md docs/superpowers/specs/2026-05-16-gtm-datalayer-strategy-design.md docs/superpowers/plans/2026-05-16-gtm-datalayer-strategy.md
git commit -m "chore: finalize company segment type centralization"
```

If no additional fixups are needed after verification, do not create an extra commit.

---

## Self-Review Notes

- Spec coverage complete:
  - central union type + LeadEventPayload tightening: Task 1
  - ContactForm type centralization without behavior change: Task 2
  - tracking test reuse of central type: Task 3
  - public and internal docs consistency: Task 4
  - typecheck + tracking test verification: Task 5
- Placeholder scan complete: no TBD/TODO or ambiguous actions.
- Type consistency: `CompanySegmentCategory` is defined once and reused by code/test/docs.
