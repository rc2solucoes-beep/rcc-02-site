# Analytics Events — RC2 Soluções

## Objetivo
Padronizar os eventos de SEO e conversão no `dataLayer` para uso no GTM/GA4, preservando compatibilidade com eventos legados.

## Eventos

| Evento | Objetivo | Tipo |
|---|---|---|
| `page_view` | Visualização de página | Base |
| `cta_click` | Clique em CTA comercial | Microconversão |
| `whatsapp_click` | Clique para WhatsApp | Conversão/Micro |
| `form_start` | Início de interação com formulário | Microconversão |
| `form_submit` | Tentativa de envio de formulário | Microconversão |
| `form_success` | Formulário enviado com sucesso | Conversão |
| `form_error` | Erro controlado no formulário | Qualidade |
| `service_link_click` | Clique para página de serviço | Microconversão |
| `solution_link_click` | Clique para página de solução | Microconversão |
| `related_link_click` | Clique em link relacionado | Microconversão |
| `blog_share_click` | Compartilhamento de artigo | Microconversão |
| `generate_lead_*` | Camada legada (mantida) | Legado |

## Payload esperado por evento

### `page_view`
- `page_path`
- `page_location`
- `page_title`

### `cta_click` / `whatsapp_click`
- `location`
- `label`
- `destination`

### `form_start` / `form_submit` / `form_success`
- `form_name`
- `location`
- `source_page`
- `source_type`
- `solution_interest` (quando aplicável)
- `company_size` (quando aplicável)
- `company_segment` (quando aplicável)

### `form_error`
- `form_name`
- `location`
- `source_page`
- `source_type`
- `error_code` (genérico)
- `error_message` (genérico)

### `service_link_click` / `solution_link_click` / `related_link_click`
- `location`
- `label`
- `destination`
- `source_page`
- `source_type`

### `blog_share_click`
- `location`
- `label`
- `destination`
- `source_page`
- `source_type`
- `post_slug`
- `network` (`linkedin`, `whatsapp`, `x`)

## Onde cada evento dispara
- `page_view`: `PageViewTracker`.
- `form_*`: `ContactForm`.
- `cta_click` / `whatsapp_click`: `TrackedLink` e `CTABlock`.
- `service_link_click`: links de serviço em `/servicos/[slug]` e `/solucoes/[slug]`.
- `solution_link_click`: cards do hub `/solucoes`.
- `related_link_click`: links relacionados em `/servicos/[slug]` e `/solucoes/[slug]`.
- `blog_share_click`: botões de compartilhamento em `/blog/[slug]`.

## Conversões recomendadas (GA4)
- `form_success`
- `generate_lead_success` (legado)
- `whatsapp_click`

## Microconversões recomendadas
- `cta_click`
- `service_link_click`
- `solution_link_click`
- `related_link_click`
- `blog_share_click`
- `form_start`
- `form_submit`

## Parâmetros para Custom Dimensions (GA4)
- `location`
- `source_page`
- `source_type`
- `post_slug`
- `network`
- `form_name`
- `solution_interest`
- `company_size`
- `company_segment`

## O que nunca enviar ao dataLayer
- nome, e-mail, telefone, WhatsApp, empresa, mensagem
- campos livres do usuário
- stack trace
- erro bruto de API

## Validação no GTM Preview
1. Abrir site com modo Preview ativo.
2. Navegar por `/servicos`, `/solucoes`, `/blog/[slug]`, `/contato`.
3. Confirmar eventos e parâmetros esperados por clique/ação.
4. Verificar ausência de payload com PII.

## Validação no GA4 DebugView
1. Ativar debug no navegador.
2. Repetir fluxo principal.
3. Confirmar chegada dos eventos.
4. Confirmar parâmetros customizados e nomenclatura.
