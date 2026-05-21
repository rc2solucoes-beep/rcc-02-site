# SEO Monitoring Plan — RC2 Soluções

## Objetivo
Estabelecer rotina operacional para acompanhar crescimento orgânico, qualidade técnica e geração de conversões após as fases de SEO.

## Indicadores semanais
- Impressões orgânicas
- Cliques orgânicos
- CTR média
- Consultas novas
- Páginas com crescimento
- Páginas com queda
- Erros de indexação
- Conversões de origem orgânica (quando disponível)

## Indicadores mensais
- Crescimento de cliques orgânicos
- Crescimento de impressões
- Top páginas por tráfego orgânico
- Top consultas
- Páginas com alto volume e baixa CTR
- Páginas com posição média entre 8 e 20
- Posts que precisam atualização
- Serviços e soluções com melhor engajamento
- Conversões por página de entrada

## Fontes de dados
- Google Search Console
- GA4 (com GTM)
- Vercel (build/runtime/performance)
- Logs de QA pós-deploy

## O que acompanhar no Search Console
- Performance por consulta e página
- Cobertura e indexação
- Core Web Vitals
- Páginas excluídas
- Evolução de páginas novas

## O que acompanhar no GA4
- Eventos de conversão (`form_success`, `whatsapp_click`, legado `generate_lead_success`)
- Microconversões (`cta_click`, `service_link_click`, `solution_link_click`, `blog_share_click`)
- Landing pages orgânicas
- Engajamento por página de serviço/solução

## O que acompanhar no GTM
- Integridade dos disparos de eventos
- Consistência de parâmetros
- Ausência de PII no `dataLayer`

## O que acompanhar em Vercel/Performance
- Resultado de build
- Erros de runtime
- Regressões de performance percebidas
- Estabilidade de rotas públicas críticas

## Priorização de melhorias
1. Corrigir bloqueios técnicos de indexação/erro.
2. Corrigir páginas com alta impressão e CTR baixa.
3. Atuar em páginas com posição média 8–20.
4. Reforçar interlinking interno nas páginas com baixa navegação.
5. Atualizar conteúdos com perda de cliques.

## Rotina de revisão
- Semanal: triagem rápida (30–45 min).
- Mensal: revisão estruturada com template de fechamento.
- Após deploy relevante: QA SEO + Analytics completo.
