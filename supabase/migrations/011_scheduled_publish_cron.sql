-- Motor de publicação agendada de posts do blog.
--
-- Problema: o CMS grava status='scheduled' + scheduled_publish_at, mas nada
-- transiciona o post para 'published' quando o horário chega. Como o projeto
-- está no plano Vercel Hobby (cron nativo roda no máximo 1x/dia), o agendamento
-- é executado dentro do banco via pg_cron, independente do plano da Vercel.
--
-- O job roda a cada 5 minutos e publica todo post agendado cujo horário já
-- passou. É idempotente: o UPDATE só afeta linhas que ainda casam com o WHERE,
-- e cron.schedule() faz upsert pelo nome do job.
--
-- pg_cron também pode ser habilitado via Dashboard > Database > Extensions.
-- Rollback: SELECT cron.unschedule('publish-scheduled-posts');

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'publish-scheduled-posts',
  '*/5 * * * *',
  $$
    UPDATE posts
       SET status = 'published',
           published_at = scheduled_publish_at
     WHERE status = 'scheduled'
       AND scheduled_publish_at IS NOT NULL
       AND scheduled_publish_at <= NOW()
  $$
);
