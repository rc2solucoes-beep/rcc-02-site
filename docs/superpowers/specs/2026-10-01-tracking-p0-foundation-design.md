# Fundação P0 de mensuração e consentimento — Design

Data: 2026-10-01
Base: `origin/main` em `9d74862`
Escopo: código da aplicação, documentação de handoff e testes de regressão

## 1. Contexto e objetivo

Preparar o site RC2 para a retomada de Google Ads e Meta Ads corrigindo três bloqueios de código: `page_view` duplicado em alteração de query, ausência de estado explícito de consentimento e CSP que bloqueia um endpoint observado do Google Ads. O GTM continua como único container de tags. A configuração das plataformas externas fica para um checklist após o deploy.

## 2. Evidências observadas e limites da observação

- Auditoria manual fornecida para esta tarefa: Google Tag com `send_page_view = false`; GTM recebe `page_view` do `dataLayer`; em uma entrada, Tag Assistant mostrou dois disparos de GA4 e Meta PageView.
- `PageViewTracker.tsx` usa `usePathname()` e `useSearchParams()` como dependências do mesmo efeito. O payload usa somente `pathname`, `origin + pathname` e `document.title`. O hook de query não participa do payload.
- `DelayedGtm.tsx` carrega o container após interação ou fallback de 2500 ms; `layout.tsx` inicializa `dataLayer` antes dele e ainda inclui iframe `noscript`.
- Busca por consent/cookie/CMP/storage/gtag nos arquivos da aplicação não encontrou gerenciador de preferências. Há cookies de autenticação Supabase, que são funcionais e fora desta escolha de marketing.
- A Política de Privacidade §7 afirma uso de Umami sem cookies, mas o código carrega GTM; precisa de correção factual mínima.
- Auditoria manual fornecida: `connect-src` bloqueou `https://ad.doubleclick.net/ccm/s/collect`. O código já permite GTM, Google Analytics, Google e Turnstile; `img-src https:` já permite imagens HTTPS. Nenhuma configuração externa do GTM foi inspecionada por esta implementação.
- O Meta Pixel é gerenciado no GTM, não na aplicação. Pixel ID, consent settings e tags das plataformas não estão sob controle deste PR.

## 3. Problemas P0

1. Query string pode disparar novo `page_view` para a mesma página.
2. GTM pode processar eventos sem Consent Mode v2 definido, inclusive em visitas com preferência anterior.
3. A CSP bloqueia o endpoint de Ads observado e não cobre todos os hosts exatos que a documentação oficial exige para tags Google Ads.

## 4. Arquitetura atual

`RootLayout` rende inicialização de `dataLayer`, `DelayedGtm` e `PageViewTracker`. O tracker envia o evento manual `page_view`; GTM decide quais tags GA4 e Meta processam esse evento. O formulário e links publicam os eventos existentes via `src/lib/tracking.ts`. A CSP vem de `next.config.ts`.

## 5. Arquitetura proposta

- `PageViewTracker` observa apenas `pathname`. Cada montagem inicial e alteração real do pathname envia um `page_view` com os três campos atuais, sem query ou fragment. A configuração manual de `page_view` no GTM permanece.
- Um módulo de consentimento concentra chave de storage, versão, validação estrita, mapeamento de categorias e emissão do `consent_update`. Um script curto gerado por esse módulo executa sincronamente no início de `<head>`: inicializa o mesmo `dataLayer`, lê storage versionado com fallback seguro e enfileira `gtag('consent', 'default', ...)` **antes** de qualquer carga do GTM. Não carrega `gtag.js`.
- Um componente client no layout controla a interface de preferências e envia `gtag('consent', 'update', ...)` após a decisão. O footer oferece um botão persistente para reabrir a interface. Essenciais são sempre ativas. Analytics e Marketing são independentes.
- O iframe `noscript` do GTM será retirado. Sem JavaScript não há como ler a preferência local, configurar Consent Mode ou mostrar/registrar escolha; permitir o iframe poderia disparar tags sem esse controle. O conteúdo essencial do site continua acessível.

## 6. Fluxo de page_view

Montagem inicial com `/contato` → um `page_view`; mudança apenas de `?utm_source`, `?gclid`, `?fbclid` ou `?gtm_debug` → nenhum novo evento; `/contato` → `/solucoes` → `/sobre` → um evento por pathname; back/forward que altere pathname → um evento da rota resultante. Preservar `event: "page_view"`, `page_path`, `page_location` e `page_title`. `page_path` é o pathname; `page_location` é `origin + pathname`.

## 7. Modelo e fluxo de consentimento

Categorias: Essenciais (sempre ativas), Analytics (`analytics_storage`) e Marketing (`ad_storage`, `ad_user_data`, `ad_personalization`). O valor inicial dos quatro parâmetros é `denied`. Escolha aceita deve alterar só as categorias opcionais selecionadas; nenhuma categoria é pré-marcada na primeira visita.

Ordem por carregamento de página:

1. Script síncrono no `<head>` inicializa `window.dataLayer` uma vez.
2. Enfileira default dos quatro parâmetros como `denied` ou como escolha válida já salva. Falha ou indisponibilidade de storage mantém `denied`.
3. `PageViewTracker` publica evento manual após hidratação; `DelayedGtm` carrega GTM após interação/fallback. O default já está na fila quando o container inicia.
4. O componente de UI lê a preferência para escolher entre banner inicial e estado salvo. Não reaplica um update na hidratação: o bootstrap já restaurou a preferência.
5. Em aceitar, rejeitar ou salvar configuração, persiste a escolha, envia `gtag('consent', 'update', ...)` e publica `consent_update` com somente `analytics_consent` e `marketing_consent` (`granted`/`denied`). A configuração manual no GTM usará esses campos para Meta.

O comando `gtag` é usado somente como interface do `dataLayer`, sem instalar ou carregar uma segunda Google Tag. A ordem final e o estado visto pelas tags precisam ser conferidos no Tag Assistant após deploy. As tags Meta exigem consent requirements no GTM; publicar `consent_update` por si só não as bloqueia.

## 8. Persistência

`localStorage` first-party, chave `rc2.consent.v1`, objeto JSON com `version: 1`, `analytics: boolean`, `marketing: boolean`, `updatedAt: string` ISO. O bootstrap aceita somente objeto com estrutura válida e versão exata. Versão desconhecida, JSON inválido, storage bloqueado ou campos ausentes = default negado e banner disponível. Não se guarda identificador pessoal. A UI mantém a decisão na página se a gravação falhar, mas não promete persistência nesse caso.

## 9. Interface

Banner discreto e responsivo em PT-BR, sem bloquear o conteúdo. Ações visíveis: “Aceitar todos”, “Rejeitar opcionais” e “Configurar”. Na configuração, toggles separados de Analytics e Marketing, Essenciais fixas e botão “Salvar preferências”. Link para `/privacidade`. Botão “Preferências de cookies” no footer reabre a interface depois da primeira escolha. Usar Barlow, tokens `--rc2-*`, foco de 2 px com offset de 2 px e botão primário laranja com texto navy. Não adicionar dependência.

## 10. CSP

Manter diretivas existentes. Em `connect-src`, adicionar os hosts exatos `https://ad.doubleclick.net` (bloqueio confirmado), `https://www.googleadservices.com`, `https://googleads.g.doubleclick.net` e `https://pagead2.googlesyndication.com` (documentação oficial de Google Ads). Em `script-src`, adicionar `https://www.googleadservices.com` e `https://www.google.com`; em `frame-src`, adicionar `https://www.googletagmanager.com`, como exigido pela mesma tabela para tags Google Ads. `img-src https:` já cobre seus endpoints de imagem. Não adicionar wildcard amplo nem host novo da Meta sem request comprovado. GTM, GA4, Turnstile e Supabase mantêm as permissões atuais.

Referência: [Google, CSP para Tag Manager/Google Ads](https://developers.google.com/tag-platform/security/guides/csp). Consent Mode: [guia oficial](https://developers.google.com/tag-platform/security/guides/consent) e [depuração no Tag Assistant](https://developers.google.com/tag-platform/security/guides/consent-debugging).

## 11. Privacidade e LGPD

Sem PII em `dataLayer`, preferência ou evento de consentimento. A página `/privacidade` terá somente ajuste factual curto sobre cookies essenciais, categorias opcionais e acesso às preferências; não fará novas afirmações jurídicas. A UI e os sinais técnicos não substituem revisão jurídica nem configuração efetiva das tags no GTM.

## 12. Fora do escopo

Nenhuma mudança em `generate_lead_*`, `form_*`, taxonomia P1, nomes de tags/triggers/DLVs, Key Events, Ads Primary/Secondary, Enhanced Measurement, Enhanced Conversions, CAPI, públicos, atribuição, CRM lifecycle ou código direto de Pixel/Ads. Nenhuma alteração de backend de leads.

## 13. Riscos e rollback

- `page_view` já em fila antes do GTM: validar no Preview que cada evento dispara uma vez e que tags respeitam o estado de consentimento.
- `gtag` commands no dataLayer precisam ser interpretados pelo container: verificar default/update no Tag Assistant. Os consent requirements de tags Meta dependem de ação manual externa.
- Storage indisponível ou corrompido: negar opcionais e oferecer interface. Mudança de decisão em outra aba requer reload para bootstrap ou escolha nesta aba; não é objetivo de sincronização contínua.
- Sem JavaScript: sem GTM `noscript`; perda intencional dessa via de medição em favor do default conservador.
- Reverter o PR restaura o comportamento anterior do tracker, a CSP e a ausência de consentimento. O item de `localStorage` é inerte após rollback; limpar a chave não é necessário para o site funcionar.

## 14. Critérios de aceite

- Testes cobrem page_view inicial, pathname novo e query-only sem evento novo.
- Testes cobrem default negado, preferência salva, aceitar, rejeitar, granularidade, persistência e `consent_update` sem PII.
- Default/restauração constam do HTML antes do GTM; sem iframe `noscript`.
- Interface permite escolha e reabertura, sem impedir acesso ao site.
- CSP inclui o endpoint confirmado e apenas hosts específicos justificados.
- `npm run check`, `npm run build` e `npm run audit:brand` passam; E2E diretamente afetados são executados.
- Diff fica restrito a P0 e documentação; PR aberta sem merge.

## 15. Ações manuais após deploy

GTM: Consent Overview, consent requirements das tags Google e Meta, triggers únicos, `page_view` manual, DLVs de `consent_update`. Meta: trocar `SEU_PIXEL_ID` por variável constante `CONST | Meta | Pixel ID`, validar PageView e Lead. GA4: Tag Assistant e DebugView, um page_view por pathname. Google Ads: Conversion Linker, requests sem bloqueio CSP e conversões importadas após trabalho P1. Checklist operacional detalhado acompanha o PR.
