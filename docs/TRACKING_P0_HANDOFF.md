# Tracking P0 — handoff de GTM e Ads

Data: 2026-10-01. Implementação: `docs/superpowers/specs/2026-10-01-tracking-p0-foundation-design.md`.

## O que o código entrega

- `page_view` manual ocorre na entrada e em mudanças de `pathname`. Query e fragment não entram em `page_path` ou `page_location` e não geram um evento extra.
- O script de bootstrap executa no `<head>` antes da carga atrasada do GTM. Os quatro sinais de Consent Mode v2 começam negados; uma escolha válida salva em `rc2.consent.v1` é restaurada no default antes de `gtm.js`.
- Categorias: Essenciais sempre ativas; Analytics controla `analytics_storage`; Marketing controla `ad_storage`, `ad_user_data` e `ad_personalization`. A UI permite aceitar, rejeitar, configurar e reabrir no rodapé.
- Cada escolha envia `gtag('consent','update', ...)` ao mesmo `dataLayer` e depois `consent_update` com apenas `analytics_consent` e `marketing_consent`, ambos `granted` ou `denied`. Nenhuma PII é enviada.
- O iframe `noscript` do GTM foi retirado: sem JavaScript não há como aplicar default, ler storage ou registrar escolha antes das tags. O site essencial continua acessível.
- A CSP permite `ad.doubleclick.net` em `connect-src`, endpoint bloqueado na auditoria manual, e os hosts exatos de Ads da [documentação oficial de CSP do Google](https://developers.google.com/tag-platform/security/guides/csp). `img-src https:` já cobre imagens HTTPS.

O site usa GTM como único container. Não foi instalado `gtag.js` direto, Meta Pixel direto ou Google Ads direto. A fundação **não configura** tags, consent requirements ou conversões nas plataformas externas. A própria [documentação do Google](https://developers.google.com/tag-platform/security/guides/consent) alerta que comandos `gtag` em GTM podem ser processados depois de mensagens pendentes; inspecione a ordem no Tag Assistant e configure as tags para respeitar o estado efetivo. O evento `consent_update` permite condições adicionais para Meta, mas não substitui os consent requirements do container.

Na execução E2E local de 01/10/2026, o container externo ainda carregou `fbevents.js` com Pixel ID inválido antes de uma escolha de Marketing. Isso confirma que a publicação do estado `denied` pelo site não bloqueia por si só as tags Meta atuais. Ajustar consent requirements e substituir o placeholder no GTM é pendência necessária antes de retomar Ads.

## Checklist pós-deploy — Preview e produção

### Page view

- [ ] Acesso direto à Home → um `page_view` no dataLayer, uma tag GA4 e uma Meta PageView quando Marketing estiver concedido.
- [ ] Acesso direto a `/contato` → um `page_view`.
- [ ] Navegação interna `/contato` → `/solucoes` → `/sobre` → um evento por pathname.
- [ ] Back/forward que altera pathname → um evento para cada rota resultante.
- [ ] `?utm_source=google`, `?gclid=test`, `?fbclid=test` e `?gtm_debug` no mesmo pathname → nenhum segundo evento.
- [ ] GTM Preview mantém Google Tag com `send_page_view = false`; somente o Custom Event `page_view` dispara a tag manual. Não duplicar tags/triggers.
- [ ] Conferir que `page_path` e `page_location` não incluem query/fragment e que `page_title` segue presente.

### Consentimento / GTM

- [ ] Em perfil limpo, Tag Assistant mostra default definido **antes** de qualquer tag: `analytics_storage`, `ad_storage`, `ad_user_data`, `ad_personalization` = `denied`.
- [ ] Rejeitar opcionais → quatro sinais continuam `denied`; `consent_update` mostra `analytics_consent: denied` e `marketing_consent: denied`; reload preserva.
- [ ] Aceitar todos → quatro sinais `granted`; `consent_update` mostra ambos `granted`; reload restaura o default concedido antes de `gtm.js`.
- [ ] Configurar Analytics on / Marketing off → `analytics_storage: granted`, três sinais Ads `denied`; reload preserva.
- [ ] Reabrir “Preferências de cookies” no rodapé e mudar a escolha; verificar novo update e persistência.
- [ ] Abrir Consent Overview do GTM e configurar consent requirements em cada tag. Tags Google devem usar os checks integrados de Consent Mode, com requisitos adicionais quando aplicáveis.
- [ ] Garantir que Meta Base Pixel, PageView, Lead e WhatsAppClick exigem Marketing consent. Usar `marketing_consent` do evento `consent_update` e/ou regras de consentimento do GTM conforme o template real. Nenhuma tag Meta antes de `granted` quando aplicável.
- [ ] Conferir no Preview que nenhuma tag usa uma configuração de consentimento oposta ao estado exibido no Tag Assistant. Não publicar o workspace se houver divergência.

### Meta

- [ ] Substituir o placeholder `SEU_PIXEL_ID` no GTM pelo Pixel/Dataset correto. Preferir variável constante `CONST | Meta | Pixel ID`; não gravar ID no código do site.
- [ ] Validar Pixel no Events Manager e no navegador. Após Marketing `granted`, navegar para novo pathname e validar um PageView.
- [ ] Validar Lead somente no `generate_lead_success` atual até a etapa P1. Verificar que `generate_lead_submit` não dispara Lead.
- [ ] Confirmar ausência de PageView, Lead e WhatsAppClick Meta antes de Marketing consent quando aplicável.

### GA4

- [ ] Tag Assistant mostra default, update e estado final correto de Consent Mode.
- [ ] DebugView recebe um `page_view` por pathname e nenhum evento extra por query.
- [ ] Confirmar que tag GA4 manual continua ligada apenas ao Custom Event `page_view`.

### Google Ads e CSP

- [ ] Network/Console sem violação de CSP para `https://ad.doubleclick.net/ccm/s/collect` no fluxo esperado.
- [ ] Se houver outro bloqueio, registrar URL e diretiva reais antes de propor novo host; não usar `connect-src https:`.
- [ ] Validar Conversion Linker e importações de conversão depois da refatoração P1, sem mudar Primary/Secondary nesta PR.
- [ ] Conferir ausência de regressão em GTM, GA4, Cloudflare Turnstile e Supabase.

## Limites, riscos e rollback

- O estado `denied` ainda pode permitir pings sem cookies pelas tags Google em modo avançado; o comportamento real depende das tags no GTM. A aplicação não garante ausência de requests Google antes do consentimento, apenas envia o estado explicitamente antes do container.
- Uma escolha concedida em página já aberta não reproduz retroativamente o PageView daquela página. Valide após navegar para outro pathname ou recarregar.
- `localStorage` bloqueado ou inválido resulta em default negado; a escolha vale na página atual, mas pode não persistir entre visitas.
- Reverter esta PR restaura o tracker, a CSP e o comportamento anterior sem consentimento. A chave `rc2.consent.v1` fica inerte após rollback.
- Não foram alterados `generate_lead_*`, `form_*`, Key Events, Ads Primary/Secondary, Enhanced Conversions, CAPI, públicos, atribuição ou CRM lifecycle.
