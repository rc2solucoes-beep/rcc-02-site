# SEO Checklist — RC2 Soluções

## Técnico (implementado no código)

### Metadata
- [x] `<title>` único em todas as páginas
- [x] `<meta name="description">` entre 120–160 caracteres em todas as páginas
- [x] `<link rel="canonical">` em todas as páginas públicas
- [x] `<html lang="pt-BR">` no root layout
- [x] `<meta name="robots" content="index, follow">` nas páginas públicas
- [x] `robots: { index: false }` nas páginas `/privacidade` e `/termos`
- [x] Template de título: `%s — RC2 Soluções`

### Open Graph / Twitter
- [x] `og:title`, `og:description`, `og:url`, `og:type` em todas as páginas
- [x] `og:image` global (`/og-image.png` — **criar imagem real antes do lançamento**)
- [x] `og:image` dinâmico nos posts do blog (usa `cover_url`)
- [x] `twitter:card: summary_large_image`
- [x] `og:locale: pt_BR`

### Sitemap e Robots
- [x] `/sitemap.xml` gerado automaticamente (estático + posts dinâmicos)
- [x] `/robots.txt` bloqueia `/admin` e `/api/`
- [ ] Submeter sitemap no Google Search Console após o deploy

### Schema.org (JSON-LD)
- [x] `Organization` no root layout
- [x] `WebSite` no root layout
- [x] `Service` em cada `/servicos/[slug]`
- [x] `BreadcrumbList` em cada `/servicos/[slug]`
- [x] `BlogPosting` em cada `/blog/[slug]`
- [ ] Validar schemas em [search.google.com/test/rich-results](https://search.google.com/test/rich-results) após o deploy

### Performance
- [x] Fontes via `next/font/google` (sem @import, sem FOUT)
- [x] Imagens com `next/image` (lazy load, AVIF/WebP automático)
- [x] Páginas estáticas (SSG) para todo conteúdo institucional
- [x] ISR de 60s para `/blog` e posts
- [x] `revalidate = 0` nas rotas dinâmicas do admin (sem cache)

### Acessibilidade (impacta SEO)
- [x] Skip link "Pular para o conteúdo principal"
- [x] `<main id="main-content">`
- [x] `aria-hidden="true"` em ícones decorativos
- [x] `aria-label` em navegações secundárias
- [x] Contraste de cores conforme paleta RC2 (verificado visualmente)

---

## Pós-deploy (ações manuais)

### Google Search Console
- [ ] Adicionar propriedade `rc2solucoes.com.br`
- [ ] Verificar via tag HTML ou DNS
- [ ] Submeter sitemap: `https://rc2solucoes.com.br/sitemap.xml`
- [ ] Aguardar indexação (geralmente 3–7 dias)
- [ ] Monitorar erros de cobertura semanalmente

### OG Image
- [ ] Criar `/public/og-image.png` (1200×630px)
  - Fundo: `#121212` (rc2-ink) ou `#F5F0E8` (rc2-sand)
  - Logo RC2 + tagline
  - Validar em [opengraph.xyz](https://opengraph.xyz)

### Analytics
- [ ] Configurar Umami (ou Plausible) no domínio `rc2solucoes.com.br`
- [ ] Adicionar script de analytics no `src/app/layout.tsx`
- [ ] Verificar que admin (`/admin`) está excluído do rastreamento

### Monitoramento contínuo
- [ ] Verificar Core Web Vitals no Google Search Console mensalmente
- [ ] Rodar Lighthouse em produção trimestralmente
- [ ] Verificar links quebrados com ferramenta de crawl (Screaming Frog ou similar)

---

## Conteúdo (responsabilidade da RC2)

- [ ] Criar pelo menos 3 posts publicados antes do lançamento
- [ ] Preencher CNPJ e endereço em `/privacidade` e `/termos`
- [ ] Criar imagem de capa para cada post (1200×675px, 16:9)
- [ ] Revisar copy de todas as páginas institucionais
- [ ] Configurar e-mail `contato@rc2solucoes.com.br` no painel Configurações do admin
