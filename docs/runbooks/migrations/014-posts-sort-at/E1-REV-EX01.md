# E1-REV-EX01 — Exceção ao gate "revisão por segundo engenheiro" (migration 014)

| Campo | Valor |
|---|---|
| ID | E1-REV-EX01 |
| **Status** | **APROVADA** em 19/10/2026 (escopo e limites abaixo) |
| Data da proposta | 2026-10-19 |
| Branch | `feat/admin-e1-cms` |
| Gate de origem | `docs/runbooks/migrations-manuais.md`, regra 6 e passo 3: "um segundo engenheiro revisa `apply`, `preflight`, `verify` e `rollback`" |
| Motivo | A RC2 não dispõe de segundo engenheiro |
| Decisor | Responsável pelo projeto e pela infraestrutura (decisão formal pendente) |
| Aprovada por / em | Responsável pelo projeto e pela infraestrutura, em 19/10/2026 (declaração expressa; ver seção 6) |

> **Aprovada, com risco residual aceito.** A exceção dispensa o gate de segundo engenheiro apenas para a E1, migration 014, no projeto `rc2-test-isolated`. Ela **não** transforma a revisão humana independente em concluída: a ausência dela é um risco residual conhecido e aceito, e a análise técnica por IA **não** deve ser registrada como revisão humana independente. A Fase B **não está liberada**: AUT-APPLY-014 e AUT-EXEC-E1 seguem NÃO CONCEDIDAS.

## 1. Escopo pedido

Exclusivamente:

- Migration `014_posts_sort_at.sql` e seus scripts (`preflight.sql`, `verify.sql`, `rollback.sql`).
- Aplicação **somente no projeto isolado** `rc2-test-isolated` e execução da suíte de integração E1 nesse projeto.

**Fora do escopo (continuam exigindo decisão própria):**

- Qualquer ambiente de produção, inclusive o preflight de produção e PV-13.
- Migration 015 (contingência RPC de busca).
- Testes E2E de escrita (EX-4).
- Outras migrations, entregas e fases. Não é precedente.

## 2. O que a análise de IA é e o que não é

A Fase A (2026-10-19) foi uma **análise técnica por IA** do SQL, da busca D2 e do harness.

| É | Não é |
|---|---|
| Leitura sistemática do SQL e do código, com testes unitários e verificação estática | Revisão humana **independente** |
| Fonte de achados reais (dependência de `add_blog_seo_fields.sql`; lacunas de preflight/verify; fraqueza do I03) | Execução em PostgreSQL ou PostgREST reais |
| Checagem adicional | Substituto do gate |

Limites declarados da análise de IA:

- **Não executou nada em banco.** Tudo o que depende do PostgreSQL real (aceitação do DDL, comportamento do `BEGIN/COMMIT` no SQL Editor, plano do índice, exposição pelo PostgREST) está **não verificado**.
- **Pode errar de modo correlacionado.** O mesmo agente escreveu parte das correções e as revisou; a revisão não é independente de quem produziu o código.
- **D2 está aberta**: a hipótese sobre `*` no `ilike` do PostgREST só se resolve no banco.
- Análise estática e testes unitários não provam semântica de SQL.

O responsável também **não é independente**: o gate existe para separar autoria e conferência, e esta exceção não cria essa separação.

## 3. Riscos residuais

| # | Risco | Impacto no isolado | Severidade |
|---|---|---|---|
| R1 | Defeito no SQL não percebido por ninguém além do autor | Falha da migration (transação reverte) ou coluna/índice incorretos; sem dados reais | Baixa |
| R2 | Viés de confirmação (autor = conferente) | Lacuna de verificação não detectada | Média |
| R3 | Premissa de PostgreSQL/PostgREST falsa (PV-17) | `verify`/I01 falham; diagnóstico necessário | Baixa |
| R4 | Rollback usado sem a ordem correta (código antes) | Lista do CMS em erro **apenas no isolado** | Baixa |
| R5 | A exceção ser tomada como precedente para produção | Migration em produção sem revisão independente | **Alta** (mitigada pelo escopo da seção 1) |
| R6 | Dependência de `add_blog_seo_fields.sql` ausente no isolado | `ALTER` falha por coluna inexistente; sem dano | Baixa |

O isolado não contém dados de produção, o que limita o impacto. A exceção **não** aceita nenhum risco em produção.

## 4. Controles compensatórios (REV-1 a REV-10 exigíveis, conforme a aplicabilidade de cada um)

Estado em 19/10/2026: **nenhum controle foi executado ainda**. O estado de cada um está na seção 6.1.

| ID | Controle | Aceite objetivo |
|---|---|---|
| REV-1 | Leitura integral dos quatro scripts pelo responsável, com o checklist da seção 8 do `REVISAO-HUMANA.md` | Checklist preenchido e datado pelo responsável; ele não é revisão independente e assim fica registrado |
| REV-2 | Releitura após intervalo mínimo definido pelo responsável (sugestão: dia seguinte), sem a presença do autor da correção | Data e hora das duas leituras registradas |
| REV-3 | Preflight `READ ONLY` executado e analisado antes do apply | Saída arquivada sem dados pessoais; qualquer divergência interrompe |
| REV-4 | Verify com comparação **completa** de policies (nome, comando, papéis, permissividade, `qual`, `with_check`) por impressão `md5`, mais trigger e cron | `total_policies` e `impressao_md5` iguais entre preflight (item 11) e verify (item 7) |
| REV-5 | Conferência determinística local | `npx vitest run tests/unit/ops tests/unit/admin`, `tsc` e `git diff --check` verdes imediatamente antes do apply |
| REV-6 | Aplicação manual, nunca por CLI, MCP ou conexão automática | Registro de quem aplicou, quando e em qual projeto (conferido por E1-C14-EX01) |
| REV-7 | Interrupção no primeiro erro, sem rollback automático | Diagnóstico registrado e decisão do responsável antes de qualquer correção destrutiva |
| REV-8 | Revisão externa pontual (opcional, recomendada) | Qualquer pessoa com conhecimento de PostgreSQL lê apenas os quatro scripts (cerca de 150 linhas). Se ocorrer, registrar nome, data e resultado; **isso converte o gate em atendido pela via A** e dispensa esta exceção |
| REV-9 | Escopo travado | Nenhum uso em produção; produção exige nova decisão (revisão independente ou nova exceção, expressa e separada) |
| REV-10 | Higiene de segredos | Varredura de diff e evidências com saída apenas de status (ver CC-9a/b de E1-C14-EX01) |

## 5. O que esta exceção não faz

- Não declara a revisão humana como concluída.
- Não aprova D2, PV-17, PV-14 ou D3.
- Não autoriza apply nem execução da suíte (são autorizações separadas: ver E1-C14-EX01, seção 6).
- Não se estende a produção nem a E2/E3.
- Não encerra o incidente de credenciais (permanece ABERTO).

## 6. Decisão formal

| Campo | Valor |
|---|---|
| Decisão | **APROVAR** |
| Data | 19/10/2026 |
| Fundamento | Declaração expressa do responsável pelo projeto e pela infraestrutura, feita ao agente nesta conversa em 19/10/2026. Nenhuma assinatura, nome ou identificador é registrado; o agente não a verificou por outro meio. |
| Risco residual (R1 a R6) aceito | **Sim**, incluindo a ausência de segundo engenheiro e de revisão humana independente |
| Escopo | Exclusivamente a E1, migration 014, projeto `rc2-test-isolated` |
| Não autoriza | Produção; migration 015; E2E de escrita; AUT-APPLY-014; AUT-EXEC-E1 |
| Revisão humana independente | **NÃO REALIZADA** (continua pendente como fato; a exceção apenas dispensa o gate) |
| Natureza do registro | Declaração humana informada ao agente; sem assinatura |

### 6.1 Estado dos controles (nenhum conforme sem evidência)

| ID | Estado em 19/10/2026 |
|---|---|
| REV-1 | PENDENTE (checklist do `REVISAO-HUMANA.md` não preenchido) |
| REV-2 | PENDENTE (depende de REV-1 e do intervalo) |
| REV-3 | PENDENTE (preflight não executado) |
| REV-4 | PENDENTE (scripts reforçados e commitados; a comparação só ocorre no banco) |
| REV-5 | PENDENTE para o momento do apply; as verificações locais de 19/10 não substituem a repetição imediatamente antes |
| REV-6 | PENDENTE (aplicação manual futura) |
| REV-7 | PENDENTE (vale durante a execução) |
| REV-8 | OPCIONAL; não realizado |
| REV-9 | EM VIGOR (escopo travado por esta decisão) |
| REV-10 | PENDENTE (varredura CC-9a/b) |
