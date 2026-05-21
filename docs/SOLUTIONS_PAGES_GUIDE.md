# Solutions Pages Guide

## Objetivo

As páginas de `/solucoes` existem para capturar intenções de busca orientadas a dores reais (problemas percebidos) e conectar cada cenário aos serviços da RC2.

## Diferença entre página de serviço e página por problema

- `/servicos/[slug]`: camada de oferta (o que a RC2 implementa).
- `/solucoes/[slug]`: camada de dor (o problema que o cliente sente no dia a dia).
- Relação: `/solucoes` funciona como ponte comercial para `/servicos`, sem substituir as páginas de serviço.

## Slugs atuais

- `/solucoes/atendimento-lento`
- `/solucoes/leads-sem-resposta`
- `/solucoes/processos-manuais`
- `/solucoes/sistemas-desconectados`
- `/solucoes/whatsapp-desorganizado`

## Regra de manutenção do conteúdo

Todo conteúdo das páginas por problema deve ficar hardcoded em:

- `src/lib/content/solutions.ts`

Não usar Supabase/CMS para esse domínio nesta fase.

## Como adicionar uma nova solução no futuro

1. Adicionar novo objeto em `solutions` com todos os campos do tipo `Solution`.
2. Garantir slug único e estável.
3. Revisar links de `relatedServices` e `relatedLinks`.
4. Validar metadata e JSON-LD em `/solucoes/[slug]`.
5. Confirmar inclusão automática em:
- `/solucoes`
- `generateStaticParams()`
- sitemap (via `solutions`)
- seção de soluções no `/llms-full.txt`
6. Rodar validações: `npm run typecheck`, `npm run lint`, `npm run build`.

## Checklist para nova página de solução

- [ ] Slug definido e sem conflito.
- [ ] `seoTitle`, `summary` e `keywords` preenchidos.
- [ ] Sintomas, impacto, causas e caminho recomendado completos.
- [ ] `relatedServices` com links válidos para `/servicos`.
- [ ] FAQ com perguntas objetivas e respostas acionáveis.
- [ ] CTA final alinhado ao problema.
- [ ] Página renderiza corretamente em `/solucoes/[slug]`.
- [ ] JSON-LD `WebPage` e `FAQPage` válidos.
- [ ] Sitemap e `llms-full.txt` refletem a nova solução.
