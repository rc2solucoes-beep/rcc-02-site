---
name: vercel-design-guidelines
description: Apply Vercel's Web Interface Guidelines as a practical quality checklist for web UI work. Use when designing, implementing, reviewing, or polishing React/Next.js interfaces, especially for interaction quality, accessibility, animation, layout, forms, performance, and production readiness.
---

# Vercel Design Guidelines

Use this skill as a concise operating checklist derived from Vercel's Web Interface Guidelines:
https://vercel.com/design/guidelines

If exact wording or a newly added rule matters, open the source page before relying on memory.

## Review workflow

1. Identify the user path being changed or reviewed.
2. Check keyboard, pointer, touch, screen-size, and reduced-motion behavior.
3. Prefer native semantics before ARIA. Links navigate; buttons act.
4. Fix product-blocking and accessibility defects before visual polish.
5. Verify the implemented result, not only the source code.

## Interaction checklist

- Every interactive element must be keyboard-operable.
- Focus states must be visible and not hidden behind sticky UI.
- Visual target and hit target must match; mobile controls need comfortable tap areas.
- Do not block paste, browser zoom, standard link behavior, or native form affordances.
- Async updates need clear loading, success, and error feedback.
- Destructive actions need confirmation or undo.
- Drag, swipe, and gesture interactions need click/tap/keyboard alternatives unless the gesture is essential.

## Animation checklist

- Honor `prefers-reduced-motion`.
- Prefer CSS for simple motion; avoid JS-driven animation unless it is necessary.
- Animate compositor-friendly properties such as `transform` and `opacity`.
- Avoid layout-triggering animation on `width`, `height`, `top`, `left`, or margins.
- Do not use `transition: all`.
- Motion must clarify cause/effect or add deliberate, nonessential delight.
- Autoplaying motion must be nonessential, muted when relevant, and stoppable if it competes with content.

## Layout and content checklist

- Verify mobile, laptop, and wide layouts.
- Prevent unwanted horizontal overflow.
- Align elements deliberately to grid, baseline, edge, or optical center.
- Set scroll margins for anchored headings below sticky headers.
- Keep content resilient to short, long, sparse, and dense states.
- Prefer curly quotes and proper ellipsis when editing copy, unless the project copy style says otherwise.
- Icon-only controls need accessible names.
- Decorative media must be hidden from assistive tech.

## Forms checklist

- Every control needs a label or accessible label.
- Let submission surface validation errors; avoid pre-disabling submit just because fields are incomplete.
- Disable only during actual submission and keep the original label visible with loading feedback.
- Put errors near their fields and focus the first error after submit.
- Use correct `type`, `inputmode`, `autocomplete`, and mobile-safe input font sizes.
- Do not block typing for formatting; accept input and validate with clear feedback.

## Performance checklist

- Avoid unnecessary re-renders and layout thrash.
- Use explicit image dimensions to reduce layout shift.
- Preload only critical assets.
- Lazy-load below-the-fold media.
- Keep client JavaScript proportional to the interface.
- Verify performance on representative devices or throttled conditions when the change is motion-heavy.
