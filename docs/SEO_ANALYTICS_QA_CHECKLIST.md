# SEO + Analytics QA Checklist

## Build e rotas
- [ ] `npm run typecheck` passou
- [ ] `npm run lint` passou
- [ ] `npm run build` passou
- [ ] `/sitemap.xml` abre corretamente
- [ ] `/robots.txt` abre corretamente
- [ ] `/llms.txt` abre corretamente, se existir
- [ ] `/llms-full.txt` abre corretamente, se existir

## GTM Preview
- [ ] `page_view` dispara ao carregar página
- [ ] `cta_click` dispara nos CTAs principais
- [ ] `whatsapp_click` dispara nos links de WhatsApp
- [ ] `form_start` dispara uma vez na primeira interação
- [ ] `form_submit` dispara no envio
- [ ] `form_success` dispara após sucesso
- [ ] `form_error` dispara em erro controlado
- [ ] `service_link_click` dispara em links para serviços
- [ ] `solution_link_click` dispara em links para soluções
- [ ] `related_link_click` dispara em links relacionados
- [ ] `blog_share_click` dispara nos compartilhamentos

## GA4
- [ ] Eventos chegam no DebugView
- [ ] `form_success` configurado como conversão
- [ ] `whatsapp_click` configurado como conversão ou microconversão
- [ ] Parâmetros personalizados revisados

## Search Console
- [ ] Sitemap enviado
- [ ] Páginas de serviço indexáveis
- [ ] Páginas de solução indexáveis
- [ ] Posts publicados indexáveis
- [ ] Erros de cobertura revisados
