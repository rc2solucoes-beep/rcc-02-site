# Guia de Campos do CMS de Blog

Referência baseada em `src/lib/types/post.ts`.

## Identificação e conteúdo
- `slug`: URL do post (`/blog/{slug}`), sem acentos e caracteres especiais.
- `title`: título principal do artigo.
- `summary`: resumo curto para cards/listagens e apoio de SEO.
- `content`: conteúdo completo do artigo (editor).

## Imagens e social
- `cover_url`: URL da imagem de capa.
- `cover_url_alt`: descrição da imagem para acessibilidade/SEO.
- `og_image`: imagem de compartilhamento social.
- `og_title`: título específico para Open Graph (opcional).
- `og_description`: descrição específica para Open Graph (opcional).

## Publicação
- `status`: `draft`, `scheduled` ou `published`.
- `published_at`: data de publicação efetiva.
- `reading_time_minutes`: tempo de leitura estimado.
- `category`: categoria editorial do post.
- `tags`: tags de apoio para organização.
- `content_type`: tipo de conteúdo (`artigo`, `guia`, `tutorial`, `case`, `notícia`).

## SEO
- `seo_keyword_primary`: termo principal.
- `seo_keyword_secondary`: termos secundários.
- `seo_meta_title`: título SEO (ideal até 60).
- `seo_meta_description`: descrição SEO (ideal 120-160).
- `seo_index_status`: `index`, `noindex` ou `nofollow`.

## Autor
- `author_name`: nome de exibição do autor.
- `author_title`: cargo/função.
- `author_bio`: mini bio.
- `author_linkedin`: perfil LinkedIn.

## Relacionamentos e enriquecimento
- `related_post_ids`: IDs de posts recomendados ao final do artigo.
- `faq_items`: perguntas e respostas para FAQ na página.
- `cta_block`: bloco de CTA final (serviço, contato ou próximos passos).

## Boas práticas por status
- Draft: permitir rascunho incompleto para iteração rápida.
- Published: revisar SEO mínimo, links internos, FAQ (quando aplicável) e CTA antes de publicar.