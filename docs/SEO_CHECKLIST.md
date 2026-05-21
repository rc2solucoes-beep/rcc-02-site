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
- [x] `robots.txt` com regras explícitas para `OAI-SearchBot`, `GPTBot` e `Google-Extended`
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

### LLM / GEO

- [x] `/llms.txt` criado com visão curada do site para LLMs.
- [x] `/llms-full.txt` criado com resumo completo de serviços e posts publicados.
- [x] `robots.txt` atualizado com regras explícitas para `OAI-SearchBot`, `GPTBot` e `Google-Extended`.
- [x] Posts do blog com canonical explícito.
- [x] Sitemap inclui `/llms.txt` e `/llms-full.txt`.

### Páginas de Serviço

- [x] Serviços expandidos com problemas, casos de uso, implantação, integrações, indicadores e FAQ.
- [x] Metadata dos serviços usando `seoTitle`.
- [x] Schema `Service` enriquecido.
- [x] Schema `FAQPage` adicionado às páginas de serviço.
- [x] Links internos relacionados adicionados às páginas de serviço.

### Blog / Conteúdo SEO

- [x] Playbook editorial do blog criado.
- [x] Checklist de publicação criado.
- [x] Guia de interlinking interno criado.
- [x] Guia de preenchimento dos campos do CMS criado.
- [x] Validações editoriais revisadas sem criar migrations.

### Páginas por Dor/Problema

- [x] `/solucoes` criado.
- [x] Páginas por dor criadas para atendimento lento, leads sem resposta, processos manuais, sistemas desconectados e WhatsApp desorganizado.
- [x] Conteúdo das soluções centralizado em `src/lib/content/solutions.ts`.
- [x] Metadata e canonical configurados nas páginas de solução.
- [x] JSON-LD `WebPage` e `FAQPage` adicionados.
- [x] Sitemap atualizado com `/solucoes` e páginas individuais.
- [x] `/llms.txt` e `/llms-full.txt` atualizados.

### Sitemap

- [x] Sitemap usa `BASE_URL` centralizado.
- [x] Rotas estáticas usam `lastModified` fixo, sem `new Date()` dinâmico.
- [x] Serviços são gerados automaticamente a partir de `services.ts`.
- [x] Soluções são geradas automaticamente a partir de `solutions.ts`, quando disponível.
- [x] Posts publicados são carregados do Supabase.
- [x] Posts `noindex` são excluídos do sitemap quando o campo estiver disponível.
- [x] Posts `nofollow` permanecem no sitemap quando publicados.
- [x] URLs duplicadas são removidas.
- [x] Sitemap tem ordenação previsível.

### CMS SEO Editorial

- [x] Validações editoriais revisadas no CMS.
- [x] Campos SEO com mensagens de apoio ou documentação.
- [x] Padrão de slug reforçado.
- [x] Regras de meta title e meta description documentadas.
- [x] Guia editorial do CMS criado.
- [x] Checklist de QA editorial criado.

### Medição e Monitoramento

- [x] Eventos principais de conversão revisados.
- [x] Formulário de contato instrumentado sem envio de dados pessoais.
- [x] Documentação de eventos criada ou atualizada.
- [x] Plano de monitoramento SEO criado.
- [x] Guia de Search Console criado.
- [x] Template de revisão mensal SEO criado.
- [x] Checklist de QA SEO/Analytics criado.

---

## Conteúdo (responsabilidade da RC2)

- [ ] Criar pelo menos 3 posts publicados antes do lançamento
- [ ] Preencher CNPJ e endereço em `/privacidade` e `/termos`
- [ ] Criar imagem de capa para cada post (1200×675px, 16:9)
- [ ] Revisar copy de todas as páginas institucionais
- [ ] Configurar e-mail `contato@rc2solucoes.com.br` no painel Configurações do admin
