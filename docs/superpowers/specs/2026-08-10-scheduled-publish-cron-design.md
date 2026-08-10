# Motor de publicação agendada (pg_cron)

**Data:** 2026-08-10
**Status:** Aprovado

## Problema

O CMS do blog possui os campos de agendamento (`status = 'scheduled'` e
`scheduled_publish_at`), gravados corretamente pelo formulário do admin, mas
**não existe nenhum mecanismo que transicione um post de `scheduled` para
`published`** quando o horário chega.

Evidências:
- UI de agendamento: `src/components/admin/PostFormTabs/PublicationTab.tsx:49,87`
- Persistência do campo: `src/app/admin/(protected)/posts/actions.ts:96,226`
- Índice preparado no banco, mas nunca consultado por um scheduler:
  `migrations/add_blog_seo_fields.sql:42`
- Não há `vercel.json` com `crons`, nenhuma rota `/api/cron`, nenhum `pg_cron`
  nem edge function no Supabase.

Resultado: um post marcado como "Agendado" permanece agendado para sempre e
nunca aparece no site público. Ele é invisível em dobro:
- a query pública filtra `status = 'published'`
  (`src/app/(public)/blog/page.tsx:35`, `[slug]/page.tsx:23`, `sitemap.ts:148`)
- a RLS do Supabase só libera `status = 'published'`
  (`supabase/migrations/002_posts_settings.sql:35`)

Caso concreto que originou a investigação: o post
"Atendimento automatizado: como ganhar velocidade sem perder contexto" ficou
preso em `scheduled`.

## Restrição de plataforma

O projeto está no plano **Vercel Hobby**, onde crons nativos rodam no máximo
1x/dia — insuficiente para agendamento por horário. Por isso o motor roda
**dentro do banco (Supabase `pg_cron`)**, independente do plano da Vercel.

## Solução

Uma migration única —
`supabase/migrations/011_scheduled_publish_cron.sql` — que:

1. Habilita a extensão `pg_cron`.
2. Agenda um job recorrente a cada 5 minutos que executa o flip:

```sql
create extension if not exists pg_cron;

select cron.schedule(
  'publish-scheduled-posts',
  '*/5 * * * *',
  $$ update posts
       set status = 'published',
           published_at = scheduled_publish_at
     where status = 'scheduled'
       and scheduled_publish_at is not null
       and scheduled_publish_at <= now() $$
);
```

## Decisões de design

- **`published_at = scheduled_publish_at`** (não `now()`): a data exibida no
  blog reflete o horário que o editor agendou. O `WHERE` garante que o valor
  nunca é nulo no momento do flip.
- **`scheduled` com `scheduled_publish_at IS NULL` nunca é tocado.** Combina com
  o texto da UI "Deixe vazio para publicar manualmente". Ver observação de UX
  abaixo.
- **`updated_at` não é alterado.** O flip é uma mudança de status, não de
  conteúdo; evita bagunçar o `lastmod` do sitemap e a "última atualização".
- **Idempotente.** O `UPDATE` só afeta linhas que casam com o `WHERE`; após o
  flip elas deixam de casar. Executar repetidamente é seguro.
- **Cache:** nada a fazer. `revalidate = 60` em lista, post e sitemap faz o post
  aparecer no público em ~60s após o flip.
- **Permissões:** o job roda como owner da tabela e contorna a RLS.
- **Frequência de 5 min:** granularidade suficiente para um blog, com carga
  desprezível no banco.

## Efeito colateral desejado

Assim que a migration for aplicada, o post atualmente preso em `scheduled` com
`scheduled_publish_at` no passado é publicado automaticamente na próxima rodada
(≤ 5 min), sem intervenção manual.

## Verificação

Sem acesso ao banco de produção a partir do ambiente de desenvolvimento, a
verificação é feita após aplicar a migration no Supabase:

1. Confirmar que o job foi registrado:
   ```sql
   select jobname, schedule, active from cron.job
   where jobname = 'publish-scheduled-posts';
   ```
2. Teste de ponta a ponta (opcional, com linha descartável):
   ```sql
   -- inserir um post scheduled com data no passado, aguardar <=5 min,
   -- verificar que status virou 'published' e published_at foi preenchido.
   ```
3. Inspeção do histórico de execução:
   ```sql
   select status, return_message, start_time
   from cron.job_run_details
   where jobid = (select jobid from cron.job where jobname = 'publish-scheduled-posts')
   order by start_time desc limit 5;
   ```

## Rollback

```sql
select cron.unschedule('publish-scheduled-posts');
```

## Fora de escopo / follow-ups

- **Fuso horário do `scheduled_publish_at`. — RESOLVIDO (2026-08-10).** O valor
  do input `datetime-local` era interpretado no fuso do runtime (UTC na Vercel),
  então "14h" virava 14h UTC (= 11h em America/Sao_Paulo). Corrigido em
  `src/lib/datetime.ts` (`saoPauloInputToUtcIso` / `utcIsoToSaoPauloInput`,
  offset fixo UTC-3 pois o Brasil não tem horário de verão desde 2019), ligado
  na escrita (`src/lib/validations/post.ts`) e na exibição
  (`src/components/admin/PostFormRefactored.tsx`). Cobertura em
  `tests/unit/lib/datetime.test.ts`.
- **UX: `scheduled` sem data.** Um post `scheduled` sem `scheduled_publish_at`
  fica invisível no público e nunca auto-publica. Poderia ser bloqueado na
  validação do formulário (exigir data quando status = `scheduled`) — follow-up
  opcional.
