# GTM DataLayer Strategy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize public-site analytics in Google Tag Manager through typed `dataLayer` events, remove direct Meta Pixel code, and document the GTM setup.

**Architecture:** Keep `src/app/layout.tsx` as a Server Component and isolate browser analytics behavior in small Client Components. Use `src/lib/tracking.ts` as the single event contract and add a thin `TrackedLink` only where server-rendered pages need click handlers.

**Tech Stack:** Next.js 16.2.4 App Router, React 19, TypeScript, GTM `dataLayer`, Vitest, ESLint.

---

## File Structure

- Modify: `src/lib/tracking.ts` for typed event payloads and compatibility.
- Create: `src/components/tracking/PageViewTracker.tsx` for route-change page views.
- Create: `src/components/tracking/TrackedLink.tsx` for tracked links inside Server Components.
- Modify: `src/app/layout.tsx` for env-driven GTM, Pixel removal, and tracker mount.
- Modify: `src/components/marketing/ContactForm.tsx` for lead funnel events and privacy-safe success payload.
- Modify: `src/components/marketing/HeroActions.tsx` and `src/components/layout/Header.tsx` for helper-based client tracking.
- Modify: `src/components/marketing/CTABlock.tsx`, `src/components/layout/Footer.tsx`, `src/app/(public)/contato/page.tsx`, `src/app/(public)/page.tsx`, `src/app/(public)/blog/page.tsx`, `src/app/(public)/blog/[slug]/page.tsx`, and `src/app/(public)/servicos/[slug]/page.tsx` for public CTA/WhatsApp tracking.
- Create: `docs/gtm-tagging-strategy.md` for GTM implementation guidance.
- Create: `tests/unit/tracking.test.ts` for helper behavior and privacy boundary tests.

---

### Task 1: Add Tracking Contract Tests

**Files:**
- Create: `tests/unit/tracking.test.ts`
- Read: `tests/unit/setup.ts`
- Modify later: `src/lib/tracking.ts`

- [ ] **Step 1: Create failing tests for tracking helpers**

Create `tests/unit/tracking.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  trackCtaClick,
  trackEvent,
  trackLeadEvent,
  trackPageView,
  trackWhatsappClick,
} from "@/lib/tracking";

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

describe("tracking helpers", () => {
  beforeEach(() => {
    window.dataLayer = [];
  });

  afterEach(() => {
    delete window.dataLayer;
    vi.restoreAllMocks();
  });

  it("keeps trackEvent compatibility", () => {
    trackEvent("legacy_event", { location: "test" });

    expect(window.dataLayer).toEqual([
      { event: "legacy_event", location: "test" },
    ]);
  });

  it("pushes page_view payload", () => {
    trackPageView({
      page_path: "/contato?utm_source=test",
      page_location: "https://www.rc2solucoes.com.br/contato?utm_source=test",
      page_title: "Contato",
    });

    expect(window.dataLayer).toEqual([
      {
        event: "page_view",
        page_path: "/contato?utm_source=test",
        page_location: "https://www.rc2solucoes.com.br/contato?utm_source=test",
        page_title: "Contato",
      },
    ]);
  });

  it("pushes cta_click payload", () => {
    trackCtaClick({
      location: "header",
      label: "diagnostico_gratuito",
      destination: "/contato",
    });

    expect(window.dataLayer).toEqual([
      {
        event: "cta_click",
        location: "header",
        label: "diagnostico_gratuito",
        destination: "/contato",
      },
    ]);
  });

  it("pushes whatsapp_click payload", () => {
    trackWhatsappClick({
      location: "footer",
      label: "whatsapp",
      destination: "https://wa.me/5511988028550",
    });

    expect(window.dataLayer).toEqual([
      {
        event: "whatsapp_click",
        location: "footer",
        label: "whatsapp",
        destination: "https://wa.me/5511988028550",
      },
    ]);
  });

  it("pushes lead success without personal data", () => {
    trackLeadEvent("generate_lead_success", {
      form_name: "diagnostico_gratuito",
      lead_source: "website",
      solution_interest: "Automações com IA",
      company_size: "11-50 colaboradores",
      company_segment: "varejo",
    });

    const [event] = window.dataLayer ?? [];
    expect(event).toEqual({
      event: "generate_lead_success",
      form_name: "diagnostico_gratuito",
      lead_source: "website",
      solution_interest: "Automações com IA",
      company_size: "11-50 colaboradores",
      company_segment: "varejo",
    });
    expect(Object.keys(event)).not.toEqual(
      expect.arrayContaining(["name", "email", "phone", "whatsapp", "message", "ip"])
    );
  });
});
```

- [ ] **Step 2: Run the new test to verify it fails**

Run:

```bash
npm run test -- tests/unit/tracking.test.ts
```

Expected: FAIL because `trackPageView`, `trackCtaClick`, `trackWhatsappClick`, and `trackLeadEvent` are not exported yet.

- [ ] **Step 3: Commit the failing test if following strict TDD checkpoints**

```bash
git add tests/unit/tracking.test.ts
git commit -m "test: cover datalayer tracking helpers"
```

---

### Task 2: Implement Tracking Helpers

**Files:**
- Modify: `src/lib/tracking.ts`
- Test: `tests/unit/tracking.test.ts`

- [ ] **Step 1: Replace `src/lib/tracking.ts` with typed helpers**

Use this implementation:

```ts
"use client";

export type DataLayerValue = string | number | boolean | null | undefined;
export type DataLayerPayload = Record<string, DataLayerValue>;

export type LeadEventName =
  | "generate_lead_start"
  | "generate_lead_step_1"
  | "generate_lead_submit"
  | "generate_lead_success";

export type DataLayerEventName =
  | "page_view"
  | "cta_click"
  | "whatsapp_click"
  | LeadEventName
  | (string & {});

export interface PageViewPayload extends DataLayerPayload {
  page_path: string;
  page_location: string;
  page_title: string;
}

export interface CtaClickPayload extends DataLayerPayload {
  location: string;
  label: string;
  destination: string;
}

export interface WhatsappClickPayload extends DataLayerPayload {
  location: string;
  label: string;
  destination: string;
}

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

export interface LeadEventPayload extends DataLayerPayload {
  form_name?: "diagnostico_gratuito";
  lead_source?: "website";
  solution_interest?: string;
  company_size?: string;
  company_segment?: CompanySegmentCategory;
}

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

function pushDataLayer(event: DataLayerEventName, payload: DataLayerPayload = {}) {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({
    event,
    ...payload,
  });
}

export function trackEvent(event: string, payload: DataLayerPayload = {}) {
  pushDataLayer(event, payload);
}

export function trackPageView(payload: PageViewPayload) {
  pushDataLayer("page_view", payload);
}

export function trackCtaClick(payload: CtaClickPayload) {
  pushDataLayer("cta_click", payload);
}

export function trackWhatsappClick(payload: WhatsappClickPayload) {
  pushDataLayer("whatsapp_click", payload);
}

export function trackLeadEvent(eventName: LeadEventName, payload: LeadEventPayload = {}) {
  pushDataLayer(eventName, payload);
}
```

- [ ] **Step 2: Run tracking helper tests**

Run:

```bash
npm run test -- tests/unit/tracking.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run typecheck for helper types**

Run:

```bash
npm run typecheck
```

Expected: PASS or only unrelated pre-existing errors. If errors mention `DataLayerPayload`, adjust payload values to `string | number | boolean | null | undefined`.

- [ ] **Step 4: Commit tracking helper implementation**

```bash
git add src/lib/tracking.ts tests/unit/tracking.test.ts
git commit -m "feat: add typed datalayer tracking helpers"
```

---

### Task 3: Add Page View Tracker And Layout GTM Cleanup

**Files:**
- Create: `src/components/tracking/PageViewTracker.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create `PageViewTracker`**

Create `src/components/tracking/PageViewTracker.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView } from "@/lib/tracking";

export function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;

    const queryString = searchParams.toString();
    const pagePath = queryString ? `${pathname}?${queryString}` : pathname;

    trackPageView({
      page_path: pagePath,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  return null;
}
```

- [ ] **Step 2: Update `src/app/layout.tsx` imports and GTM constant**

Add import:

```ts
import { PageViewTracker } from "@/components/tracking/PageViewTracker";
```

Add near `const BASE_URL = SITE_BASE_URL;`:

```ts
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? "GTM-MQF4K77";
```

- [ ] **Step 3: Replace GTM hardcoded values and remove Meta Pixel**

In the GTM iframe, use:

```tsx
src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
```

Replace the GTM script body with:

```tsx
__html: `window.dataLayer = window.dataLayer || [];
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`,
```

Delete the entire `<Script id="meta-pixel" ... />` block.

Delete the Meta Pixel `<noscript>` image block that references `facebook.com/tr`.

- [ ] **Step 4: Render page tracker inside `<body>`**

Place this after the GTM `<Script>` and before the skip link:

```tsx
<PageViewTracker />
```

- [ ] **Step 5: Run source scan for removed direct Meta Pixel**

Run:

```bash
rg -n "meta-pixel|fbq|facebook\.com/tr|connect\.facebook\.net" src
```

Expected: no output.

- [ ] **Step 6: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit layout/page tracking**

```bash
git add src/app/layout.tsx src/components/tracking/PageViewTracker.tsx
git commit -m "feat: load gtm from env and track page views"
```

---

### Task 4: Add TrackedLink For Server Components

**Files:**
- Create: `src/components/tracking/TrackedLink.tsx`

- [ ] **Step 1: Create `TrackedLink`**

Create `src/components/tracking/TrackedLink.tsx`:

```tsx
"use client";

import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import { trackCtaClick, trackWhatsappClick } from "@/lib/tracking";

type TrackingKind = "cta" | "whatsapp";

type TrackedLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps | "onClick"> & {
    children: ReactNode;
    tracking: {
      kind: TrackingKind;
      location: string;
      label: string;
      destination?: string;
    };
    onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  };

function hrefToString(href: LinkProps["href"]) {
  return typeof href === "string" ? href : href.toString();
}

export function TrackedLink({ children, tracking, href, onClick, ...props }: TrackedLinkProps) {
  const destination = tracking.destination ?? hrefToString(href);

  return (
    <Link
      href={href}
      onClick={(event) => {
        if (tracking.kind === "whatsapp") {
          trackWhatsappClick({
            location: tracking.location,
            label: tracking.label,
            destination,
          });
        } else {
          trackCtaClick({
            location: tracking.location,
            label: tracking.label,
            destination,
          });
        }

        onClick?.(event);
      }}
      {...props}
    >
      {children}
    </Link>
  );
}
```

- [ ] **Step 2: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit TrackedLink**

```bash
git add src/components/tracking/TrackedLink.tsx
git commit -m "feat: add tracked link component"
```

---

### Task 5: Update Lead Funnel Tracking In ContactForm

**Files:**
- Modify: `src/components/marketing/ContactForm.tsx`

- [ ] **Step 1: Update tracking import**

Replace:

```ts
import { trackEvent } from "@/lib/tracking";
```

With:

```ts
import { trackLeadEvent, trackWhatsappClick } from "@/lib/tracking";
```

- [ ] **Step 2: Replace step 1 completion event**

Replace:

```ts
trackEvent("contact_step1_complete", { step: 1 });
```

With:

```ts
trackLeadEvent("generate_lead_step_1", { form_name: "diagnostico_gratuito" });
```

- [ ] **Step 3: Track submit attempt after Turnstile validation**

In `onSubmit`, after `setTurnstileError(null);` and before `fetch`, add:

```ts
trackLeadEvent("generate_lead_submit", { form_name: "diagnostico_gratuito" });
```

- [ ] **Step 4: Replace success events with non-personal payload**

Replace:

```ts
trackEvent("contact_step2_complete", { step: 2 });
trackEvent("contact_submit_success");
```

With:

```ts
trackLeadEvent("generate_lead_success", {
  form_name: "diagnostico_gratuito",
  lead_source: "website",
  solution_interest: data.solution,
  company_size: data.size,
  company_segment: categorizeCompanySegment(data.segment),
});
```

- [ ] **Step 5: Replace step start event**

Replace:

```ts
trackEvent("contact_step1_start", { step: 1 });
```

With:

```ts
trackLeadEvent("generate_lead_start", { form_name: "diagnostico_gratuito" });
```

- [ ] **Step 6: Track success-state WhatsApp link**

Add `onClick` to the success-state WhatsApp `<a>`:

```tsx
onClick={() =>
  trackWhatsappClick({
    location: "contact_form_success",
    label: "prefere_falar_agora_whatsapp",
    destination: "https://wa.me/5511988028550",
  })
}
```

- [ ] **Step 7: Scan ContactForm for personal analytics payloads**

Run:

```bash
rg -n "track.*(name|email|whatsapp|message|company)|contact_step|contact_submit" src/components/marketing/ContactForm.tsx
```

Expected: no output for old event names or personal-field tracking.

- [ ] **Step 8: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 9: Commit form tracking**

```bash
git add src/components/marketing/ContactForm.tsx
git commit -m "feat: update contact form lead tracking"
```

---

### Task 6: Update Client Components With New Helpers

**Files:**
- Modify: `src/components/marketing/HeroActions.tsx`
- Modify: `src/components/layout/Header.tsx`

- [ ] **Step 1: Update `HeroActions` import**

Replace:

```ts
import { trackEvent } from "@/lib/tracking";
```

With:

```ts
import { trackCtaClick, trackWhatsappClick } from "@/lib/tracking";
```

- [ ] **Step 2: Update `HeroActions` internal CTA click**

Replace the `/contato` click handler with:

```tsx
onClick={() =>
  trackCtaClick({
    location: `hero_${variant}`,
    label: "solicitar_diagnostico",
    destination: "/contato",
  })
}
```

- [ ] **Step 3: Update `HeroActions` WhatsApp click**

Replace the WhatsApp click handler with:

```tsx
onClick={() =>
  trackWhatsappClick({
    location: `hero_${variant}`,
    label: "falar_no_whatsapp",
    destination: WHATSAPP_URL,
  })
}
```

- [ ] **Step 4: Update `Header` import**

Replace:

```ts
import { trackEvent } from "@/lib/tracking";
```

With:

```ts
import { trackCtaClick } from "@/lib/tracking";
```

- [ ] **Step 5: Update desktop header CTA**

Replace desktop header CTA `onClick` with:

```tsx
onClick={() =>
  trackCtaClick({
    location: "header_desktop",
    label: "diagnostico_gratuito",
    destination: "/contato",
  })
}
```

- [ ] **Step 6: Update mobile header CTA**

Replace mobile header CTA `onClick` body with:

```tsx
onClick={() => {
  trackCtaClick({
    location: "header_mobile",
    label: "diagnostico_gratuito",
    destination: "/contato",
  });
  setOpen(false);
}}
```

- [ ] **Step 7: Run scan for old helper usage in updated files**

Run:

```bash
rg -n "trackEvent|cta_click_header|cta_click_hero" src/components/marketing/HeroActions.tsx src/components/layout/Header.tsx
```

Expected: no output.

- [ ] **Step 8: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 9: Commit client component tracking updates**

```bash
git add src/components/marketing/HeroActions.tsx src/components/layout/Header.tsx
git commit -m "feat: standardize header and hero tracking"
```

---

### Task 7: Update Server Components And Public Pages With TrackedLink

**Files:**
- Modify: `src/components/marketing/CTABlock.tsx`
- Modify: `src/components/layout/Footer.tsx`
- Modify: `src/app/(public)/contato/page.tsx`
- Modify: `src/app/(public)/page.tsx`
- Modify: `src/app/(public)/blog/page.tsx`
- Modify: `src/app/(public)/blog/[slug]/page.tsx`
- Modify: `src/app/(public)/servicos/[slug]/page.tsx`

- [ ] **Step 1: Update `CTABlock` to use `TrackedLink`**

Replace `import Link from "next/link";` with:

```ts
import { TrackedLink } from "@/components/tracking/TrackedLink";
```

Replace the primary and secondary links with `TrackedLink`, preserving their existing props/classes and adding:

```tsx
tracking={{
  kind: primaryHref.startsWith("https://wa.me") ? "whatsapp" : "cta",
  location: "cta_block_primary",
  label: primaryLabel.toLowerCase().replace(/\s+/g, "_"),
  destination: primaryHref,
}}
```

```tsx
tracking={{
  kind: secondaryHref.startsWith("https://wa.me") ? "whatsapp" : "cta",
  location: "cta_block_secondary",
  label: secondaryLabel.toLowerCase().replace(/\s+/g, "_"),
  destination: secondaryHref,
}}
```

- [ ] **Step 2: Update `Footer` WhatsApp and contact CTA**

Import:

```ts
import { TrackedLink } from "@/components/tracking/TrackedLink";
```

Use `TrackedLink` for the footer `/contato` link:

```tsx
<TrackedLink
  href={link.href}
  tracking={{ kind: "cta", location: "footer_empresa", label: "contato", destination: link.href }}
  className="ui-focus-ring rounded-sm text-sm text-rc2-sand/88 hover:text-rc2-sand hover:underline transition-colors"
>
  {link.label}
</TrackedLink>
```

Replace the footer WhatsApp `<a>` with:

```tsx
<TrackedLink
  href="https://wa.me/5511988028550"
  target="_blank"
  rel="noopener noreferrer"
  tracking={{
    kind: "whatsapp",
    location: "footer_contact",
    label: "whatsapp",
    destination: "https://wa.me/5511988028550",
  }}
  className="text-sm text-rc2-sand/88 hover:text-rc2-sand transition-colors"
>
  WhatsApp
</TrackedLink>
```

- [ ] **Step 3: Update contact page WhatsApp link**

In `src/app/(public)/contato/page.tsx`, import `TrackedLink` and replace the sidebar WhatsApp `<a>` with:

```tsx
<TrackedLink
  href="https://wa.me/5511988028550"
  target="_blank"
  rel="noopener noreferrer"
  tracking={{
    kind: "whatsapp",
    location: "contact_page_sidebar",
    label: "falar_pelo_whatsapp",
    destination: "https://wa.me/5511988028550",
  }}
  className="text-sm font-semibold text-rc2-orange underline underline-offset-4 hover:opacity-70 transition-opacity"
>
  Falar pelo WhatsApp →
</TrackedLink>
```

- [ ] **Step 4: Update home page standalone CTAs**

In `src/app/(public)/page.tsx`, import `TrackedLink`.

Replace the orange service-grid `/contato` CTA card `Link` with `TrackedLink`:

```tsx
<TrackedLink
  href="/contato"
  tracking={{ kind: "cta", location: "home_services_grid", label: "solicitar_diagnostico", destination: "/contato" }}
  className="group rc2-card rc2-card-hover flex flex-col justify-between p-6 bg-rc2-orange border-rc2-orange"
>
```

Replace the `/avaliacoes` button with `TrackedLink` and:

```tsx
tracking={{ kind: "cta", location: "home_reviews", label: "ver_avaliacoes_cases", destination: "/avaliacoes" }}
```

- [ ] **Step 5: Update blog index empty-state CTAs**

In `src/app/(public)/blog/page.tsx`, import `TrackedLink`.

Replace empty-state `/servicos` and `/contato` links with `TrackedLink` using:

```tsx
tracking={{ kind: "cta", location: "blog_empty_state", label: "explorar_servicos", destination: "/servicos" }}
```

```tsx
tracking={{ kind: "cta", location: "blog_empty_state", label: "solicitar_diagnostico", destination: "/contato" }}
```

- [ ] **Step 6: Update blog post share and CTA buttons**

In `src/app/(public)/blog/[slug]/page.tsx`, import `TrackedLink`.

Replace WhatsApp share `<a>` with:

```tsx
<TrackedLink
  href={`https://wa.me/?text=${encodedTitle}%20${encodeURIComponent(shareUrl)}`}
  target="_blank"
  rel="noopener noreferrer"
  tracking={{
    kind: "whatsapp",
    location: "blog_post_share",
    label: "share_whatsapp",
    destination: `https://wa.me/?text=${encodedTitle}%20${encodeURIComponent(shareUrl)}`,
  }}
  className="inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white text-sm font-medium rounded hover:bg-[#25D366]/90 transition-colors"
>
  WhatsApp
</TrackedLink>
```

For `ctaBlock.primaryButton`, replace `Link` with `TrackedLink` and:

```tsx
tracking={{
  kind: ctaBlock.primaryButton.url.startsWith("https://wa.me") ? "whatsapp" : "cta",
  location: "blog_post_cta_primary",
  label: ctaBlock.primaryButton.text.toLowerCase().replace(/\s+/g, "_"),
  destination: ctaBlock.primaryButton.url,
}}
```

For `ctaBlock.secondaryButton`, replace `Link` with `TrackedLink` and:

```tsx
tracking={{
  kind: ctaBlock.secondaryButton.url.startsWith("https://wa.me") ? "whatsapp" : "cta",
  location: "blog_post_cta_secondary",
  label: ctaBlock.secondaryButton.text.toLowerCase().replace(/\s+/g, "_"),
  destination: ctaBlock.secondaryButton.url,
}}
```

Replace the default `/contato` CTA with `TrackedLink` and:

```tsx
tracking={{ kind: "cta", location: "blog_post_default_cta", label: "solicitar_diagnostico", destination: "/contato" }}
```

- [ ] **Step 7: Update service detail CTAs**

In `src/app/(public)/servicos/[slug]/page.tsx`, import `TrackedLink`.

Replace both `/contato` CTA `Link` elements with `TrackedLink` using:

```tsx
tracking={{ kind: "cta", location: "service_detail_benefits", label: "solicitar_diagnostico", destination: "/contato" }}
```

```tsx
tracking={{ kind: "cta", location: "service_detail_mobile_repeat", label: "solicitar_diagnostico", destination: "/contato" }}
```

- [ ] **Step 8: Run public tracking scans**

Run:

```bash
rg -n "wa\.me" src/app src/components
rg -n "contact_step|contact_submit|cta_click_header|cta_click_hero|trackEvent\(" src
```

Expected: remaining `wa.me` references are tracked public links, constants used by tracked links, or admin/API files out of public analytics scope. Old event taxonomy has no output except `trackEvent` definition in `src/lib/tracking.ts`.

- [ ] **Step 9: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 10: Commit public CTA tracking updates**

```bash
git add src/components/marketing/CTABlock.tsx src/components/layout/Footer.tsx "src/app/(public)/contato/page.tsx" "src/app/(public)/page.tsx" "src/app/(public)/blog/page.tsx" "src/app/(public)/blog/[slug]/page.tsx" "src/app/(public)/servicos/[slug]/page.tsx"
git commit -m "feat: standardize public cta tracking"
```

---

### Task 8: Create GTM Tagging Strategy Documentation

**Files:**
- Create: `docs/gtm-tagging-strategy.md`

- [ ] **Step 1: Create documentation file**

Create `docs/gtm-tagging-strategy.md` with sections for:

```md
# GTM Tagging Strategy

## Container

- Production site: `https://www.rc2solucoes.com.br`
- GTM environment variable: `NEXT_PUBLIC_GTM_ID`
- Fallback GTM container: `GTM-MQF4K77`
- Measurement source: `window.dataLayer`

## DataLayer Events

| Event | When it fires | Parameters |
| --- | --- | --- |
| `page_view` | Initial hydration and route/search-param changes | `page_path`, `page_location`, `page_title` |
| `cta_click` | Public internal/commercial CTA click | `location`, `label`, `destination` |
| `whatsapp_click` | Public WhatsApp CTA/share click | `location`, `label`, `destination` |
| `generate_lead_start` | First meaningful focus in contact form step 1 | `form_name` |
| `generate_lead_step_1` | Step 1 validates and user advances to step 2 | `form_name` |
| `generate_lead_submit` | Valid form submit attempt after security check | `form_name` |
| `generate_lead_success` | `/api/contact` returns success | `form_name`, `lead_source`, `solution_interest`, `company_size`, `company_segment` |

`company_segment` is bucket-only and must be one of:
`varejo`, `saude`, `logistica`, `servicos`, `educacao`, `industria`, `tecnologia`, `financeiro`, `alimentacao`, `outro`.

## Privacy Rule

Do not send personal data to GTM, GA4, Google Ads, or Meta Pixel. The site analytics payload must not include name, email, phone, WhatsApp, company name, free-text message, IP address, Turnstile token, or raw form values.

## Data Layer Variables

Create DLVs for `page_path`, `page_location`, `page_title`, `location`, `label`, `destination`, `form_name`, `lead_source`, `solution_interest`, `company_size`, and `company_segment`.

## Triggers

Create Custom Event triggers for `page_view`, `cta_click`, `whatsapp_click`, `generate_lead_start`, `generate_lead_step_1`, `generate_lead_submit`, and `generate_lead_success`.

## GA4 Tags And Conversions

Create GA4 Event tags for every event above. Mark `generate_lead_success` and `whatsapp_click` as conversions/key events. Keep `generate_lead_start`, `generate_lead_step_1`, and `generate_lead_submit` as funnel diagnostics unless campaign reporting needs them as conversions.

## Google Ads Conversions

Use `generate_lead_success` as the primary lead conversion. Use `whatsapp_click` as a secondary conversion unless WhatsApp is the primary sales channel.

## Meta Pixel Via GTM

Configure Meta Pixel inside GTM, not in application code. Map `page_view` to `PageView`, `generate_lead_success` to `Lead`, and `whatsapp_click` to a custom `WhatsAppClick` event. Do not pass personal fields.

## Validation Checklist

- Use GTM Preview and Tag Assistant on the production domain.
- Confirm `page_view` on first load and route changes.
- Confirm `cta_click` for header, hero, footer, and CTA block links.
- Confirm `whatsapp_click` for WhatsApp links.
- Confirm `generate_lead_start`, `generate_lead_step_1`, `generate_lead_submit`, and `generate_lead_success` during a valid form flow.
- Inspect payloads and confirm no personal data is present.
- Confirm GA4, Google Ads, and Meta tags fire only on intended triggers.
```

- [ ] **Step 2: Commit documentation**

```bash
git add docs/gtm-tagging-strategy.md
git commit -m "docs: add gtm tagging strategy"
```

---

### Task 9: Full Verification

**Files:**
- Verify all modified files.

- [ ] **Step 1: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 2: Run lint**

Run:

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 3: Run unit tests**

Run:

```bash
npm run test
```

Expected: PASS. If runtime exceeds the session budget, stop after five minutes and record that it was skipped for duration with the last visible test output.

- [ ] **Step 4: Run final source scans**

Run:

```bash
rg -n "meta-pixel|fbq|facebook\.com/tr|connect\.facebook\.net" src
rg -n "contact_step|contact_submit|cta_click_header|cta_click_hero" src
rg -n "track.*(name|email|phone|whatsapp|message|ip)" src/lib src/components src/app
```

Expected: first two commands have no output. Third command may show `trackWhatsappClick` function names, but must not show personal field payloads being sent to analytics.

- [ ] **Step 5: Inspect git diff**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors. Status shows only intended files if not yet committed.

- [ ] **Step 6: Commit final verification adjustments if needed**

If any verification fix was needed, commit it:

```bash
git add src/lib/tracking.ts src/app/layout.tsx src/components/tracking/PageViewTracker.tsx src/components/tracking/TrackedLink.tsx src/components/marketing/ContactForm.tsx src/components/marketing/HeroActions.tsx src/components/layout/Header.tsx src/components/marketing/CTABlock.tsx src/components/layout/Footer.tsx "src/app/(public)/contato/page.tsx" "src/app/(public)/page.tsx" "src/app/(public)/blog/page.tsx" "src/app/(public)/blog/[slug]/page.tsx" "src/app/(public)/servicos/[slug]/page.tsx" docs/gtm-tagging-strategy.md tests/unit/tracking.test.ts
git commit -m "fix: complete gtm tracking verification"
```

If no files changed after previous commits, do not create an empty commit.

---

## Self-Review Notes

- GTM env fallback and direct Meta Pixel removal: Task 3.
- Typed helper contract and compatibility: Tasks 1 and 2.
- Page route tracking: Task 3.
- Root layout inclusion: Task 3.
- Contact form lead funnel and privacy: Task 5.
- Site-wide CTA/WhatsApp tracking: Tasks 6 and 7.
- GTM documentation: Task 8.
- Typecheck/lint/test verification: Task 9.
- Admin WhatsApp links remain out of public analytics scope.
- Backend lead persistence and notification stay unchanged.
- No direct GA4, Google Ads, or Meta Pixel code is added to the app.
