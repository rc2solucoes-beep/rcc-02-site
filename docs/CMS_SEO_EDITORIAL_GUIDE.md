# CMS SEO Editorial Guide

## Objetivo
Este guia padroniza o preenchimento dos campos editoriais e de SEO no CMS para reduzir erros antes da publicação de posts no blog.

## Título do post (`title`)
- Escreva um título claro, direto e alinhado à intenção de busca.
- Faixa recomendada: 35 a 70 caracteres para boa legibilidade.
- Evite títulos genéricos que não expliquem o benefício do conteúdo.

## Slug (`slug`)
- Use versão curta do título, em minúsculas.
- Use apenas letras (`a-z`), números e hífens.
- Não use acentos, espaços, underscore ou caracteres especiais.
- Evite hífen no início/fim e hífen duplo.

Exemplo:
- `automacao-de-processos-com-ia`

## Resumo (`summary`)
- Deve explicar rapidamente o tema e o valor do artigo.
- Faixa recomendada: 120 a 220 caracteres.
- Evite repetir o título sem acrescentar contexto.

## SEO Meta Title (`seo_meta_title`)
- Use variação focada em busca, sem clickbait.
- Tamanho recomendado: até 60 caracteres.
- Se estiver vazio, o título principal pode ser usado como fallback, mas prefira preencher.

## SEO Meta Description (`seo_meta_description`)
- Escreva descrição objetiva com contexto e benefício.
- Faixa ideal: 120 a 160 caracteres.
- Evite textos vagos como "saiba mais sobre este tema".

## Palavra-chave primária (`seo_keyword_primary`)
- Defina uma keyword principal por post.
- A keyword deve aparecer de forma natural no título, resumo e desenvolvimento.
- Para posts publicados, este campo deve ser sempre revisado.

## Palavras-chave secundárias (`seo_keyword_secondary`)
- Use termos relacionados e variações semânticas.
- Evite lista excessiva de termos sem relação direta com o conteúdo.

## Categoria (`category`) e tags (`tags`)
- Escolha categoria coerente com o tema principal.
- Use tags úteis para descoberta interna e relação entre artigos.
- Evite tags duplicadas ou genéricas demais.

## FAQ (`faq_items`)
- Inclua perguntas reais que clientes buscariam no Google.
- Para conteúdos do tipo guia/tutorial, priorize pelo menos 3 perguntas.
- Respostas devem ser curtas, práticas e sem jargão desnecessário.

## CTA (`cta_block`)
- Todo post deve apontar para um próximo passo.
- Prefira CTA relacionado ao serviço mais próximo do problema discutido.
- Exemplo: contato, diagnóstico ou página de serviço.

## Posts relacionados (`related_post_ids`)
- Configure relacionados quando houver conteúdo complementar disponível.
- Priorize posts do mesmo cluster temático para reforçar interlinking.

## Imagem de capa, ALT e OG
Campos:
- `cover_url`
- `cover_url_alt`
- `cover_url_caption`
- `og_image`
- `og_title`
- `og_description`

Boas práticas:
- Se houver imagem de capa, preencha `cover_url_alt` com descrição objetiva.
- Não use ALT genérico ("imagem do post").
- Revise OG title/description para compartilhamento social.

## Indexação (`seo_index_status`)
- `index`: usar para posts públicos que devem aparecer em buscadores.
- `noindex`: usar quando o post não deve aparecer em buscadores.
- `nofollow`: usar com cautela; não impede indexação do post, apenas orienta buscadores a não seguirem links da página.

## Checklist antes de publicar
- Título claro e coerente com intenção de busca.
- Slug válido (minúsculas, números e hífens).
- Summary objetivo.
- Keyword primária preenchida.
- SEO meta title e meta description revisados.
- Status de indexação revisado.
- Capa e ALT revisados.
- FAQ e CTA avaliados.
- Posts relacionados adicionados quando existirem.
