# Preflight de produção da migration 014 — registro (20/10/2026)

| Campo | Valor |
|---|---|
| Ambiente | produção RCC-02 (ref não reproduzido aqui) |
| Data | 20/10/2026 |
| Autorização | AUT-READ-PROD-014 (somente preflight READ ONLY) |
| Execução | manual pelo responsável, no SQL Editor, `preflight.sql` (`BEGIN READ ONLY` … `ROLLBACK`) |
| Fonte | **resultados declarados pelo responsável**; o agente não acessou o banco nem viu as saídas originais |
| Apply | **NÃO EXECUTADO** (não autorizado) |
| Plano | `docs/runbooks/migrations/014-posts-sort-at/PLANO-PRODUCAO.md` (fases A–B) |

## 1. Resultados declarados × esperado do script

| # | Verificação | Declarado | Esperado (preflight.sql) | Situação |
|---|---|---|---|---|
| 1 | PostgreSQL | `server_version_num` 170006 | ≥ 120000 | conforme |
| 2 | Colunas-fonte | 6 linhas, tipos e nulabilidade conformes | `id uuid`, `status text`, `published_at`/`scheduled_publish_at` timestamptz (YES), `created_at`/`updated_at` timestamptz (NO) | conforme |
| 3 | `sort_at` e `posts_sort_at_id_idx` ausentes | retorno inicial “Success. No rows returned”; **confirmação posterior do responsável**: as duas consultas retornaram zero linhas (coluna `posts.sort_at` ausente; índice `posts_sort_at_id_idx` ausente) | 0 linhas em **cada** consulta | conforme (declarado) |
| 4 | CHECK de status | draft, scheduled, published | exatamente esses três | conforme |
| 5 | Trigger | `posts_updated_at`, `tgenabled = O` | habilitado | conforme |
| 6 | Contagens (PV-13) | published 19 (`sem_published_at` 0); scheduled 1 (`sem_scheduled_publish_at` 0) | informativo | sem anomalia |
| 7 | Agendamentos vencidos > 15 min | 0 | informativo | sem cron parado |
| 8 | Total de posts | 20 (19 + 1; nenhum draft/archived) | registrar | registrado (comparar no verify) |
| 9 | Views dependentes | nenhuma retornada | 0 linhas | conforme |
| 10 | Cron `publish-scheduled-posts` | ativo, `*/5 * * * *` | 1 linha, `active = true` | conforme (agenda igual à da migration 011) |
| 11 | Policies de `posts` | 2; `impressao_md5` `8953fc15d02f1bf67b61807687eb8e32` | registrar como baseline | registrado |

Sobre o item 6: campos de data nulos em estados que não os exigem (ex.: `scheduled_publish_at` em post publicado) **não são anomalia bloqueante**; só `published_at` nulo em `published` e `scheduled_publish_at` nulo em `scheduled` seriam sinalizados (RF-CMS-13), e ambos estão em zero.

## 2. Fingerprint

O MD5 `8953fc15d02f1bf67b61807687eb8e32` foi informado pelo responsável como resultado do SQL Editor de **produção RCC-02** (origem declarada; sem verificação independente do agente). Ele coincide com o MD5 histórico do isolado (registrado em 19/10/2026), o que é plausível porque as policies de `posts` seguem o mesmo baseline; a coincidência não substitui a prova. O `verify.sql` de produção (item 7) deve ser comparado com **este** valor e com `total_policies = 2`.

## 3. Revisão estática dos scripts (agente, somente leitura de arquivos locais)

Arquivos: `supabase/migrations/014_posts_sort_at.sql`, `preflight.sql`, `verify.sql`, `rollback.sql`, `PLANO-PRODUCAO.md`.

Conforme:
- **Dependências:** a expressão usa só colunas de `posts` que o preflight (itens 2, 4) comprova; `scheduled_publish_at` e o CHECK vêm de migrations anteriores.
- **Expressão:** `CASE status` published → `coalesce(published_at, created_at)`; scheduled → `coalesce(scheduled_publish_at, updated_at)`; `ELSE updated_at`. Só `timestamptz` e `text`, imutável (aceita como coluna gerada; já aceita no isolado). Com `created_at`/`updated_at` NOT NULL (item 2), nenhum ramo gera nulo; `NOT NULL` é imposto pelo banco. Estados fora dos três (inexistentes pelo CHECK) cairiam em `updated_at`.
- **Índice:** `(sort_at DESC, id DESC)` com `IF NOT EXISTS`; verify 4 confere definição e `indisvalid`.
- **Atomicidade e tempo:** `BEGIN … COMMIT` com `SET LOCAL lock_timeout = '5s'`; falha ou estouro reverte tudo. A coluna gerada STORED reescreve a tabela com bloqueio exclusivo; com 20 posts a duração esperada é desprezível. Índice sem `CONCURRENTLY` é coerente com a transação e o tamanho.
- **RLS e cron:** a migration não toca policies, trigger nem job; verify 7, 8 e 9 comparam policies (total e md5), cron e trigger com o preflight.
- **Verify objetivo:** itens com valores esperados explícitos (`attgenerated = 's'`, nulos = 0, divergentes = 0, `indisvalid`, total de posts igual, md5 igual).
- **Ordem e recuperação:** migration → verify → decisão de deploy; rollback remove índice e coluna (dado derivado) e só após reverter o código. Consistente entre README, `rollback.sql` e o plano.

Achados técnicos (nenhum bloqueador):
1. **Não bloqueante — `verify.sql` item 5** exige `posts_slug` e `posts_status_published_at`, mas o preflight não verifica a existência deles. Vêm de `002_posts_settings.sql`. Se a produção divergir, o verify mostrará menos de 2 linhas sem baseline para interpretar. Mitigação sem alterar scripts: se faltarem, tratar como divergência de baseline a decidir (os índices anteriores não são alterados pela 014).
2. **Não bloqueante — janela do cron:** o job roda a cada 5 min e atualiza `posts`. Há 1 post agendado. O `lock_timeout` de 5 s impede espera longa e um estouro apenas pede repetição; ainda assim, aplicar fora do minuto de um tick do cron e longe do horário de `scheduled_publish_at` desse post (o responsável deve conferir essa data).
3. **Não bloqueante — `IF NOT EXISTS`:** não detecta coluna/índice pré-existentes com definição diferente. A proteção é o item 3 do preflight, agora **confirmado pelo responsável** (ambos ausentes, declarado).
4. **Observação — cache de schema do PostgREST:** se o app acusar coluna inexistente (`PGRST204`) após o apply, `NOTIFY pgrst, 'reload schema'` exige autorização específica (no isolado não foi necessário, por declaração).

Esta revisão por agente **não substitui** a revisão humana independente por segundo engenheiro exigida pelo runbook para produção; esse requisito **não está concluído**, e as exceções E1-REV-EX01 e E1-C14-EX01 valem apenas para o ambiente isolado e **não são reutilizadas para produção**.

## 4. Decisão

**GO TÉCNICO PRELIMINAR — APPLY NÃO AUTORIZADO.**

Confirmações já registradas: item 3 do preflight (coluna e índice ausentes, declarado pelo responsável em confirmação posterior) e origem do MD5 (SQL Editor de produção, declarado).

Atualização de 20/10/2026 — **PROD-014-REV-EX01: DISPENSA APROVADA** (aceite formal de risco residual, decisão expressa do responsável; detalhes, controles compensatórios e limites em `PLANO-PRODUCAO.md` §9.4). A revisão humana independente **não aconteceu**; o requisito foi dispensado só para a implantação da 014 em produção (RCC-02) e a dispensa não vale para 012, 013 ou futuras, nem reutiliza E1-REV-EX01/E1-C14-EX01.

Pendências obrigatórias antes de pedir autorização para o apply:
1. ~~Revisão humana independente~~ — **dispensada formalmente (PROD-014-REV-EX01)**; não realizada.
2. Confirmação de backup/ponto de restauração recente do banco de produção — **PENDENTE** (a dispensa não cobre este item).
3. Autorização específica para executar a migration 014 em produção — **NÃO AUTORIZADA**.

Permanecem também: autorização do merge/deploy, smoke tests, PV-14 parcial, 012/013 não aplicadas em produção e incidente de credenciais ABERTO.
