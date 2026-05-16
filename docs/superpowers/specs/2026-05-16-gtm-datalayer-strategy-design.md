# GTM DataLayer Strategy Design

Date: 2026-05-16
Repository: rsazevedo82/rcc-02-site
Site: https://www.rc2solucoes.com.br
Next.js: 16.2.4 App Router

## Goal

Centralize public-site measurement in Google Tag Manager through `window.dataLayer`, while preserving the existing GTM container fallback (`GTM-MQF4K77`) and removing direct Meta Pixel code from the application.

The implementation must avoid sending personal data to `dataLayer`. Contact form submission to the backend remains unchanged, but analytics events must only include non-personal categorical metadata.

## Chosen Approach

Use the global pragmatic approach:

- Keep a single tracking helper module in `src/lib/tracking.ts`.
- Keep compatibility with existing `trackEvent(event, payload)` calls.
- Add typed helper functions for the new event taxonomy.
- Add a small client-only page view tracker component mounted in the root layout.
- Update public-site CTA and WhatsApp links across the site, not only the initially named files.
- Avoid refactoring all links into a new wrapper component in this pass.

This balances consistency with low implementation risk. A full `TrackedLink` abstraction can be added later if the site grows enough to justify it.

## Next.js Constraints

`src/app/layout.tsx` remains a Server Component. Browser-only route tracking is isolated in a dedicated Client Component, following the Next.js 16 guidance that client boundaries should be kept small when adding analytics behavior.

Relevant local documentation checked:

- `node_modules/next/dist/docs/01-app/02-guides/analytics.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`

## Layout And GTM

`src/app/layout.tsx` will:

- Resolve `const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? "GTM-MQF4K77"`.
- Use that value in the GTM `<noscript>` iframe URL.
- Use that value in the GTM script snippet.
- Ensure `window.dataLayer = window.dataLayer || []` is initialized before the GTM script is loaded.
- Remove the hardcoded Meta Pixel `<Script>` block.
- Remove the Meta Pixel `<noscript><img /></noscript>` block.
- Render `<PageViewTracker />` inside `<body>` without changing the visual structure.

## Tracking Contract

`src/lib/tracking.ts` will define basic event types and payload types:

- `DataLayerEventName`
- `PageViewPayload`
- `CtaClickPayload`
- `WhatsappClickPayload`
- `LeadEventPayload`

It will expose:

- `trackEvent(event, payload)` for backwards compatibility.
- `trackPageView(payload)` for `page_view`.
- `trackCtaClick(payload)` for `cta_click`.
- `trackWhatsappClick(payload)` for `whatsapp_click`.
- `trackLeadEvent(eventName, payload)` for lead funnel events.

Allowed lead event names:

- `generate_lead_start`
- `generate_lead_step_1`
- `generate_lead_submit`
- `generate_lead_success`

Allowed lead success fields:

- `form_name`
- `lead_source`
- `solution_interest`
- `company_size`
- `company_segment`

`company_segment` must use only these normalized buckets:

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

The helper will not add user identifiers, names, emails, phone numbers, WhatsApp numbers, messages, IP addresses, or raw form fields by default.

## Page Tracking

Create `src/components/tracking/PageViewTracker.tsx` as a Client Component.

It will use:

- `usePathname` from `next/navigation`
- `useSearchParams` from `next/navigation`
- `useEffect` from React

On initial hydration and every route/search-param change, it will push:

```ts
{
  event: "page_view",
  page_path,
  page_location,
  page_title,
}
```

`page_path` includes the pathname and query string. `page_location` uses `window.location.href`. `page_title` uses `document.title`.

## Form Funnel

`src/components/marketing/ContactForm.tsx` will keep its current two-step UX and backend submission behavior.

Analytics changes:

- First meaningful focus in step 1 sends `generate_lead_start`.
- Successful transition from step 1 to step 2 sends `generate_lead_step_1`.
- Submit attempt after client-side/security checks sends `generate_lead_submit`.
- Successful API response sends `generate_lead_success`.

The success payload will be limited to:

```ts
{
  form_name: "diagnostico_gratuito",
  lead_source: "website",
  solution_interest: data.solution,
  company_size: data.size,
  company_segment: categorizeCompanySegment(data.segment),
}
```

No name, email, phone, WhatsApp, company name, message, IP, or Turnstile token will be sent to `dataLayer`.

## CTA And WhatsApp Tracking Scope

Public-site links will use the new helpers:

- Internal commercial CTAs: `trackCtaClick({ location, label, destination })`
- WhatsApp links: `trackWhatsappClick({ location, label, destination })`

Initial file targets:

- `src/components/marketing/HeroActions.tsx`
- `src/components/layout/Header.tsx`
- `src/components/marketing/CTABlock.tsx`
- `src/components/layout/Footer.tsx`
- `src/components/marketing/ContactForm.tsx` success-state WhatsApp link
- `src/app/(public)/contato/page.tsx`
- `src/app/(public)/page.tsx`
- `src/app/(public)/blog/page.tsx`
- `src/app/(public)/blog/[slug]/page.tsx`
- `src/app/(public)/servicos/[slug]/page.tsx`

Admin lead WhatsApp links are out of scope for public analytics because they expose personal lead context and are not part of public acquisition measurement.

## Documentation

Create `docs/gtm-tagging-strategy.md` with:

- dataLayer events and parameters
- GTM tags to create
- GTM triggers
- dataLayer variables
- GA4 conversion recommendations
- Google Ads conversion recommendations
- Meta Pixel setup note inside GTM
- Preview/Tag Assistant validation checklist

## Testing And Verification

Run after implementation:

- `npm run typecheck`
- `npm run lint`
- `npm run test`, unless it proves excessive for the session

Manual validation checklist:

- GTM still loads with `NEXT_PUBLIC_GTM_ID` or fallback `GTM-MQF4K77`.
- Meta Pixel code is absent from direct source output.
- `page_view` appears on initial load and route changes.
- CTA clicks push `cta_click` with `location`, `label`, and `destination`.
- WhatsApp clicks push `whatsapp_click` with `location`, `label`, and `destination`.
- Contact form funnel pushes the four lead events.
- Lead success does not include personal data.
- Form submission still reaches `/api/contact` successfully.

## Out Of Scope

- Rebuilding the GTM container through an API.
- Adding a reusable `TrackedLink` abstraction.
- Changing backend lead persistence or email notification logic.
- Tracking admin-area interactions.
- Adding GA4 or Meta Pixel code directly to the app.
