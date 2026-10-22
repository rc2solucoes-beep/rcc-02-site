# Plano de implantação em produção — E1 (migration 014 + código do CMS)

**STATUS (21/10/2026): MIGRATION 014 APLICADA E VERIFICADA EM PRODUÇÃO (9/9, declarado) — MERGE/DEPLOY DO PR #40 NÃO AUTORIZADOS.** Histórico: o plano foi preparado em 20/10/2026 com o status "PLANO PREPARADO — EXECUÇÃO NÃO AUTORIZADA"; o apply foi depois autorizado (AUT-APPLY-PROD-014) e executado pelo responsável (§10). As fases C a E estão cumpridas; as fases F (merge/deploy) e G (smoke) seguem pendentes.

Preparado em 20/10/2026, somente a partir de arquivos locais. Nenhum acesso a Supabase (produção ou isolado), SQL, migration, merge ou deploy foi feito. Este plano não autoriza nada: cada fase marcada **[AUTORIZAÇÃO]** exige autorização expressa e separada do responsável.

Escopo: PR #40 (`feat/admin-e1-cms`, Draft). Os scripts não são repetidos aqui: `supabase/migrations/014_posts_sort_at.sql` (apply), `preflight.sql`, `verify.sql`, `rollback.sql` (esta pasta) e `../../migrations-manuais.md` (regras gerais).

## 1. Estado de partida (declarado, não reverificado)

| Item | Estado |
|---|---|
| 014 no isolado (`rc2-test-isolated`) | aplicada e verificada 9/9 (declaração do responsável); integração 39/39; E2E 9/9; D2, D3, PV-17, EX-4 encerrados |
| 014 em produção | **APLICADA E VERIFICADA em 21/10/2026** (9/9, declarado; §10). Estado anterior: preflight de 20/10/2026 conforme (AUT-READ-PROD-014), ver `docs/runbooks/evidence/E1-preflight-producao-014-2026-10-20.md` |
| 012 e 013 em produção | **não aplicadas** |
| PV-14 | **parcial** (cron real não executado; só o `UPDATE` que ele faz foi exercitado) |
| PV-13 (posts com datas nulas) | só respondível no preflight de produção |
| Incidente de credenciais | **ABERTO** |
| Revisão humana independente por segundo engenheiro | **não houve**. Em 20/10/2026 o responsável aprovou a dispensa formal **PROD-014-REV-EX01** (aceite de risco residual, §9.4); a revisão independente continua **não realizada** (exceções E1-REV-EX01 e E1-C14-EX01 valem só no isolado) |

## 2. Dependências reais (com origem)

| Migration | Natureza | Dependência da 014? | Origem |
|---|---|---|---|
| **014** | coluna gerada `sort_at` + índice `(sort_at DESC, id DESC)`; não altera policies nem cron | — | `014_posts_sort_at.sql`, README da 014 |
| 012 | segurança de `leads`: `anon` perde acesso. Bloqueio **PV-20**: dono confirma por escrito que nenhuma integração externa (ex.: n8n) usa a chave anônima. Rollback **intencionalmente indisponível**; não restaura acesso `anon` | **Não** | README e `rollback.sql` da 012 |
| 013 | leitura administrativa de `admin_audit_logs` (policy SELECT, índices, revoga escrita de `anon`/`authenticated`). Independente da 012. Rollback **parcial** (só remove a policy) | **Não** | README da 013 (“Independente da 012”); o código da E1 grava auditoria com `service_role`, não afetada |
| Esquema anterior | `public.posts` com `scheduled_publish_at`, CHECK de status, trigger `posts_updated_at`, `created_at`/`updated_at` NOT NULL, cron `publish-scheduled-posts` | **Sim** (pré-requisito de esquema, não de migration numerada) | README da 014 (“Depende de”); `preflight.sql` itens 2, 4, 5, 10 |

Não foi encontrada dependência técnica entre 012/013 e a 014 nem entre elas e o código da E1. **Aplicar 012/013 não é pré-requisito do deploy da E1** e vice-versa; devem ter decisões e autorizações próprias (a 012 só após PV-20). Se o responsável quiser agrupá-las num mesmo release, é decisão de negócio, não técnica, e não altera a ordem 014 → código.

Dependência de código: a listagem (`listAdminPosts`) consulta, filtra e ordena por `sort_at`. Sem a coluna, `/admin/posts` cai no estado de erro “Não foi possível carregar os posts” (não quebra o site público nem as demais rotas).

## 3. Risco de publicação (Vercel)

Fonte local: `docs/DEPLOY.md` §5 e “Atualizações”: *“faça push para a branch `main` — o Vercel detecta automaticamente e dispara o deploy”*. Portanto **merge na `main` = deploy de produção automático**. Não há `vercel.json`, `.vercel` nem workflows do GitHub Actions no repositório.

- O botão **Merge do PR #40 NÃO é seguro** antes da 014 verificada em produção.
- **Não verificado (exige consulta remota, não feita):** se a proteção de branch exige aprovação, se existe “Ignored Build Step”/“Auto-deploy” desligável, e quais variáveis de ambiente o **Preview** usa. O Preview do PR #40 já foi disparado automaticamente; se ele usar credenciais de produção, `/admin/posts` do Preview mostrará erro de listagem e **ações de escrita do admin no Preview afetariam dados reais**. Confirmar antes de usar o Preview para qualquer teste logado.
- O Preview automático **não é autorização** para produção.
- Garantia pretendida: o merge só ocorre depois do gate da Fase E. Se não for possível provar que o merge não publica sozinho, tratar o merge como a própria publicação (Fase F) e fazê-lo apenas com a coluna já verificada.

## 4. Fases

### A. Pré-requisitos e autorização do preflight **[AUTORIZAÇÃO 1]**
Checklist (todos “sim” antes de pedir):
- [ ] Identidade do alvo comprovada pelo responsável: projeto Supabase de **produção** (ref conferido por ele, nunca reproduzido em documentos).
- [ ] Autorização expressa **só para o preflight READ ONLY** (regra 1 de `migrations-manuais.md`: inclui consultas de catálogo).
- [ ] Executor definido (SQL Editor, manual) e `preflight.sql` na versão do commit publicado no PR #40.
- [ ] Backup/ponto de restauração recente do banco (DEPLOY.md: sem rollback automático no plano Free) — confirmar que existe.
- [ ] Janela fora do horário de pico para a Fase D (reescrita da tabela com bloqueio exclusivo breve, `lock_timeout` 5 s).
- [ ] Decisão sobre a Preview/branch protection registrada (§3).
- [ ] Plano de recuperação (§7) lido pelo responsável.

### B. Preflight e decisão GO/NO-GO
Executar `preflight.sql` inteiro (já é `BEGIN READ ONLY` … `ROLLBACK`); **não criar script alternativo** (cobre todos os pontos exigidos). Mapa do que ele já verifica e o esperado (do próprio script):

| # | Verificação | Esperado |
|---|---|---|
| 1 | Versão PostgreSQL | `server_version_num >= 120000` |
| 2 | Colunas-fonte, tipos e nulabilidade | 6 linhas: `id uuid`, `status text`, `published_at`/`scheduled_publish_at` timestamptz (YES), `created_at`/`updated_at` timestamptz (NO) |
| 3 | `sort_at` e `posts_sort_at_id_idx` | 0 linhas em cada |
| 4 | CHECK de status | só `draft`, `scheduled`, `published` |
| 5 | Trigger | `posts_updated_at` com `tgenabled = 'O'` |
| 6 | Contagens por status e datas nulas (PV-13) | informativo |
| 7 | Agendamentos vencidos > 15 min | informativo |
| 8 | Total de posts | registrar (comparar no verify) |
| 9 | Views que mencionam `posts` | 0 ou revisão humana |
| 10 | Cron `publish-scheduled-posts` | 1 linha, `active = true` |
| 11 | Policies de `posts`: definição completa + `total_policies` + `impressao_md5` | **registrar**; é o baseline da produção (o md5 do isolado, `8953fc…`, **não** é referência para produção) |

Registrar a saída (sem dados pessoais) na evidência. Não inventar resultados de produção.

**GO** somente se: itens 1–5 e 10 conforme; 11 registrado e **comparado pelo responsável** com o baseline esperado (policies de leitura pública de `published` + acesso admin) sem divergência inesperada; itens 6–9 revisados.

### C. Autorização do apply **[AUTORIZAÇÃO 2]** — independente da 1
Só depois do GO documentado. O responsável registra no README da 014 (tabela “Autorização”, linha Produção) quem, quando e para qual janela. A autorização do preflight **não** cobre o apply.

### D. Execução manual do apply (SQL Editor)
Colar `supabase/migrations/014_posts_sort_at.sql` (idempotente; `BEGIN … COMMIT` com `lock_timeout`). Se estourar o `lock_timeout`, nada é aplicado (transação): repetir fora de pico. Não executar 012/013/015 nem NOTIFY nesta fase.
- Se a primeira consulta do app depois do apply falhar com coluna inexistente (`PGRST204`), o cache de schema pode não ter recarregado; `NOTIFY pgrst, 'reload schema'` **só com autorização específica** (já ocorreu como hipótese em PV-17; no isolado não foi necessário, por declaração).

### E. Verify e comparação
Executar `verify.sql` (READ ONLY). Esperado (do script): `sort_at` com `attgenerated = 's'`, `attnotnull = true`, `timestamptz`; expressão `CASE` conforme; `nulos = 0` e `divergentes = 0`; índice válido `(sort_at DESC, id DESC)`; `posts_slug` e `posts_status_published_at` preservados; `total_posts` **igual** ao do preflight; `total_policies` e `impressao_md5` **iguais** aos do preflight item 11. Qualquer diferença: NO-GO do release (§7).
Registrar em `migrations/REGISTRO.md` (linha de produção) e na evidência. Neste ponto a migration está pronta; o código antigo continua funcionando (coluna adicional não o afeta).

### F. Decisão separada de merge/deploy **[AUTORIZAÇÃO 3]**
Pré-condições: Fase E aprovada e registrada; CI do PR verde; revisão humana do PR feita; PR fora de Draft e atualizado com a `main` vigente (se avançou, reconfirmar testes); incidente de credenciais tratado conforme a governança (ou aceite expresso do risco); decisão sobre 012/013 explícita (fora deste release). Confirmar quem faz o merge e que o merge dispara o deploy (§3). Não há auto-merge.

### G. Smoke tests não destrutivos (após o deploy)
Sem criar, editar ou excluir posts reais, sem testes de integração/E2E:
- [ ] `/` , `/blog` e um post publicado respondem 200 (site público intacto).
- [ ] Login em `/admin` e `/admin/posts` abre **sem** o alerta “Não foi possível carregar os posts”; contagem total coerente com o `total_posts` do verify.
- [ ] Busca simples, filtro de status e uma página 2 funcionam (apenas leitura); `?page=9999` redireciona à última página.
- [ ] Ordenação por data efetiva e agrupamento por mês coerentes; anomalias (se houver, PV-13) sinalizadas, não quebram a lista.
- [ ] Abrir (sem salvar) o formulário de um post: datas “Publicado em/Atualizado em” somente leitura.
- [ ] Logs do deploy sem erros novos em `/admin/posts`.
- [ ] PV-14: acompanhar o primeiro ciclo real do cron com agendamentos reais (`publish-scheduled-posts`), sem forçá-lo. **PV-14 só é concluída se o responsável registrar essa observação**; este plano não a declara.

### H. Recuperação — ver §7.

## 5. Critérios NO-GO (parar)

Obrigam parar (e voltar ao responsável):
1. Identidade do projeto não comprovada.
2. Preflight itens 1–5 divergentes (versão, colunas/tipos/nulabilidade, CHECK, trigger).
3. `sort_at` ou `posts_sort_at_id_idx` já existentes (definição não confirmada; `IF NOT EXISTS` não detecta definição diferente).
4. Policies de `posts` fora do baseline esperado, ou md5 do verify ≠ preflight.
5. Cron ausente/inativo ou trigger divergente **sem decisão do responsável**.
6. Views dependentes sem revisão humana.
7. Erro no apply ou no verify (qualquer item fora do esperado).
8. Backup/ponto de restauração ou plano de recuperação indisponível.
9. Não ser possível garantir que o merge/deploy não ocorrerá antes da Fase E (§3).
10. Segurança ou aprovação do release pendentes (incidente de credenciais sem tratamento/aceite; sem autorização das Fases 1–3).

**Apenas acompanhamento (não impedem a migration):** `sem_published_at`/`sem_scheduled_publish_at` > 0 (aparecem como anomalia na lista, RF-CMS-13); agendamentos vencidos > 0 (indício de cron parado; investigar o cron, separado); total de posts alto (aumenta só a duração do bloqueio).

## 6. Quem decide o quê (autorizações pendentes)

| # | Decisão | Quem | Estado |
|---|---|---|---|
| 1 | Preflight READ ONLY em produção | Responsável | concedida e utilizada (AUT-READ-PROD-014, 20/10/2026); item 03 confirmado pelo responsável (declarado) |
| 2 | Apply da 014 em produção | Responsável | **concedida e consumida** (AUT-APPLY-PROD-014, 21/10/2026; §10) |
| 3 | Merge/deploy do PR #40 | Responsável | **pendente** |
| 4 | `NOTIFY pgrst` (se necessário) | Responsável | só se ocorrer |
| 5 | Rollback da 014 (se necessário) | Responsável | só se ocorrer |
| 6 | 012 (após PV-20) e 013 em produção | Responsável | fora deste release; pendentes |
| 7 | Revisão humana independente / tratamento do incidente de credenciais | Responsável | revisão: **dispensada formalmente** para a 014 em produção (PROD-014-REV-EX01, §9.4; a revisão não ocorreu); incidente: pendente (ABERTO) |

## 7. Recuperação (nada aqui foi executado ou simulado)

| Situação | Decisão |
|---|---|
| Falha no preflight | **Não aplicar nada.** Diagnosticar; reiniciar na Fase B após correção. |
| Falha no apply | A transação é atômica: verificar (READ ONLY, com autorização) se `sort_at`/índice existem **antes** de qualquer nova tentativa. Se não existem, estado intacto; reaplicar fora de pico. Se existirem parcialmente/diferentes, NO-GO e decisão do responsável. |
| Falha no verify | **Interromper o release**; não fazer merge. Diagnosticar. A coluna extra não afeta o código atual. |
| Falha do código após o deploy | **Reverter primeiro o código**: Vercel → “Promote to Production” do deploy anterior (DEPLOY.md, opção 1), ou revert + push. Não mexer no banco: a coluna é inofensiva ao código antigo. |
| Necessidade de remover `sort_at` | **Somente depois** de o código compatível (anterior) estar implantado e com **autorização separada**; então `rollback.sql` (remove índice e coluna; dado derivado, sem perda). Ponto de não retorno: nenhum. |
| 012 / 013 | A reversão da 012 **não restaura** acesso `anon` (intencional; corrigir o consumidor, nunca reabrir `anon`). A da 013 é parcial (remove só a policy; `/admin/security` passa a listar zero eventos; não restaura escrita revogada). |

### 7.1 Backup CSV de produção — AUT-BACKUP-PROD-01 (21/10/2026)

**Classificação: BACKUP CSV VALIDADO — NÃO CRIPTOGRAFADO — RESTAURAÇÃO NÃO TESTADA.**

| Campo | Valor |
|---|---|
| Autorização | AUT-BACKUP-PROD-01 |
| Ambiente / origem | RCC-02 (produção); exportação CSV **manual pelo responsável, pelo Dashboard** (declarado; o agente não acessou o Supabase) |
| Validação | local, offline, pelo agente em 21/10/2026 (módulo `csv` do Python; nenhum conteúdo impresso) |
| Armazenamento | pasta local dedicada `D:\Backups\RC2\RCC-02\2026-10-21`, fora de qualquer repositório Git; cópias das exportações também na pasta de origem do responsável, no Google Drive |
| Criptografia | **nenhuma, por decisão expressa do responsável** (GnuPG não foi usado) |
| TAR consolidado | `rcc02-csv-20261021.tar`, 542720 bytes, SHA-256 `2ef6c2fa448bee9eace5ba0abf95046820730375ddc865da07a5b651877bf01a`; 7 membros, estrutura íntegra; conteúdo igual aos CSVs locais e aos da origem (comparação por SHA-256) |

| Arquivo | Bytes | Registros | Colunas | SHA-256 |
|---|---|---|---|---|
| `admin_audit_logs_rows.csv` | 76442 | 204 | 15 | `828fbdfee868d64af8527fa5682aa86221405169647583d9602f0211e925c292` |
| `admin_users_rows.csv` | 113 | 1 | 3 | `530824a7d878cdf1420902b6d059b30dfa842b3d697394ddc8ebb6c11b956598` |
| `authors_rows.csv` | 224 | 1 | 8 | `e19629c1bd8db1490accff0920580030ab7d957ee0bcd39d935b17962c2668cd` |
| `idx02_links_backup_20260928_rows.csv` | 147298 | 13 | 7 | `f539d93ea095c4a901195ecedcd361509212b12055d0ef4824238f504e820011` |
| `leads_rows.csv` | 2142 | 9 | 12 | `194b9788edbcced41fa49f73a472fd307c168f5e12541a4502d72e1d70c0aa5b` |
| `posts_rows.csv` | 300814 | 20 | 34 | `86dd5ebc43d66c40f2a1bf0de4ed090aad1f0917110960143556f98d2d6ea399` |
| `settings_rows.csv` | 1225 | 15 | 13 | `ce8906e82135d7af9add9b2e7988cb93067340c7220d5b770bddc8c02a00e062` |

**Posts:** 20 registros (= baseline do preflight); 19 `published` e 1 `scheduled`; `id`, `status`, `published_at` e `scheduled_publish_at` presentes; sem `id` vazio ou duplicado; sem `sort_at` (esperado: a 014 não foi aplicada). Sem erro de parsing em nenhum arquivo. As seis tabelas de aplicação criadas pelas migrations (`leads`, `posts`, `settings`, `admin_users`, `authors`, `admin_audit_logs`) estão representadas, além de `idx02_links_backup_20260928`. Na pasta de origem existem também `posts_rows.json` e `posts_rows.sql`, que **não** foram validados nem incluídos no TAR.

**Risco de exposição (aceito pelo responsável ao dispensar a criptografia):** os arquivos contêm dados pessoais (leads: nome, e-mail, WhatsApp, mensagem; e-mails de administradores; registros de auditoria com hashes de IP) em texto puro. As cópias na pasta sincronizada do Google Drive ficam sob o controle de acesso e a retenção desse serviço externo; a cópia local depende apenas do acesso à máquina. Nenhum arquivo foi excluído ou movido.

**Limitações de recuperação (não declarar proteção integral):**
- É backup de **dados em CSV**, não backup completo do PostgreSQL.
- Não preserva automaticamente DDL, índices, constraints, triggers, policies RLS, funções, privilégios, extensões nem o job do `pg_cron`.
- Não inclui necessariamente Auth (usuários e sessões), Storage (arquivos binários), Edge Functions, segredos e configurações da plataforma.
- Tipos como `jsonb`, arrays e timestamps podem exigir tratamento na reimportação; a reimportação exige o esquema já existente.
- As exportações por tabela são operações separadas, **não** um snapshot transacional único.
- **Nenhuma restauração foi testada.** A integridade dos arquivos não comprova, sozinha, a completude de toda a base.

Efeito sobre o §9.2: existe uma cópia dos dados das tabelas de aplicação, validada offline; isso **não** equivale a backup/PITR do projeto nem a procedimento de restauração comprovado. Em 21/10/2026 o responsável aceitou esse nível de proteção por exceção (PROD-014-BKP-EX01, §9.5). Texto anterior preservado: a decisão sobre aceitar esse nível de proteção (ou obter backup/PITR do painel) era dele. A migration 014 continua **NÃO AUTORIZADA**; sem GO final.

## 8. Checklist resumido do responsável

- [ ] A: pré-requisitos e Autorização 1 → B: preflight + GO/NO-GO registrado
- [ ] C: Autorização 2 → D: apply → E: verify = preflight (total, md5) → REGISTRO.md
- [ ] F: Autorização 3 (CI verde, revisão humana, PR fora de Draft, incidente tratado) → merge/deploy
- [ ] G: smoke tests → acompanhar PV-14 → atualizar REGISTRO/README/PR

## 9. Controles pendentes para o GO final (preparados em 20/10/2026; NADA abaixo está aprovado)

Atualização de 21/10/2026: os controles prévios foram satisfeitos por dispensa/exceção (PROD-014-REV-EX01 e PROD-014-BKP-EX01, §9.4 e §9.5), sujeitos à confirmação de que não houve mudança relevante desde o preflight; o apply segue **NÃO AUTORIZADO**. Texto original desta seção, preservado: Status mantido: **GO TÉCNICO PRELIMINAR — APPLY NÃO AUTORIZADO.** A Autorização 1 (preflight) foi utilizada; os dois controles abaixo e a Autorização 2 (apply) continuam pendentes. A revisão feita pelo agente **não é** revisão humana independente, e E1-REV-EX01 / E1-C14-EX01 **não** se aplicam a produção.

### 9.1 Handoff para o segundo revisor humano

**Escopo e integridade.** Revisar somente estes arquivos, no commit abaixo (referência de preparação: `3328682`; o revisor registra o SHA que de fato leu). Conferir com `git hash-object <arquivo>` que o conteúdo é o mesmo (prefixos dos blobs na preparação):

| Arquivo | Blob (12 primeiros) |
|---|---|
| `supabase/migrations/014_posts_sort_at.sql` | `749df7476c6c` |
| `docs/runbooks/migrations/014-posts-sort-at/preflight.sql` | `a00eb077c895` |
| `docs/runbooks/migrations/014-posts-sort-at/verify.sql` | `5a7e32043ceb` |
| `docs/runbooks/migrations/014-posts-sort-at/rollback.sql` | `ca859bc15ed0` |

Contexto: este plano e `docs/runbooks/evidence/E1-preflight-producao-014-2026-10-20.md` (resultados **declarados** pelo responsável: PostgreSQL 17.6, 20 posts, 2 policies, md5 `8953fc15d02f1bf67b61807687eb8e32`, `sort_at`/índice ausentes). O revisor não executa SQL em produção; trabalha sobre os arquivos.

**Checklist** (marcar SIM / NÃO / N/A e anotar justificativa):

| # | Verificar | Resp. |
|---|---|---|
| 1 | **PostgreSQL 17.6:** `GENERATED ALWAYS AS (...) STORED` e `ADD COLUMN IF NOT EXISTS`/`CREATE INDEX IF NOT EXISTS` são válidos; a expressão é imutável (só `CASE`, `coalesce`, colunas `text`/`timestamptz` da mesma linha, sem `now()`/funções STABLE) |  |
| 2 | **Expressão e semântica:** published → `coalesce(published_at, created_at)`; scheduled → `coalesce(scheduled_publish_at, updated_at)`; demais → `updated_at`. Coerente com o SDD (`docs/superpowers/specs/2026-10-13-admin-cms-listing-design.md` §5.1) e com o que o cron faz (`status='published'`, `published_at=scheduled_publish_at`) |  |
| 3 | **NOT NULL:** com `created_at`/`updated_at` NOT NULL (preflight item 2) nenhum ramo gera nulo; os 20 posts (19 published com `published_at` presente, 1 scheduled com `scheduled_publish_at` presente) obtêm valor; o `ADD COLUMN ... NOT NULL` não falha em linhas existentes |  |
| 4 | **Índice:** `(sort_at DESC, id DESC)` serve à ordenação nas duas direções (desempate por `id` na mesma direção); é necessário/suficiente para a listagem; sem `CONCURRENTLY` é aceitável com 20 linhas e dentro de transação |  |
| 5 | **Atomicidade:** `BEGIN … COMMIT` com `SET LOCAL lock_timeout = '5s'`; qualquer erro ou estouro desfaz tudo; comportamento no SQL Editor (lote único) entendido; nada fica parcial |  |
| 6 | **Cron:** o job `publish-scheduled-posts` (`*/5 * * * *`, `UPDATE posts …`) pode disputar o bloqueio exclusivo do `ADD COLUMN`; o `lock_timeout` limita a espera; momento de aplicação evita o tick do cron e o horário do post agendado |  |
| 7 | **Preservação:** a migration não altera policies, trigger `posts_updated_at` nem o job; `verify.sql` itens 7 (policies: total + md5), 8 (cron) e 9 (trigger) comprovam a igualdade com o preflight |  |
| 8 | **Cobertura do verify:** itens 1–9 têm esperado objetivo; `nulos = 0`, `divergentes = 0`, `indisvalid`, `total_posts` igual, md5 igual. Lacuna conhecida: item 5 exige `posts_slug` e `posts_status_published_at`, que o preflight não verifica (não bloqueante) — o revisor decide se exige verificação prévia |  |
| 9 | **Ordem e rollback:** migration → verify → decisão de deploy; rollback (`DROP INDEX`, `DROP COLUMN`) só após reverter o código; dado derivado, sem perda; não há ponto de não retorno |  |
| 10 | **Interromper a implantação se:** qualquer item do §5 deste plano ocorrer; erro ou estouro de `lock_timeout` com estado não verificado; `verify` com qualquer item fora do esperado; md5/total de policies ≠ preflight; `total_posts` ≠ 20 sem explicação; backup (§9.2) não confirmado |  |

**Registro do revisor** (preencher **somente** o próprio revisor; o agente não preenche):

| Campo | Valor |
|---|---|
| Nome / identificação do revisor | |
| Data da revisão | |
| SHA dos scripts revisados | |
| Independência (não é o autor do código/scripts) | |
| Achados | |
| Decisão | ☐ APROVADO ☐ APROVADO COM RESSALVAS ☐ REPROVADO |
| Ressalvas a cumprir antes do apply | |

Alternativa: decisão expressa e registrada do responsável dispensando esse requisito para produção (não reutiliza as exceções do isolado). **Exercida em 20/10/2026: ver §9.4 (PROD-014-REV-EX01). O registro do revisor acima permanece em branco: a revisão independente não aconteceu.**

### 9.2 Checklist de backup e recuperação (conferência MANUAL, em etapa futura e separadamente autorizada)

Não presumir que o plano contratado tem PITR; não afirmar backup recuperável sem evidência; não testar restauração nem iniciar backup nesta etapa. A conferência é no painel do projeto, pelo responsável.

| # | Confirmar | Registro (valor + onde foi visto) |
|---|---|---|
| 1 | Projeto correto: RCC-02 (identidade conferida pelo responsável; ref não reproduzido em documentos) | |
| 2 | Tipo de proteção disponível: backup diário e/ou PITR (ou nenhum) | |
| 3 | Data e horário do último ponto recuperável | |
| 4 | Cobertura: inclui o banco PostgreSQL do projeto (schema `public`, `auth`, extensões como `pg_cron`) | |
| 5 | Retenção aplicável | |
| 6 | Procedimento oficial de restauração disponível e documentado | |
| 7 | Permissões necessárias para restaurar (quem pode executar) | |
| 8 | Tempo estimado e impacto operacional (indisponibilidade; perda de escritas posteriores ao ponto) | |
| 9 | Limitações que impeçam restaurar o estado anterior à migration (ex.: restauração substitui o projeto, ponto menos recente que o necessário) | |
| 10 | Evidência documental da confirmação (captura sem segredos, referência ou declaração) e data | |
| 11 | Se não houver backup/PITR utilizável: decisão expressa do responsável sobre aceitar o risco (a 014 é aditiva e tem rollback próprio) ou obter proteção antes | |

Resultado: ☐ proteção confirmada com evidência ☐ aceite de risco registrado ☐ NÃO confirmada (**NO-GO do apply**). Responsável / data: ____________

### 9.3 GO final (decisão posterior e separada)

| Condição para solicitar a Autorização 2 (apply) | Estado |
|---|---|
| Preflight de produção conforme (declarado) | cumprido |
| Item 03 do preflight (coluna e índice ausentes) | confirmado pelo responsável (declarado) |
| Revisão humana independente (§9.1) ou dispensa expressa | **dispensa aprovada** (PROD-014-REV-EX01, 20/10/2026, §9.4); a revisão independente **não** foi realizada |
| Backup/ponto de restauração (§9.2) | **ACEITO POR EXCEÇÃO** (PROD-014-BKP-EX01, 21/10/2026, §9.5): backup CSV validado e não criptografado (§7.1), restauração não testada; **não** é backup integral recuperável |
| Autorização específica do responsável para executar a 014 | **pendente** |
| Merge/deploy (Autorização 3), smoke tests, PV-14 (parcial), 012/013 em produção, incidente de credenciais (ABERTO) | fora desta decisão; pendentes |

### 9.4 Dispensa formal de revisão independente — PROD-014-REV-EX01

| Campo | Valor |
|---|---|
| Identificador | **PROD-014-REV-EX01** |
| Tipo | aceite formal de risco residual |
| Responsável pela decisão | proprietário/responsável pelo projeto, conforme aprovação expressa na conversa |
| Data | 20/10/2026 |
| Status | **DISPENSA APROVADA** |
| Backup / ponto de restauração | **PENDENTE** |
| Apply da 014 em produção | **NÃO AUTORIZADO** |

**Escopo (somente):** `supabase/migrations/014_posts_sort_at.sql`, `preflight.sql`, `verify.sql` e `rollback.sql`, exclusivamente na implantação da migration 014 no Supabase de produção RCC-02.

**Justificativa e controles compensatórios considerados pelo responsável:**
1. Homologação prévia da migration no ambiente isolado.
2. Preflight de produção com 11/11 verificações conformes (declaração do responsável).
3. Revisão estática dos quatro scripts, sem bloqueadores identificados.
4. Migration transacional com `lock_timeout` de 5 segundos.
5. Verify documentado para conferir estrutura, dados, índices, policies, trigger e cron.
6. Plano de recuperação documentado, respeitando a ordem código → rollback SQL.
7. Autorizações independentes para aplicação da migration e para merge/deploy.

**Risco aceito:** a ausência de revisão por um segundo engenheiro humano aumenta a possibilidade de uma falha não identificada na avaliação técnica e operacional.

**Esta dispensa NÃO declara que a revisão independente aconteceu.** O registro do revisor (§9.1) permanece em branco e a revisão do agente continua sem valor de revisão independente.

**Limites — a dispensa NÃO:**
- autoriza aplicar a migration;
- dispensa a confirmação de backup ou ponto de restauração (§9.2);
- autoriza `NOTIFY` ou rollback;
- autoriza merge ou deploy;
- encerra o PV-14 (permanece parcial);
- resolve o incidente de credenciais (permanece ABERTO);
- vale para as migrations 012, 013 ou futuras;
- reutiliza E1-REV-EX01 ou E1-C14-EX01 (válidas só no isolado).

Histórico preservado: os itens 9.1 a 9.3, a revisão estática do agente e o registro do preflight permanecem como foram escritos.

### 9.5 Exceção de backup — PROD-014-BKP-EX01

| Campo | Valor |
|---|---|
| Identificador | **PROD-014-BKP-EX01** |
| Status | **APROVADA** |
| Data / decisor | 21/10/2026; proprietário/responsável pelo projeto, aprovação expressa na conversa |
| Ambiente e escopo | RCC-02 (produção); exclusivamente a migration `014_posts_sort_at.sql` |
| Controle de recuperação | **ACEITO POR EXCEÇÃO** (não é backup integral recuperável) |
| Apply da 014 | **NÃO AUTORIZADO** |
| Merge/deploy do PR #40 | **BLOQUEADOS** (Autorização 3 pendente) |

O responsável aceita o backup CSV disponível (§7.1) como controle compensatório **suficiente para a implantação da 014** e assume os riscos residuais: backup apenas dos dados exportados em CSV; ausência de DDL, índices, triggers, policies e funções; sem garantia de cobertura integral de Auth, Storage e configurações do Supabase; exportações sem snapshot transacional único; ausência de teste de restauração; armazenamento não criptografado, inclusive com cópias sincronizadas no Google Drive.

**Evidências preservadas (§7.1):** sete CSVs validados; posts: 20 registros (19 `published`, 1 `scheduled`), sem `id` vazio ou duplicado; TAR `rcc02-csv-20261021.tar`, 542720 bytes, SHA-256 `2ef6c2fa448bee9eace5ba0abf95046820730375ddc865da07a5b651877bf01a`. As limitações documentadas no §7.1 continuam valendo.

**Limites:** o aceite se limita à suficiência desse controle de recuperação para a 014. Não autoriza novos compartilhamentos ou exposição de dados pessoais, não autoriza apply, `NOTIFY`, rollback, merge ou deploy, não encerra PV-14 (parcial) nem o incidente de credenciais (ABERTO), e não vale para 012, 013 ou futuras migrations.

**GO/NO-GO documental (21/10/2026):**

| Condição | Estado |
|---|---|
| Preflight de produção conforme (declarado) e item 03 confirmado | satisfeito |
| Revisão independente | dispensada (PROD-014-REV-EX01); **não realizada** |
| Recuperação | aceita por exceção (PROD-014-BKP-EX01); restauração não testada |
| Mudança relevante desde o preflight (20/10/2026) | **a confirmar pelo responsável** antes do apply (ex.: contagem de posts, policies, cron, versão do PostgreSQL) |
| Autorização 2 — apply da 014 | **pendente / NÃO AUTORIZADO** |
| Autorização 3 — merge/deploy do PR #40 | **pendente / bloqueados** |
| Smoke tests, PV-14 (parcial), 012/013 em produção, incidente de credenciais (ABERTO) | pendentes, fora desta decisão |

Não há GO final: os controles prévios estão satisfeitos por exceção, mas a execução depende de autorização específica.

## 10. Registro da aplicação e verificação em produção (21/10/2026)

**Fonte: declaração do responsável.** O agente não acessou o Supabase, não executou nem reexecutou nenhum SQL e não verificou o banco diretamente.

| Campo | Valor |
|---|---|
| Ambiente | Supabase RCC-02 — produção |
| Data | 21/10/2026 |
| Autorização | **AUT-APPLY-PROD-014** (concedida expressamente pelo responsável; **consumida**) |
| Execução | manual pelo responsável: `supabase/migrations/014_posts_sort_at.sql` e depois `verify.sql` (não repetir) |
| Resultado do apply | `Success. No rows returned.` |
| NOTIFY / rollback | **nenhum executado** |
| Controles prévios | PROD-014-REV-EX01 (revisão independente dispensada; **não realizada**) e PROD-014-BKP-EX01 (backup CSV aceito por exceção; riscos residuais do §7.1 e §9.5 mantidos) |

**Verify — 9/9 conformes (declarado):**

| # | Verificação | Resultado declarado |
|---|---|---|
| 1 | Coluna `sort_at` | `attgenerated = s`, `attnotnull = true`, `timestamp with time zone` |
| 2 | Expressão | published → `coalesce(published_at, created_at)`; scheduled → `coalesce(scheduled_publish_at, updated_at)`; senão `updated_at` |
| 3 | Integridade | nulos 0; divergentes 0 |
| 4 | Índice | `posts_sort_at_id_idx` `(sort_at DESC, id DESC)`, `indisvalid = true` |
| 5 | Índices preservados | `posts_slug`, `posts_status_published_at` |
| 6 | Total de posts | 20 (= preflight) |
| 7 | Policies | 2; `impressao_md5` `8953fc15d02f1bf67b61807687eb8e32` (= baseline de produção) |
| 8 | Cron | `publish-scheduled-posts`, `*/5 * * * *`, `active = true` |
| 9 | Trigger | `posts_updated_at`, `tgenabled = O` |

Conclusão: **MIGRATION 014 APLICADA E VERIFICADA EM PRODUÇÃO — 9/9 CONFORMES (declarado).** O achado 1 da revisão estática (índices do item 5 não cobertos pelo preflight) ficou resolvido: ambos existem.

**Estado após o registro**

| Item | Estado |
|---|---|
| Migration 014 em produção | aplicada e verificada (declarado) |
| PR #40 | **Draft — merge NÃO autorizado** |
| Deploy | **NÃO autorizado** |
| Migrations 012 e 013 em produção | **não aplicadas** |
| PV-14 | **parcial**: cron configurado e preservado; execução real do job ainda não homologada |
| Incidente anterior de credenciais | **ABERTO** |

**Pendências antes de liberar o PR #40:** Autorização 3 (merge/deploy) do responsável; CI verde e revisão humana do PR; PR fora de Draft e atualizado com a `main` vigente (reconfirmar testes se avançou); tratamento do incidente de credenciais ou aceite expresso do risco; decisão explícita sobre 012/013; publicação dos commits documentais locais no PR (hoje não publicados); smoke tests não destrutivos após o deploy (Fase G); acompanhamento do PV-14. Observação: a coluna `sort_at` já existe em produção e o código atual de produção não a usa (inofensiva); o PR segue Draft e bloqueado.
