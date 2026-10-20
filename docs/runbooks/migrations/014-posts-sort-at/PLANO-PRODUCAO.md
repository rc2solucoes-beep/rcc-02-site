# Plano de implantação em produção — E1 (migration 014 + código do CMS)

**STATUS: PLANO PREPARADO — EXECUÇÃO NÃO AUTORIZADA.**

Preparado em 20/10/2026, somente a partir de arquivos locais. Nenhum acesso a Supabase (produção ou isolado), SQL, migration, merge ou deploy foi feito. Este plano não autoriza nada: cada fase marcada **[AUTORIZAÇÃO]** exige autorização expressa e separada do responsável.

Escopo: PR #40 (`feat/admin-e1-cms`, Draft). Os scripts não são repetidos aqui: `supabase/migrations/014_posts_sort_at.sql` (apply), `preflight.sql`, `verify.sql`, `rollback.sql` (esta pasta) e `../../migrations-manuais.md` (regras gerais).

## 1. Estado de partida (declarado, não reverificado)

| Item | Estado |
|---|---|
| 014 no isolado (`rc2-test-isolated`) | aplicada e verificada 9/9 (declaração do responsável); integração 39/39; E2E 9/9; D2, D3, PV-17, EX-4 encerrados |
| 014 em produção | **não aplicada**; preflight de produção executado em 20/10/2026 por declaração do responsável (AUT-READ-PROD-014): GO técnico preliminar, apply não autorizado — ver `docs/runbooks/evidence/E1-preflight-producao-014-2026-10-20.md` |
| 012 e 013 em produção | **não aplicadas** |
| PV-14 | **parcial** (cron real não executado; só o `UPDATE` que ele faz foi exercitado) |
| PV-13 (posts com datas nulas) | só respondível no preflight de produção |
| Incidente de credenciais | **ABERTO** |
| Revisão humana independente por segundo engenheiro | **não houve** (exceções E1-REV-EX01 e E1-C14-EX01 valem só no escopo aprovado) |

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
| 2 | Apply da 014 em produção | Responsável | **pendente** |
| 3 | Merge/deploy do PR #40 | Responsável | **pendente** |
| 4 | `NOTIFY pgrst` (se necessário) | Responsável | só se ocorrer |
| 5 | Rollback da 014 (se necessário) | Responsável | só se ocorrer |
| 6 | 012 (após PV-20) e 013 em produção | Responsável | fora deste release; pendentes |
| 7 | Revisão humana independente / tratamento do incidente de credenciais | Responsável | pendentes |

## 7. Recuperação (nada aqui foi executado ou simulado)

| Situação | Decisão |
|---|---|
| Falha no preflight | **Não aplicar nada.** Diagnosticar; reiniciar na Fase B após correção. |
| Falha no apply | A transação é atômica: verificar (READ ONLY, com autorização) se `sort_at`/índice existem **antes** de qualquer nova tentativa. Se não existem, estado intacto; reaplicar fora de pico. Se existirem parcialmente/diferentes, NO-GO e decisão do responsável. |
| Falha no verify | **Interromper o release**; não fazer merge. Diagnosticar. A coluna extra não afeta o código atual. |
| Falha do código após o deploy | **Reverter primeiro o código**: Vercel → “Promote to Production” do deploy anterior (DEPLOY.md, opção 1), ou revert + push. Não mexer no banco: a coluna é inofensiva ao código antigo. |
| Necessidade de remover `sort_at` | **Somente depois** de o código compatível (anterior) estar implantado e com **autorização separada**; então `rollback.sql` (remove índice e coluna; dado derivado, sem perda). Ponto de não retorno: nenhum. |
| 012 / 013 | A reversão da 012 **não restaura** acesso `anon` (intencional; corrigir o consumidor, nunca reabrir `anon`). A da 013 é parcial (remove só a policy; `/admin/security` passa a listar zero eventos; não restaura escrita revogada). |

## 8. Checklist resumido do responsável

- [ ] A: pré-requisitos e Autorização 1 → B: preflight + GO/NO-GO registrado
- [ ] C: Autorização 2 → D: apply → E: verify = preflight (total, md5) → REGISTRO.md
- [ ] F: Autorização 3 (CI verde, revisão humana, PR fora de Draft, incidente tratado) → merge/deploy
- [ ] G: smoke tests → acompanhar PV-14 → atualizar REGISTRO/README/PR
