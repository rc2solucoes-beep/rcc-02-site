# Design Spec: Visual Refinements RC2

**Date:** 2026-08-28  
**Status:** Approved  
**Scope:** 3 visual improvements across pages and components  
**Effort:** Medium (3-4 days)

---

## Overview

This spec addresses 3 key visual refinements identified in the comprehensive visual analysis:

1. **Reduce scroll reveals** on small/supporting text to minimize "dynamic AI-generated" feeling
2. **Add editorial depth to blog** with featured images, gradient overlays, and metadata
3. **Differentiate CTABlock** by journey stage — home, services, contact have unique messaging

Result: Site maintains sobriety and elegance while gaining visual hierarchy and narrative clarity.

---

## 1. Reduce Scroll Reveals to Fade-in

### Current State
- **ScrollReveal** applied to: h1, h2, h3, paragraphs, lists, cards, meta text
- Direction varies: `up`, `left`, `right`, `none`
- Delays: 0-280ms staggered across each section
- Effect: Constant motion, reads as "very dynamic"

### Target State
- **Remove ScrollReveal** from: descriptive paragraphs, list items, small text, meta
- **Keep ScrollReveal** on: h1/h2, ServiceCard, large thematic blocks
- **New FadeIn component** for text-only elements: simple opacity transition, no transform

### Implementation Details

#### Create `FadeIn` component
```
File: src/components/ui/FadeIn.tsx
Props:
  - children: ReactNode
  - delay?: number (ms, default 0)
  - duration?: number (ms, default 400)
  - className?: string

Behavior:
  - CSS @keyframes fade-in: opacity 0 → 1
  - Applies on mount (no intersection observer needed for small text)
  - Respects prefers-reduced-motion

Export: FadeIn
```

#### Replace in these components:
1. **Homepage** (`src/app/(public)/page.tsx`)
   - Paragraphs in "Para quem é" section → FadeIn
   - List items (forWhomItems) → FadeIn
   - "Escolha pela dor" problem descriptions → FadeIn
   - Social proof cards text → FadeIn

2. **PageHero** (`src/components/marketing/PageHero.tsx`)
   - Description paragraph → FadeIn
   - Keep h1 with ScrollReveal

3. **ServiceCard** (`src/components/marketing/ServiceCard.tsx`)
   - Summary text → FadeIn
   - "Resolve:" text → FadeIn
   - Keep card itself with ScrollReveal

4. **CTABlock** (all variants)
   - Description paragraph → FadeIn
   - Keep h2 with ScrollReveal

#### ScrollReveal remains on:
- All h1/h2 tags
- ServiceCard containers
- Major section blocks
- HomeReviews component

### Success Criteria
- ✓ Small text appears naturally without "wave" animation
- ✓ Large headings still have entrance energy (scroll reveal)
- ✓ Overall motion feels intentional, not constant
- ✓ Page still feels alive (not static)

---

## 2. Blog Editorial Enhancement

### Current State
- Blog page loads Google Reviews component
- No featured images
- Minimal meta information
- Feels incomplete/placeholder

### Target State
- List of blog posts with **horizontal card layout**
- Featured image on left (300×200px) with dark gradient overlay
- Title, summary, author, date, reading time on right
- Proper editorial presentation
- Mobile: stack vertical (image full-width on top)

### Implementation Details

#### Create `BlogCard` component
```
File: src/components/blog/BlogCard.tsx

Interface:
{
  image: string;           // featured_url from DB
  title: string;           // post title
  summary: string;         // post summary (2-3 lines)
  slug: string;            // for link href
  author: string;          // post.author_name
  publishedAt: Date;       // post.published_at
  readingTimeMinutes: number; // post.reading_time_minutes
  category?: string;       // optional badge
}

Layout:
Desktop (1280px+):
  ┌─ img 300×200 ─┬─ h3: title ────────────────┐
  │ + overlay     │ p: summary (2-3 lines)      │
  │               │ meta: author · date · read  │
  │               │ [link] Ler artigo →         │
  └───────────────┴─────────────────────────────┘

Tablet (768-1279px):
  Same, but img 250×160

Mobile (0-767px):
  [img 100%]
  [h3: title]
  [p: summary]
  [meta: author · date · read]
  [link]

Styling:
  - Card border: 1px var(--rc2-border)
  - Card bg: var(--rc2-surface)
  - Image: object-cover, aspect 300×200
  - Overlay: linear-gradient(180deg, transparent 0%, rgba(11,23,38,0.4) 100%)
  - Hover: border-color darken, shadow lift
  - No ScrollReveal (use FadeIn)
```

#### Update Blog page
```
File: src/app/(public)/blog/page.tsx

Changes:
1. Import BlogCard component
2. Remove Google Reviews component
3. Map posts array:
   posts.map(post => <BlogCard {...post} />)
4. Grid: 1 column (full width cards stacked)
5. Add section margin-top: 3rem

Empty state:
  Keep current "Ainda não há artigos publicados" message
```

#### Database query (no change needed)
```
Already fetches:
  - id, slug, title, summary (description)
  - cover_url (featured image)
  - published_at, created_at
  - reading_time_minutes

Add to query if missing:
  - author_name (or author relationship)
```

### Success Criteria
- ✓ Blog listage is visually complete (not placeholder)
- ✓ Featured images add editorial credibility
- ✓ Meta info (author, date, read time) visible at glance
- ✓ Card hover state provides interaction feedback
- ✓ Responsive on mobile (image stacks on top)

---

## 3. Differentiate CTABlock by Journey Stage

### Current State
- Single `CTABlock` component with `variant="dark" | "orange"`
- Used identically on: home, services, contact, about, solutions, blog
- Generic messaging ("Descobrir onde a IA pode gerar resultado")
- Doesn't signal page context or next step

### Target State
- 3 explicit components: `HomeCtaBlock`, `ServicesCtaBlock`, `ContactCtaBlock`
- Each optimized for its page's stage in user journey
- Unique copy, CTAs, and visual hints
- Signals progress (discovery → consideration → action)

### Implementation Details

#### HomeCtaBlock
```
File: src/components/marketing/HomeCtaBlock.tsx

Purpose: Invite exploration and diagnosis

Content:
  Title: "Quer descobrir onde a IA pode gerar resultado na sua empresa?"
  Description: "Solicite um diagnóstico inicial e receba um mapa de oportunidades para automatizar atendimento, vendas e processos."
  
  Button 1 (primary):
    Label: "Começar pelo diagnóstico"
    href: "/contato"
    tracking: { kind: "cta", location: "home_cta", label: "diagnose" }
  
  Button 2 (secondary):
    Label: "Falar pelo WhatsApp →"
    href: "https://wa.me/5511988028550?text=..."
    tracking: { kind: "whatsapp", location: "home_cta" }

Variant: dark (navy background)
Blueprint: rc2-blueprint-dark opacity-60
```

#### ServicesCtaBlock
```
File: src/components/marketing/ServicesCtaBlock.tsx

Purpose: Move from exploration to decision

Content:
  Title: "Pronto para modernizar sua operação?"
  Description: "Escolha o serviço que mais se alinha com seu desafio. Começamos pelo diagnóstico e entregamos resultado."
  
  Button 1 (primary):
    Label: "Ver todas as soluções"
    href: "/solucoes"
    tracking: { kind: "cta", location: "services_cta", label: "solutions" }
  
  Button 2 (secondary):
    Label: "Agendar conversa →"
    href: "/contato"
    tracking: { kind: "cta", location: "services_cta", label: "contact" }

Variant: dark
```

#### ContactCtaBlock
```
File: src/components/marketing/ContactCtaBlock.tsx

Purpose: Confirm action taken, enable follow-up

Content:
  Title: "Já enviou sua demanda?"
  Description: "Nos próximos dias, você receberá um diagnóstico detalhado com um mapa de oportunidades e próximos passos acionáveis."
  
  Button 1 (primary):
    Label: "Voltar para home"
    href: "/"
    tracking: { kind: "cta", location: "contact_cta", label: "home" }
  
  Button 2 (secondary):
    Label: "Falar direto com Robson →"
    href: "https://wa.me/5511988028550?text=Já+enviei+a+demanda..."
    tracking: { kind: "whatsapp", location: "contact_cta" }

Variant: orange (accent background for distinction)
  - bg: var(--rc2-brand) instead of var(--rc2-dark)
  - text: var(--rc2-heading) on orange
```

#### Base component (extract common logic)
```
File: src/components/marketing/CTABlockBase.tsx

Shared interface:
{
  title: string;
  description?: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  variant?: "dark" | "orange";
  hideSecondary?: boolean;
}

All three blocks import and extend this.
```

#### Page updates
```
Homepage: src/app/(public)/page.tsx
  Import: import { HomeCtaBlock } from "@/components/marketing/HomeCtaBlock"
  Replace: <CTABlock ... /> → <HomeCtaBlock />

Services page: src/app/(public)/servicos/page.tsx
  Import: import { ServicesCtaBlock } from "@/components/marketing/ServicesCtaBlock"
  Replace: <CTABlock ... /> → <ServicesCtaBlock />

Contact page: src/app/(public)/contato/page.tsx
  Import: import { ContactCtaBlock } from "@/components/marketing/ContactCtaBlock"
  Replace: <CTABlock ... /> → <ContactCtaBlock />

Other pages (About, Solutions, Blog):
  Keep: <HomeCtaBlock /> (standard default)
```

### Success Criteria
- ✓ Each page signals its journey stage through CTA messaging
- ✓ Contact page feels like destination, not redirect
- ✓ Orange variant on contact page provides visual distinction
- ✓ No duplicated logic (base component shared)
- ✓ Tracking properly attributes CTAs to page context

---

## Files Changed Summary

### New Files
- `src/components/ui/FadeIn.tsx` — Simple fade-in wrapper
- `src/components/blog/BlogCard.tsx` — Editorial blog card layout
- `src/components/marketing/CTABlockBase.tsx` — Shared CTA logic
- `src/components/marketing/HomeCtaBlock.tsx` — Journey stage: discovery
- `src/components/marketing/ServicesCtaBlock.tsx` — Journey stage: consideration
- `src/components/marketing/ContactCtaBlock.tsx` — Journey stage: action

### Modified Files
- `src/app/(public)/page.tsx` — Replace CTABlock with HomeCtaBlock
- `src/app/(public)/servicos/page.tsx` — Replace CTABlock with ServicesCtaBlock
- `src/app/(public)/contato/page.tsx` — Replace CTABlock with ContactCtaBlock
- `src/app/(public)/blog/page.tsx` — Replace Google Reviews with BlogCard grid, remove ScrollReveal from meta
- `src/components/marketing/PageHero.tsx` — Replace description paragraph ScrollReveal with FadeIn
- `src/components/marketing/ServiceCard.tsx` — Replace summary/resolve text ScrollReveal with FadeIn
- `src/components/marketing/HomeReviews.tsx` — Review ScrollReveal usage, replace small text as needed

### No Changes
- Design system tokens (colors, spacing remain constant)
- Typography scale
- Overall layout structure

---

## Testing Checklist

### Visual Testing
- [ ] FadeIn component works on all supported browsers
- [ ] Blog card layout responsive (desktop, tablet, mobile)
- [ ] Featured images load (fallback if missing)
- [ ] Gradient overlay readable on light/dark images
- [ ] CTABlock variants render correctly
- [ ] Contact page orange background doesn't break contrast

### Functional Testing
- [ ] All internal links (/contato, /solucoes, /) work
- [ ] WhatsApp links encode message correctly
- [ ] Tracking events fire for each CTA variant
- [ ] Blog empty state displays correctly
- [ ] prefers-reduced-motion respected in FadeIn

### Accessibility Testing
- [ ] Focus ring visible on all buttons
- [ ] Link contrast WCAG AA
- [ ] Image alt text present (cover_url_alt in DB)
- [ ] Heading hierarchy correct

---

## Rollback Plan

If issues arise post-deploy:

1. **FadeIn breaking animation:** Keep `scroll-reveal` class on elements, revert to ScrollReveal component
2. **Blog images not loading:** Fallback to placeholder div with brand gradient
3. **CTA tracking broken:** Revert to single CTABlock component, update tracking attributes

All changes are isolated by component, rollback is per-feature.

---

## Success Metrics

Post-launch (2 weeks):

- ✓ Time-on-page blog increases 20%+
- ✓ CTR on contact CTA from contact page increases 15%+
- ✓ Visual audit: site scores lower on "AI-generated feeling" (subjective, internal)
- ✓ No regression on other pages (home, services continue converting)
- ✓ Mobile responsiveness maintained (Lighthouse mobile score +2-3 points)
