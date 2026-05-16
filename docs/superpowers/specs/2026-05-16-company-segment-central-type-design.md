# Company Segment Central Type Design

Date: 2026-05-16
Repository: rsazevedo82/rcc-02-site
Branch: main

## Goal

Centralize the `company_segment` type contract in `src/lib/tracking.ts` so the lead tracking payload cannot accept free-form strings and instead accepts only normalized bucket values.

## Scope

In scope:

- `src/lib/tracking.ts`
- `src/components/marketing/ContactForm.tsx`
- `tests/unit/tracking.test.ts`
- `docs/gtm-tagging-strategy.md`
- `docs/superpowers/specs/2026-05-16-gtm-datalayer-strategy-design.md`
- `docs/superpowers/plans/2026-05-16-gtm-datalayer-strategy.md`

Out of scope:

- Any UX/layout/style/validation/submit-flow behavior changes
- Any tracking event name changes
- Any payload shape changes beyond stronger typing of `company_segment`
- Enum/`as const` refactors

## Constraints

- Use a single exported TypeScript union type in `src/lib/tracking.ts`.
- Do not use enum.
- Do not introduce const-array-derived types in this cycle.
- Preserve existing `categorizeCompanySegment` logic and keywords in `ContactForm`.

## Design

### 1) Central Tracking Contract

In `src/lib/tracking.ts`:

- Add and export:

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

- Update `LeadEventPayload`:

```ts
company_segment?: CompanySegmentCategory;
```

No other tracking types or events change.

### 2) ContactForm Reuse

In `src/components/marketing/ContactForm.tsx`:

- Remove local `CompanySegmentCategory` declaration.
- Import `CompanySegmentCategory` from `@/lib/tracking` as a type-only import.
- Keep `categorizeCompanySegment(segment): CompanySegmentCategory` in place.
- Keep the same buckets and keyword-matching logic.
- Keep event payload and form behavior unchanged.

### 3) Test Contract Reuse

In `tests/unit/tracking.test.ts`:

- Reuse `CompanySegmentCategory` from `@/lib/tracking` in the lead-success test data.
- Do not alter expected runtime behavior.

### 4) Documentation Consistency

Update `docs/gtm-tagging-strategy.md` to explicitly list `company_segment` allowed values:

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

Also reinforce that `company_segment` must not contain free text.

Update historical internal documents:

- `docs/superpowers/specs/2026-05-16-gtm-datalayer-strategy-design.md`
- `docs/superpowers/plans/2026-05-16-gtm-datalayer-strategy.md`

Replace wording that implies free string for `company_segment` with the normalized bucket contract.

## Verification Plan

After implementation:

1. `npm run typecheck`
2. `npm run test -- tests/unit/tracking.test.ts`

Expected outcome:

- `LeadEventPayload.company_segment` no longer accepts free string.
- `ContactForm` compiles using central type.
- Tracking tests pass without behavior changes.
- Docs match the enforced taxonomy.

## Risks and Mitigation

Risk:
- Historical docs may still contain old examples with display text like `Varejo`.

Mitigation:
- Normalize examples to lowercase bucket codes and explicitly state bucket-only contract.

Risk:
- Accidental behavior changes while touching `ContactForm`.

Mitigation:
- Limit edits to type import/local type removal; avoid event or UI code changes.

## Acceptance Mapping

- `company_segment` no longer free string in tracking payload type: covered by `tracking.ts` design.
- `ContactForm` uses centralized type: covered by `ContactForm` integration.
- No free-text description in docs: covered by documentation updates.
- Typecheck and tracking tests pass: covered by verification plan.
