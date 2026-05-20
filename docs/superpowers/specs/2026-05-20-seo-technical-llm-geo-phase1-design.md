# Fase 1 — SEO Técnico + LLM/GEO (Design)

## 1. Objetivo
Executar somente a Fase 1 de SEO técnico + LLM/GEO no repositório `rsazevedo82/rcc-02-site`, sem alterar layout, design system, copy comercial principal, estrutura editorial ou criar novas superfícies além de `/llms.txt` e `/llms-full.txt`.

## 2. Escopo aprovado

### 2.1 Nova rota `/llms.txt`
Arquivo: `src/app/llms.txt/route.ts`
- `export const dynamic = "force-static"`
- Retorno em `text/plain; charset=utf-8`
- `Response` nativo
- Conteúdo institucional curado conforme texto fornecido
- Cache:
  - `Cache-Control: public, max-age=3600, s-maxage=86400`

### 2.2 Nova rota `/llms-full.txt`
Arquivo: `src/app/llms-full.txt/route.ts`
- `export const revalidate = 3600`
- Retorno em `text/plain; charset=utf-8`
- Usa `services` de `@/lib/content/services`
- Usa `createPublicClient` de `@/lib/supabase/server`
- Usa tipo `Post` de `@/lib/types/post`
- Seleciona posts com regras finais:
  - incluir somente `status === "published"`
  - excluir `seo_index_status === "noindex"`
  - manter `seo_index_status === "nofollow"` quando publicado
  - excluir `draft` e `scheduled` por definição da regra de status
- Conteúdo por post:
  - título, resumo, URL, categoria, palavra-chave principal, FAQs
- `faq_items` tratado defensivamente:
  - `null`
  - array
  - JSON string
- Resiliência:
  - se Supabase falhar, rota continua com seção institucional + serviços
- Cache:
  - `Cache-Control: public, max-age=3600, s-maxage=86400`

### 2.3 Atualização de `robots.ts`
Arquivo: `src/app/robots.ts`
- Manter disallow para `/admin`, `/admin/`, `/api/`
- Adicionar regras explícitas para:
  - `OAI-SearchBot`
  - `GPTBot`
  - `Google-Extended`
- Manter sitemap: `https://rc2solucoes.com.br/sitemap.xml`

### 2.4 Canonical no post do blog
Arquivo: `src/app/(public)/blog/[slug]/page.tsx`
- Em `generateMetadata`, adicionar:
  - `alternates.canonical = ${BASE_URL}/blog/${slug}`
- Preservar campos atuais:
  - `title`, `description`, `robots`, `openGraph`, `twitter`

### 2.5 Ajuste do logo no schema `BlogPosting`
Arquivo: `src/app/(public)/blog/[slug]/page.tsx`
- Trocar:
  - `${BASE_URL}/logo.png`
- Por:
  - `${BASE_URL}/images/logo-base.png`
- Sem alterações adicionais no schema

### 2.6 Otimização da query na listagem `/blog`
Arquivo: `src/app/(public)/blog/page.tsx`
- Em `getPosts()`, remover `content` da query
- Usar seleção:
  - `id,slug,title,summary,cover_url,cover_url_alt,published_at,created_at,updated_at,status,category,reading_time_minutes`
- Garantir compatibilidade de TypeScript na página

### 2.7 Melhoria de `sitemap.ts`
Arquivo: `src/app/sitemap.ts`
- Substituir `lastModified: new Date()` das rotas estáticas por datas fixas por rota
- Manter rotas dinâmicas de blog com `updated_at` do Supabase
- Incluir:
  - `https://rc2solucoes.com.br/llms.txt`
  - `https://rc2solucoes.com.br/llms-full.txt`
- Para ambas:
  - `changeFrequency: "weekly"`
  - `priority: 0.3`

### 2.8 Atualização de `docs/SEO_CHECKLIST.md`
Arquivo: `docs/SEO_CHECKLIST.md`
- Adicionar seção **LLM / GEO**:
  - [x] `/llms.txt` criado
  - [x] `/llms-full.txt` criado
  - [x] robots com `OAI-SearchBot`, `GPTBot`, `Google-Extended`
  - [x] canonical explícito nos posts
  - [x] sitemap com `/llms.txt` e `/llms-full.txt`
- Ajustar demais itens caso fiquem desatualizados após mudanças

## 3. Restrições
Não fazer:
- alteração visual
- alteração de layout/design system
- alteração de copy comercial principal
- migration Supabase
- novas dependências
- novas variáveis de ambiente
- páginas além de `/llms.txt` e `/llms-full.txt`
- itens da Fase 2
- remoção de schemas existentes
- exposição de posts não publicados

## 4. Estratégia técnica
Abordagem escolhida: **Implementação mínima orientada a rotas e metadata**.

Princípios:
- tocar somente arquivos do escopo
- manter fallback resiliente na geração de `llms-full.txt`
- preservar arquitetura atual de metadata/schema
- zero mudança em UI/layout

## 5. Validação obrigatória
Executar ao final:
- `npm run typecheck`
- `npm run lint`
- `npm run build`

## 6. Critérios de aceite
- `/llms.txt` disponível com conteúdo e headers corretos
- `/llms-full.txt` disponível com conteúdo institucional + serviços + posts válidos
- Regra de posts em `/llms-full.txt` aplicada corretamente:
  - inclui `published`
  - exclui `noindex`
  - mantém `nofollow` quando publicado
- `robots.ts` atualizado com user agents explícitos
- canonical adicionado em `/blog/[slug]`
- logo de `BlogPosting` ajustado
- query de `/blog` otimizada sem `content`
- sitemap com datas estáticas e rotas LLM incluídas
- checklist de SEO atualizado
- `typecheck`, `lint`, `build` passando
