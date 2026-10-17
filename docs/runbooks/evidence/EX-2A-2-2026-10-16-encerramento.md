# Evidência de encerramento — EX-2A-2

**Projeto:** RC2 Admin Evolution — E0a / Fundação\
**Etapa:** EX-2A-2 — Auditoria somente leitura do snapshot histórico no Supabase isolado\
**Data de encerramento:** 16/10/2026\
**Estado:** **APROVADA — 10/10 blocos B0–B9, sem divergências pendentes nos critérios auditados**\
**Natureza da evidência:** resultados de consultas executadas manualmente pelo operador no SQL Editor e submetidos a revisão independente nesta conversa. **Não houve acesso direto do revisor ao Supabase.**

> **Escopo estrito.** O banco isolado reproduz um *snapshot histórico conhecido*, inclusive configurações de risco. A aprovação desta etapa **não comprova paridade atual com o ambiente produtivo, não homologa a segurança do snapshot e não substitui testes comportamentais de RLS**. A eventual paridade com produção depende de preflight E0b.1, sujeito a autorização específica.

## 1. Identificação e limites

| Item | Registro |
|---|---|
| Ambiente | `rc2-test-isolated` |
| Supabase Project Reference ID | `pyhhygvdjokddphftuua` |
| Contexto SQL (B0) | `current_database() = postgres`; `current_user = postgres` |
| PostgreSQL | `17.11` (`server_version_num = 170011`) |
| `search_path` | `"$user", public, extensions` |
| Branch de desenvolvimento informada | `feat/admin-e0a-foundation` |
| HEAD informado | `2ea2c82` |
| Working tree | Informada limpa pelo executor local na investigação/correção B3; não revalidada aqui diretamente contra seu disco |
| Ambiente de produção | **Fora do escopo; não consultado nem modificado** |
| Método | SQL manual com `BEGIN READ ONLY; ... ROLLBACK;` e consultas auxiliares equivalentes para reunir múltiplos resultados |

**Restrição de identidade:** `current_database() = postgres` não identifica sozinho o projeto Supabase. A identidade do projeto deve ser conferida visualmente pelo operador na URL do SQL Editor (`/project/pyhhygvdjokddphftuua/`) e em **Settings → General**. Este relatório não representa uma verificação independente de credenciais ou uma certificação C14.

## 2. Artefato de auditoria

**Arquivo de trabalho no equipamento do operador:** `D:\Projetos\rc2-ex2a-2-auditoria-somente-leitura.sql` (fora do repositório).\
**Arquivo de auditoria fornecido para revisão:** `rc2-ex2a-2-auditoria-somente-leitura(1).sql`.

- **SHA-256 final, calculado independentemente sobre o arquivo anexado:** `aaddd89eadc845578ff7feb263a9bd9522856ed2ed091cecd74495ab3e105427`.
- **Tamanho final:** `34.881 bytes`.
- **Blocos:** B0–B9; seção K do `verify-baseline.sql` propositalmente excluída antes do marcador.
- O script contém exclusivamente inspeções de catálogo e de dados, em transações de leitura. As consultas auxiliares executadas mantiveram a mesma finalidade e não alteraram o banco.

### 2.1 Ocorrência controlada — diferenças B3 em `DEFAULT NULL`

A primeira comparação B3.2 apresentou **nove divergências textuais de default**, todas em colunas `VARCHAR(n)` de `public.posts`: `seo_keyword_primary`, `seo_meta_title`, `seo_meta_description`, `category`, `content_type`, `author_name`, `author_title`, `cover_url_alt` e `og_title`.

A investigação documental local relatou que `migrations/add_blog_seo_fields.sql` declara `VARCHAR(n) DEFAULT NULL` explicitamente nessas nove colunas. No PostgreSQL 17.11, o catálogo retornou `NULL::character varying`; a versão inicial do script esperava ausência de expressão default (`NULL`).

**Resolução:** foram alteradas **somente as nove expectativas da CTE `esperado` do B3.2**, de `NULL` para `'NULL::character varying'`, mais comentário documental. O diff foi revisado, o SHA-256 final foi confirmado e **nenhuma migration ou coluna no banco foi modificada**. Após a correção, o B3.2 retornou `Success. No rows returned`.

**Classificação:** divergência da expectativa do artefato de auditoria, **resolvida**; nenhuma divergência remanescente detectada nas 85 colunas.

## 3. Matriz de resultados B0–B9

| Bloco | Objeto auditado | Evidência observada | Parecer |
|---|---|---|---|
| **B0** | Contexto e isolamento lógico | PostgreSQL 17.11; `auth.users = 0`, `admin_users = 0`, marcador = 0 | **Aprovado** |
| **B1** | Baseline A–J | 6 tabelas com RLS; 15 policies; policy histórica `leads_anon_insert` presente; `bootstrap_first_admin` ausente; `posts` com 34 colunas; 3 índices de auditoria; cron ativo; `ensure_rls` e `rls_auto_enable` presentes | **Aprovado** |
| **B2** | Contagens, papéis, ACLs e constraints | 13 colunas de `settings`; 21 índices; 2 triggers; 15 policies; 13 registros de `settings`; 18 combinações papel×tabela; 3 constraints de auditoria | **Aprovado** |
| **B3** | Estrutura das colunas | 6 tabelas, **85 colunas**; após correção de nove defaults no script, comparação bidirecional sem diferenças | **Aprovado** |
| **B4** | Constraints e índices | 14 constraints (identidade/tipo e revisão de definição); 21 índices (identidade/definição); ambas as consultas de diff retornaram zero linhas | **Aprovado** |
| **B5** | Triggers, funções, event triggers, inventário | 2 triggers de `updated_at` ativos; 2 funções `plpgsql`; `ensure_rls` conforme; 6 tabelas e 21 índices; zero enums/domínios/ranges próprios | **Aprovado** |
| **B6** | Definições de policies RLS | 15 policies, sem diferenças de tabela, nome, comando, papéis, `USING` ou `WITH CHECK`; zero linhas | **Aprovado** |
| **B7** | Grants e ACLs | 6 ACLs padrão; 24 combinações tabela×beneficiário; nenhuma ACL por coluna; 6 testes `EXECUTE` positivos; schema `USAGE = true` e `CREATE = false` para os três papéis; `TRUNCATE` em 6/6 tabelas para cada papel | **Aprovado quanto à reprodução histórica; risco registrado** |
| **B8** | Extensões e agendamento | `pg_cron 1.6.4` em `pg_catalog`; `pgcrypto 1.3` em `extensions`; 1 job `publish-scheduled-posts` a cada 5 min, ativo e com comando esperado; 200 execuções `succeeded`, nenhuma `failed` no histórico examinado | **Aprovado** |
| **B9** | Conteúdo e integridade | `leads/posts/admin_users/authors/admin_audit_logs = 0`; `settings = 13`; diferenças de chaves/valores = `[]`; 13 registros com campos textuais auxiliares vazios, lat/lng nulos e CEP/localidade nulos; marcador = 0 | **Aprovado** |

**Resultado global:** **10/10 blocos aprovados**; **zero divergências pendentes dentro dos critérios definidos pelo EX-2A-2**.

### 3.1 Evidências adicionais significativas

- **RLS habilitada nas seis tabelas**, sem `FORCE ROW LEVEL SECURITY`. Distribuição das 15 policies: `admin_users` 4; `authors` 4; `leads` 3; `posts` 2; `settings` 2; `admin_audit_logs` 0.
- `service_role.rolbypassrls = true`; `anon` e `authenticated` com `rolbypassrls = false`.
- As ACLs históricas das seis tabelas concedem `arwdDxtm` a `anon`, `authenticated` e `service_role`; o PostgreSQL 17 inclui `MAINTAIN` entre os privilégios aferidos.
- `rls_auto_enable()`: proprietário `postgres`, `SECURITY DEFINER = true`, `search_path = pg_catalog`; `update_updated_at()`: proprietário `postgres`, `SECURITY DEFINER = false`. As ACLs das duas funções incluem `EXECUTE` para `PUBLIC`.
- Job `publish-scheduled-posts`, ID 1, usuário `postgres`, banco `postgres`, cron `*/5 * * * *`, comando equivalente exatamente à expectativa normalizada. As **200 execuções** observadas entre 15/10 e 16/10 retornaram `UPDATE 0`, o que comprova a execução sem erro naquele histórico, **não** uma publicação efetiva de um post.
- `pg_net` não foi observado entre extensões instaladas; neste gate era **informativo**, com análise reservada ao E0b.1. Outras extensões da plataforma não foram tratadas como desvio.

## 4. Riscos, ressalvas e não conformidades de segurança ainda NÃO tratadas

A reprodução fiel não equivale a aprovação para uso produtivo. Permanecem os seguintes itens:

1. **`TRUNCATE` para `anon` e `authenticated` nas seis tabelas:** risco explícito, já que RLS **não restringe** `TRUNCATE`. Não executar teste destrutivo neste gate.
2. **Policy `leads_anon_insert`** do snapshot histórico: permanecerá documentada até o endurecimento específico; não presumir proteção suficiente sem teste funcional.
3. **Privilégios amplos**, inclusive `REFERENCES`, `TRIGGER`, `MAINTAIN` e operações DML, reproduzidos conforme o histórico. Requerem avaliação de segurança e menor privilégio em etapa própria.
4. **`admin_audit_logs` sem policies próprias:** tabela criada e RLS habilitada, mas comportamento de acesso ainda precisa de validação.
5. **`EXECUTE` a `PUBLIC` nas funções catalogadas:** registrar para a avaliação de permissões; a concessão isolada não demonstra explorabilidade.
6. **Ausência de testes comportamentais reais de RLS:** B6 valida textos e metadados; não substitui a matriz de integração com usuários sintéticos.
7. **Sem paridade atual com produção declarada:** E0b.1 deve verificar eventual drift, mediante autorização específica.

**Nenhum `GRANT`, `REVOKE`, `ALTER POLICY`, `ALTER TABLE`, `TRUNCATE`, migration ou correção de dados está autorizado por esta evidência.**

## 5. Limites da homologação e gates posteriores

| Marco | Estado após EX-2A-2 | Condição de avanço |
|---|---|---|
| **EX-2A-1 — Snapshot reconstruído** | Concluído anteriormente | Registro histórico preservado; `008_bootstrap_first_admin.sql` **não** aplicado; migration 009 somente parcial, conforme reconstrução documentada |
| **EX-2A-2 — Auditoria histórica** | **ENCERRADA / APROVADA** | Evidência registrada neste relatório |
| **EX-2A-3 — Revisão/correção eventual de grants** | **Não executada** | Somente se houver decisão e autorização específicas; nenhuma divergência de grants com o snapshot foi identificada |
| **EX-2B — Marcador de teste** | **Não executada** | Autorização própria, conferência do projeto de teste e procedimento aprovado; a chave `__rc2_isolated_test_env__` continua ausente |
| **EX-2C — Verificação pós-marcador** | Bloqueada | Executar depois da EX-2B; verificar existência/valor do marcador e baseline ajustado |
| **EX-3 — Credenciais isoladas e C14** | Bloqueada | `.env.test.local` exclusivo do teste; verificação independente assinada, sem exibir segredos |
| **Task 8 — Testes reais de RLS** | Bloqueada | EX-1/EX-2/EX-3 concluídos e checklist C14 assinado; somente projeto isolado |
| **Task 9 / demais entregas dependentes** | Bloqueadas | Gates anteriores e evidências necessárias concluídos |
| **E0b.1 — Preflight do ambiente produtivo** | Fora deste escopo | Solicitação e autorização independentes; nenhuma inspeção de produção ocorreu neste gate |

**Nota sobre C14:** conferir nome/ref do projeto, credenciais de teste sem exposição, referência real da produção, allowlist, ausência de URL produtiva no arquivo de teste e marcador correto. **C14 não está assinado nem satisfeito por esta auditoria.**

## 6. Histórico de execução e mudanças autorizadas

- **Execução das consultas:** manualmente pelo operador no SQL Editor do projeto isolado; o revisor avaliou as saídas compartilhadas.
- **Alterações feitas no banco durante EX-2A-2:** nenhuma relatada; consultas de auditoria em transação `READ ONLY`.
- **Única correção documental de auditoria:** nove expectativas de default e comentário explicativo no B3.2 do script complementar, fora do repositório.
- **Alterações em migrations:** nenhuma relatada.
- **Alterações em Git:** nenhuma relatada; nenhum push, merge ou PR autorizado nesta etapa.
- **Ressalva metodológica:** aprovação baseada em resultados reportados e arquivo SQL anexado; sem acesso autônomo ao banco, às credenciais, ou ao estado local do repositório do operador.

## 7. Decisão de encerramento

**EX-2A-2: APROVADA E ENCERRADA EM 16/10/2026.**

A configuração do Supabase isolado demonstrou aderência aos **critérios do snapshot histórico auditado** em B0–B9. O erro de expectativa do B3 foi investigado, corrigido exclusivamente no script e revalidado, com zero divergências. As permissões históricas arriscadas estão **registradas, não remediadas**. Não foi declarada paridade com a produção nem liberada a execução da suíte de integração.

**Próxima ação recomendada:** incorporar este relatório à documentação de evidências do projeto, mediante processo local controlado, e submeter a **decisão de gate** EX-2A-3 / preparação EX-2B separadamente. **Este documento não autoriza execução de EX-2B.**

---

**Referências de processo:** `docs/runbooks/ambiente-supabase-isolado.md`; `docs/runbooks/ambiente-teste/verify-baseline.sql`; `docs/runbooks/migrations-manuais.md`; `docs/07-supabase-migration-baseline.md` (snapshot histórico).\
**Destino sugerido no repositório, ainda NÃO aplicado:** `docs/runbooks/evidence/EX-2A-2-2026-10-16.md`.\
**Classificação:** Evidência técnica, sem segredos ou credenciais.
