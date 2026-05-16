# GTM Tagging Strategy

This guide is for configuring Google Tag Manager for the public RC2 site. The app only pushes privacy-safe events to `window.dataLayer`; GA4, Google Ads, and Meta Pixel should all be configured in GTM.

## Container

- Production site: `https://www.rc2solucoes.com.br`
- GTM environment variable: `NEXT_PUBLIC_GTM_ID`
- Fallback GTM container: `GTM-MQF4K77`
- Measurement source: `window.dataLayer`
- App responsibility: load the GTM container and push typed `dataLayer` events
- GTM responsibility: route those events to GA4, Google Ads, and Meta Pixel

Use the production GTM container for the live domain. For preview or staging environments, set `NEXT_PUBLIC_GTM_ID` to the appropriate GTM environment/container ID before deployment. If the environment variable is not set, the app falls back to `GTM-MQF4K77`.

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

Example `page_view` payload:

```js
window.dataLayer.push({
  event: "page_view",
  page_path: "/contato",
  page_location: "https://www.rc2solucoes.com.br/contato",
  page_title: "Contato | RC2 Solucoes",
});
```

`page_path` and `page_location` are sanitized. They include only the pathname and origin plus pathname respectively, with no query string or fragment.

Example lead success payload:

```js
window.dataLayer.push({
  event: "generate_lead_success",
  form_name: "diagnostico_gratuito",
  lead_source: "website",
  solution_interest: "Automacoes com IA",
  company_size: "11-50 colaboradores",
  company_segment: "varejo",
});
```

## Privacy Rule

Do not send personal data to GTM, GA4, Google Ads, or Meta Pixel.

Analytics payloads must not include:

- Name
- Email
- Phone
- WhatsApp number
- Company name
- Free-text message
- IP address
- Turnstile token
- Raw free text or raw form values

`company_segment` is allowed because it is a normalized bucket code such as `varejo`, not a raw company name, display label, or free-text company description. Keep `solution_interest`, `company_size`, and `company_segment` restricted to controlled form choices or normalized buckets.

## GTM Data Layer Variables

Create these Data Layer Variables in GTM with Version 2 enabled:

| Variable name | Data Layer Variable Name | Used by |
| --- | --- | --- |
| `DLV - page_path` | `page_path` | GA4 `page_view` |
| `DLV - page_location` | `page_location` | GA4 `page_view` |
| `DLV - page_title` | `page_title` | GA4 `page_view` |
| `DLV - location` | `location` | CTA, WhatsApp, lead diagnostics |
| `DLV - label` | `label` | CTA and WhatsApp labels |
| `DLV - destination` | `destination` | CTA and WhatsApp destination URLs |
| `DLV - form_name` | `form_name` | Lead funnel events |
| `DLV - lead_source` | `lead_source` | Lead success attribution |
| `DLV - solution_interest` | `solution_interest` | Lead success segmentation |
| `DLV - company_size` | `company_size` | Lead success segmentation |
| `DLV - company_segment` | `company_segment` | Lead success segmentation |

Do not create DLVs for blocked personal fields. If a personal field appears in Preview mode, treat it as an implementation defect before publishing the GTM workspace.

## Custom Event Triggers

Create one Custom Event trigger per `dataLayer` event:

| Trigger name | Trigger type | Event name | Fires on |
| --- | --- | --- | --- |
| `CE - page_view` | Custom Event | `page_view` | All Custom Events |
| `CE - cta_click` | Custom Event | `cta_click` | All Custom Events |
| `CE - whatsapp_click` | Custom Event | `whatsapp_click` | All Custom Events |
| `CE - generate_lead_start` | Custom Event | `generate_lead_start` | All Custom Events |
| `CE - generate_lead_step_1` | Custom Event | `generate_lead_step_1` | All Custom Events |
| `CE - generate_lead_submit` | Custom Event | `generate_lead_submit` | All Custom Events |
| `CE - generate_lead_success` | Custom Event | `generate_lead_success` | All Custom Events |

Keep trigger names explicit so Tag Assistant traces are easy to read during campaign debugging.

## GA4 Event Tags And Conversions

Create a GA4 Configuration tag if the container does not already have one. Then create GA4 Event tags for every event above.

Recommended GA4 Event tag mapping:

| GTM tag | GA4 event name | Trigger | Event parameters |
| --- | --- | --- | --- |
| `GA4 - page_view` | `page_view` | `CE - page_view` | `page_path`, `page_location`, `page_title` |
| `GA4 - cta_click` | `cta_click` | `CE - cta_click` | `location`, `label`, `destination` |
| `GA4 - whatsapp_click` | `whatsapp_click` | `CE - whatsapp_click` | `location`, `label`, `destination` |
| `GA4 - generate_lead_start` | `generate_lead_start` | `CE - generate_lead_start` | `form_name` |
| `GA4 - generate_lead_step_1` | `generate_lead_step_1` | `CE - generate_lead_step_1` | `form_name` |
| `GA4 - generate_lead_submit` | `generate_lead_submit` | `CE - generate_lead_submit` | `form_name` |
| `GA4 - generate_lead_success` | `generate_lead_success` | `CE - generate_lead_success` | `form_name`, `lead_source`, `solution_interest`, `company_size`, `company_segment` |

Mark these as GA4 conversions/key events:

- `generate_lead_success`: primary lead conversion
- `whatsapp_click`: conversion/key event when WhatsApp conversations are commercially important

Keep these as funnel diagnostics unless campaign reporting specifically needs them as conversions:

- `generate_lead_start`
- `generate_lead_step_1`
- `generate_lead_submit`

## Google Ads Conversions

Configure Google Ads conversion tags in GTM rather than application code.

Recommended setup:

| Conversion | Trigger | Counting | Use |
| --- | --- | --- | --- |
| Primary lead | `CE - generate_lead_success` | One | Main lead form conversion |
| WhatsApp lead | `CE - whatsapp_click` | One | Secondary conversion unless WhatsApp is the primary sales channel |

Practical notes:

- Use `generate_lead_success` as the primary conversion action for lead-generation campaigns.
- Use `whatsapp_click` as a secondary conversion unless WhatsApp is the primary sales channel.
- Do not attach enhanced conversion fields unless the privacy and consent setup explicitly supports it. The current app payload does not send email, phone, name, or company name to GTM.
- Verify conversion linker setup in GTM before publishing Google Ads tags.

## Meta Pixel Via GTM

Configure Meta Pixel inside GTM, not in application code. The app should not include direct `fbq`, `connect.facebook.net`, or `facebook.com/tr` snippets.

Recommended Meta event mapping:

| DataLayer event | Meta Pixel event | Trigger | Parameters |
| --- | --- | --- | --- |
| `page_view` | `PageView` | `CE - page_view` | None required |
| `generate_lead_success` | `Lead` | `CE - generate_lead_success` | Optional non-personal segmentation only |
| `whatsapp_click` | `WhatsAppClick` custom event | `CE - whatsapp_click` | `location`, `label`, `destination` |

Do not pass name, email, phone, WhatsApp number, company name, message, IP address, token, or raw free text to Meta Pixel.

## Preview And Tag Assistant Validation Checklist

Before publishing a GTM workspace, use GTM Preview and Tag Assistant on `https://www.rc2solucoes.com.br`.

Validate event collection:

- Confirm `page_view` fires on first load.
- Confirm `page_view` fires on client-side route changes.
- Confirm `page_view` does not include query strings or fragments in `page_path` or `page_location`.
- Confirm `cta_click` fires for header, hero, footer, service grid, blog, and CTA block links.
- Confirm `whatsapp_click` fires for WhatsApp links and WhatsApp share links.
- Confirm `generate_lead_start` fires when the user starts the contact form.
- Confirm `generate_lead_step_1` fires after step 1 validates and advances.
- Confirm `generate_lead_submit` fires only after the security check passes and submit is attempted.
- Confirm `generate_lead_success` fires only after `/api/contact` returns success.

Validate payload privacy:

- Inspect every event payload in Preview mode.
- Confirm no name, email, phone, WhatsApp number, company name, message, IP address, Turnstile token, or raw free text is present.
- Confirm `company_segment` is a normalized bucket code such as `varejo`, not display text or a company name.
- Confirm `solution_interest` and `company_size` are controlled values.

Validate destination tags:

- Confirm GA4 Event tags fire only on their matching Custom Event triggers.
- Confirm GA4 conversions/key events are set for `generate_lead_success` and any approved `whatsapp_click` conversion.
- Confirm Google Ads primary lead conversion fires on `generate_lead_success` only.
- Confirm Google Ads WhatsApp conversion is secondary unless intentionally configured as primary.
- Confirm Meta Pixel tags fire from GTM only, with no direct app-code Pixel requests.
- Confirm Tag Assistant shows no duplicate GA4, Google Ads, or Meta events for a single user action.
