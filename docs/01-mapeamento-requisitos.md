# 01 — Mapeamento de Requisitos

> Requisitos extraídos dos documentos-base e organizados por categoria.
> Origem indicada entre colchetes: [Copy], [Brand], [Plano].

---

## 1. Páginas e rotas do site

| Rota | Página | Origem |
|---|---|---|
| `/` | Home | [Copy] |
| `/servicos` | Serviços (listagem) | [Copy] [Plano] |
| `/servicos/[slug]` | Serviço individual | [Plano] |
| `/solucoes-com-ia` | Soluções com IA | [Copy] — ⚠️ ausente no Plano |
| `/sobre` | Sobre a RC2 | [Copy] [Plano] |
| `/contato` | Contato / Diagnóstico | [Copy] [Plano] |
| `/blog` | Blog (listagem) | [Plano] |
| `/blog/[slug]` | Post individual | [Plano] |
| `/privacidade` | Política de Privacidade | [Plano] |
| `/termos` | Termos de Uso | [Plano] |
| `not-found` | 404 | [Plano] |
| `error` | Erro genérico 500 | [Plano] |
| `/admin` | Área administrativa (login) | [Plano] |
| `/admin/posts` | CRUD de posts | [Plano] |
| `/admin/pages` | Editar páginas institucionais | [Plano] |
| `/admin/services` | Gerenciar serviços | [Plano] |
| `/admin/leads` | Visualizar leads | [Plano] |
| `/admin/settings` | Configurações do site | [Plano] |

---

## 2. Seções de cada página

### Home (`/`)
1. **Hero** — Headline principal, subtexto, dois botões (Solicitar diagnóstico / Conhecer soluções)
2. **Para quem é** — 7 itens de validação do cliente ideal
3. **O que entregamos** — 5 cards de serviços com ícone, título e resumo
4. **Diferencial** — Bloco de texto "Tecnologia com visão de operação"
5. **CTA final** — Chamada para diagnóstico + botão

### Serviços (`/servicos`)
1. Listagem dos 5 serviços
2. Para cada serviço: título, texto de apresentação, "O que pode ser implantado" (lista), benefícios, chamada de ação

### Soluções com IA (`/solucoes-com-ia`)
1. Título + subtítulo educativo/comercial
2. Bloco 1 — IA para atendimento (lista de exemplos)
3. Bloco 2 — IA para vendas
4. Bloco 3 — IA para operação
5. Bloco 4 — IA integrada aos sistemas
6. CTA para diagnóstico

### Sobre (`/sobre`)
1. Texto institucional (fundador + história)
2. Método de trabalho em 5 etapas

### Contato / Diagnóstico (`/contato`)
1. Título + texto de conversão
2. Formulário com 8 campos + select + textarea
3. Botão de submit

### Blog (`/blog`)
1. Listagem de posts com thumbnail, título, excerpt, data

### Post individual (`/blog/[slug]`)
1. Título, data, autor, conteúdo
2. Metadata / SEO
3. Schema BlogPosting

---

## 3. Copy / textos necessários

| Área | Status | Origem |
|---|---|---|
| Hero da Home | ✅ Completo no documento | [Copy] |
| Seção "Para quem é" | ✅ Completo | [Copy] |
| Cards de serviços (home) | ✅ Completo (versão curta) | [Copy] |
| Diferencial da marca | ✅ Completo | [Copy] |
| CTA final da Home | ✅ Completo | [Copy] |
| Página de cada serviço (texto longo) | ✅ Completo (5 serviços) | [Copy] |
| Página Soluções com IA | ✅ Completo | [Copy] |
| Página Sobre | ✅ Completo | [Copy] |
| Página Contato — texto + campos | ✅ Completo | [Copy] |
| Pacotes comerciais (6 pacotes) | ✅ Completo | [Copy] |
| Política de Privacidade | ❌ Não fornecida | — |
| Termos de Uso | ❌ Não fornecidos | — |
| Textos de erro (404, 500) | ❌ Não fornecidos | — |
| Textos do admin | N/A (interface interna) | — |
| Posts iniciais do blog | ❌ Não fornecidos | — |

---

## 4. Componentes reutilizáveis

| Componente | Descrição | Origem |
|---|---|---|
| `<Header>` | Navbar com menu e CTA destacado | [Copy] [Brand] |
| `<Footer>` | Rodapé com links, redes sociais, LGPD | [Plano] |
| `<HeroSection>` | Bloco hero com headline + botões | [Copy] |
| `<ServiceCard>` | Card de serviço (ícone + título + resumo) | [Copy] |
| `<CTABlock>` | Bloco de chamada de ação com botão primário | [Copy] |
| `<ContactForm>` | Formulário com validação, anti-spam, rate limit | [Copy] [Plano] |
| `<BlogCard>` | Card de post com thumbnail, título, excerpt | [Plano] |
| `<StepList>` | Lista de etapas numeradas (método de trabalho) | [Copy] |
| `<BenefitsList>` | Lista de benefícios por serviço | [Copy] |
| `<PageHero>` | Hero secundário para páginas internas | [Brand] |
| `<SectionLabel>` | Eyebrow/label uppercase acima de títulos | [Brand] |
| `<Button>` | Primário (Safety Orange), Secundário (outline) | [Brand] |
| `<AdminLayout>` | Layout da área administrativa | [Plano] |
| `<RichTextEditor>` | Editor de conteúdo do blog (admin) | [Plano] |
| `<ImageUpload>` | Upload para Supabase Storage | [Plano] |
| `<LeadsTable>` | Tabela de leads no admin | [Plano] |

---

## 5. Identidade visual e marca

| Item | Especificação | Origem |
|---|---|---|
| Paleta principal | `#F5F0E8`, `#121212`, `#163020`, `#FF5F1F`, `#1E1610` | [Brand] |
| Proporção de cores | 50/20/20/10% | [Brand] |
| Tipografia | Barlow (Google Fonts) — 6 pesos usados | [Brand] |
| Logo | Signal Interrupt (3 barras horizontais) | [Brand] |
| Ícones | Phosphor Icons ou Lucide (outline/filled consistente) | [Brand] |
| Fotos | Ambientes reais, temperatura quente, sem stock genérico | [Brand] |
| Sem branco puro | Nunca `#FFFFFF` | [Brand] |
| Sem azul/roxo/ciano | Proibido na paleta | [Brand] |
| Sem gradientes | Zero gradientes coloridos | [Brand] |
| Tagline | "Tecnologia que funciona. Operação que entrega." | [Brand] |
| CTA primário | "Solicitar diagnóstico" | [Copy] [Brand] |
| CTA secundário | "Falar pelo WhatsApp" | [Copy] |

---

## 6. CMS e blog

| Item | Especificação | Origem |
|---|---|---|
| Tipo de CMS | Admin próprio no Next.js | [Plano] |
| Banco | Supabase Postgres | [Plano] |
| Auth | Supabase Auth (1 admin) | [Plano] |
| Storage | Supabase Storage (imagens) | [Plano] |
| Entidade `posts` | title, slug, excerpt, content, status, author_id, cover_image, seo_title, seo_description, published_at | [Plano] |
| Entidade `pages` | key, title, content_blocks, seo_title, seo_description | [Plano] |
| Entidade `services` | title, slug, summary, body, order, active | [Plano] |
| Entidade `leads` | name, email, phone, company, message, source, created_at | [Plano] |
| Entidade `settings` | site_name, og_image, social_links, contact_email | [Plano] |
| Status de posts | rascunho, publicado, arquivado | [Plano] |
| Editor rico | Necessário para body de posts | [Plano] |

---

## 7. Integrações externas

| Integração | Finalidade | Tier | Conta necessária |
|---|---|---|---|
| Supabase | Banco, Auth, Storage | Free tier disponível | Sim |
| Vercel | Deploy e preview | Free tier disponível | Sim |
| Plausible | Analytics de privacidade | Pago após trial (30 dias) | Sim — ⚠️ confirmar |
| Google Search Console | SEO e indexação | Gratuito | Sim (Google) |
| Sentry | Monitoramento de erros | Free tier disponível | Sim |
| Cloudflare Turnstile ou hCaptcha | Anti-spam no formulário | Free | Sim (Cloudflare ou hCaptcha) |
| GitHub | Repositório e CI | Free tier disponível | Sim |
| WhatsApp | CTA secundário | N/A | Número necessário |
| E-mail para leads | Notificação de novos leads | Via Supabase Edge Function ou SMTP | Confirmar |

---

## 8. SEO e metadados

| Item | Especificação | Origem |
|---|---|---|
| Metadata por página | title + description únicos | [Plano] |
| Open Graph | og:title, og:description, og:image padrão | [Plano] |
| Sitemap | Gerado automaticamente (Next.js) | [Plano] |
| robots.txt | `/admin` bloqueado | [Plano] |
| URLs canônicas | Por página | [Plano] |
| Schema.org | Organization, WebSite, Service, BlogPosting, BreadcrumbList | [Plano] |
| Alt text | Em todas as imagens | [Plano] |
| Headings | Hierarquia correta (H1 único por página) | [Plano] |

---

## 9. Performance

| Item | Meta | Origem |
|---|---|---|
| Lighthouse Performance | 90+ | [Plano] |
| Lighthouse SEO | 90+ | [Plano] |
| Lighthouse Acessibilidade | 90+ | [Plano] |
| Imagens | WebP/AVIF | [Plano] |
| Fontes | Locais ou carregamento otimizado | [Plano] |
| Server components | Priorizar sobre client | [Plano] |
| JavaScript desnecessário | Eliminar | [Plano] |

---

## 10. Acessibilidade

| Item | Requisito | Origem |
|---|---|---|
| Contraste | Adequado (WCAG AA mínimo) | [Plano] [Brand] |
| Navegação por teclado | Funcional em todo o site | [Plano] |
| Foco visível | Visível em todos os elementos interativos | [Plano] |
| Labels | Em todos os campos de formulário | [Plano] |
| Alt text | Em todas as imagens | [Plano] |
| Estados de loading/empty | Comunicados visualmente | [Plano] |
| Mensagens de erro | Claras e descritivas | [Plano] |

---

## 11. Segurança

| Item | Implementação | Origem |
|---|---|---|
| RLS | Ativo no Supabase (todos os dados) | [Plano] |
| Middleware de auth | Protege `/admin/*` | [Plano] |
| Validação server-side | Em todos os formulários e rotas de API | [Plano] |
| Rate limiting | Nas rotas de API e formulário | [Plano] |
| Anti-spam | Turnstile ou hCaptcha + honeypot | [Plano] |
| CSP | Content-Security-Policy via headers | [Plano] |
| HSTS | Strict-Transport-Security | [Plano] |
| Secrets | Fora do código e do Git (.env.local) | [Plano] |
| SAST | Semgrep ou Snyk antes de produção | [Plano] |
| Logs | Sem dados sensíveis | [Plano] |
| LGPD | Política, Termos, consentimento de cookies | [Plano] |

---

## 12. Deploy e infraestrutura

| Item | Especificação | Origem |
|---|---|---|
| Plataforma | Vercel | [Plano] |
| Preview deploys | Sim (por branch/PR) | [Plano] |
| Staging | Antes de produção | [Plano] |
| Rollback | Documentado | [Plano] |
| Variáveis de ambiente | Via Vercel Dashboard | [Plano] |
| CI | lint + typecheck + testes no pipeline | [Plano] |

---

## 13. Testes e validação

| Item | Ferramenta | Cobertura | Origem |
|---|---|---|---|
| E2E críticos | Playwright | Home, menu mobile, formulário, login admin, publicação | [Plano] |
| Testes unitários | Vitest | Utilitários, validações | [Plano] |
| Lint | ESLint | Todo o código | [Plano] |
| Type check | TypeScript | Todo o código | [Plano] |
| Acessibilidade automatizada | Playwright (axe-playwright) | Páginas críticas | [Plano] |
| Performance | Lighthouse (Playwright) | Antes de produção | [Plano] |
| Segurança estática | Semgrep ou Snyk | Antes do primeiro deploy | [Plano] |

---

## 14. Itens pendentes de decisão (bloqueadores)

| # | Item | Impacto |
|---|---|---|
| D1 | Logo final: é o Signal Interrupt definitivo? | Bloqueador para design system |
| D2 | Número de WhatsApp para CTA secundário | Bloqueador para publicação |
| D3 | Domínio `rc2solucoes.com.br` registrado? | Bloqueador para produção |
| D4 | Plausible (pago) ou alternativa gratuita (Umami)? | Bloqueador para fase de analytics |
| D5 | Página "Soluções com IA" — incluir no menu? | Bloqueador para estrutura de navegação |
| D6 | Pacotes — exibir em página própria ou dentro de Serviços? | Bloqueador para roteamento |
| D7 | Repositório GitHub — URL ou criar novo? | Bloqueador para Fase 1 |
| D8 | Anti-spam: Cloudflare Turnstile ou hCaptcha? | Bloqueador para formulário |
| D9 | Notificação de leads por e-mail — qual provedor SMTP? | Bloqueador para formulário |
| D10 | Preços dos pacotes — definidos antes de publicar? | Bloqueador para publicação |
