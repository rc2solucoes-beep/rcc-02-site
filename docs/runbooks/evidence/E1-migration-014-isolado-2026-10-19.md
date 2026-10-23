# Migration 014 no isolado — registro consolidado (2026-10-19)

Branch `feat/admin-e1-cms`. Projeto: exclusivamente `rc2-test-isolated`. Sem Reference ID, URLs, chaves, refs, IPs nem dados pessoais.

## Natureza deste registro

**Tudo o que a seção 2 registra como executado no banco é DECLARAÇÃO DO RESPONSÁVEL**, informada ao agente em 19/10/2026, sem assinatura. O agente **não** acessou o banco, **não** viu a tela do SQL Editor, **não** executou nenhum SQL e **não** verificou nenhum resultado por outro meio. Onde o responsável não forneceu o valor (por exemplo, o `impressao_md5` do preflight), isso está dito. Evidência automatizada, neste documento, é somente a da seção 4 (local, sem rede).

## 1. Autorizações

| ID | Estado | Registro |
|---|---|---|
| AUT-READ-E1-2026-10-19 | **UTILIZADA**, por declaração do responsável (marcador e preflight, manuais, somente leitura) | Documento `AUT-READ-E1-2026-10-19.md`. O campo "CONFIRMO / NÃO CONFIRMO" do documento **não foi preenchido por mim**; a utilização consta só desta declaração |
| AUT-APPLY-014 | **CONCEDIDA e UTILIZADA**, por declaração do responsável (apply manual da 014 e `verify.sql` no isolado) | **Não há documento próprio de AUT-APPLY-014 no repositório.** A concessão consta apenas da declaração |
| AUT-EXEC-E1 | **NÃO CONCEDIDA** | Ver `AUT-EXEC-E1-2026-10-19.md` (PENDENTE DE CONFIRMAÇÃO FINAL) |

Fase B: **NÃO LIBERADA** para a suíte de integração. Incidente de credenciais: **ABERTO**.

## 2. O que o responsável declarou

| Etapa | Resultado declarado | Natureza |
|---|---|---|
| Marcador `__rc2_isolated_test_env__` | Conforme | Declaração humana. Cobre **CC-6** e o item 5.D |
| Preflight da 014 | Aprovado; zero posts | Declaração humana. Os valores por item (versão, colunas, CHECK, triggers, cron) **não** foram fornecidos ao agente |
| Dependências de esquema (`add_blog_seo_fields.sql`) | Confirmadas pelo preflight | Declaração humana. Cobre **E1-CC-10** e o item 5.F |
| Apply manual da 014 | Realizado no SQL Editor do isolado | Declaração humana |
| `verify.sql` | 9 de 9 verificações satisfatórias (tabela abaixo) | Declaração humana |
| Total de posts | 0 antes e 0 depois (igual ao preflight) | Declaração humana |
| Policies de `posts` | 2 policies; `impressao_md5` do verify = `8953fc15d02f1bf67b61807687eb8e32`; "preservadas" | Declaração humana. O valor do preflight **não** foi informado ao agente; a igualdade é declarada, não comparada por mim. Cobre **E1-CC-11** e **REV-4** só por declaração. O MD5 é resumo, não segredo |

### 2.1 Os nove itens do `verify.sql`, como declarados

| # | Verificação | Declarado |
|---|---|---|
| 1 | `sort_at` presente, gerada `STORED`, `NOT NULL`, `timestamptz` | satisfatório |
| 2 | Expressão `CASE` conforme o SDD | satisfatório |
| 3 | Nulos = 0; divergentes = 0 | satisfatório (sobre tabela vazia: não exercita a expressão com dados) |
| 4 | Índice `posts_sort_at_id_idx` presente e válido | satisfatório |
| 5 | `posts_slug` e `posts_status_published_at` preservados | satisfatório |
| 6 | Total de posts = 0, igual ao preflight | satisfatório |
| 7 | 2 policies; `impressao_md5` informado acima | satisfatório |
| 8 | Cron `publish-scheduled-posts` ativo | satisfatório |
| 9 | Trigger `posts_updated_at` habilitado | satisfatório |

**Limite.** Com 0 posts, o verify prova a estrutura (coluna, expressão, índice), não o cálculo sobre linhas reais. O cálculo é o objeto de T-CMS-I01, I02 e I05, que ainda **não foram executados**.

## 3. O que continua ABERTO (não encerrar por este registro)

| Item | Estado |
|---|---|
| **PV-17** (exposição de `sort_at` pelo PostgREST e cache de schema) | **ABERTA.** O verify é SQL direto; não passa pelo PostgREST. Só T-CMS-I01, I04, I06 e I07 respondem. Se aparecer `PGRST204`, o procedimento é `NOTIFY pgrst, 'reload schema';`, que **não** foi executado e exige decisão do responsável |
| **D2** (busca literal, `*`) | **ABERTA.** Só T-CMS-I03. A contingência (RPC, migration 015) **não** foi aplicada |
| **D3** (`PGRST103` fora da faixa) | **ABERTA.** Só T-CMS-I08 |
| **PV-14** | **PARCIAL.** O que a suíte cobre é só que o `UPDATE` equivalente ao cron recalcula `sort_at` (T-CMS-I05); a leitura de que o cron não revalida o cache do blog é por inspeção |
| **PV-13** | Só no preflight de produção, **não autorizado** |
| **REV-1 e REV-2** | **PENDENTES DE CONFIRMAÇÃO HUMANA.** Não foram declarados concluídos |
| Produção | Nada executado. 014 em produção: **não aplicada**, preflight de produção **não autorizado** |

**Observação de governança.** O apply ocorreu sem REV-1 e REV-2 confirmados. O caminho previsto é `E1-REV-EX01` (aprovada em 19/10/2026), que aceita a ausência de revisão humana independente como risco residual. A exceção não transforma REV-1 e REV-2 em concluídos. Também não foi informado ao agente se CC-5 e CC-9a foram repetidos imediatamente antes do apply; para a suíte, serão repetidos (ver o documento AUT-EXEC-E1).

## 4. Verificações locais de 19/10/2026 (automatizadas, sem rede)

Executadas pelo agente após as declarações, sem nenhuma conexão. Detalhes e comandos no `AUT-EXEC-E1-2026-10-19.md`, seção 6.

| Verificação | Resultado |
|---|---|
| Carga do `.env.test.local` pelo harness, sem `env_conflict`; seis variáveis presentes | CONFORME |
| Guarda estática (`getVerifiedTarget`) | CONFORME |
| `.env.test.local` ignorado e não rastreado | CONFORME |
| `npx vitest run tests/unit/ops` | 16 arquivos, 133 testes aprovados |
| `tsc --noEmit`; `git diff --check` | Sem erros |

Nada disto comprova o estado do banco.
