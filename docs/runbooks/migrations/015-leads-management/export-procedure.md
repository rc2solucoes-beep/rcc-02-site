# Migration 015 — Recuperação e exportação de dados (E2)

**ESTADO: PROCEDIMENTO DOCUMENTAL. NADA AQUI FOI EXECUTADO OU TESTADO.** Nenhum
script de contenção ou de rollback foi executado. Este documento não autoriza
nenhuma execução: cada etapa exige autorização própria, por ambiente.

Artefatos deste diretório:

| Arquivo | Natureza | Pode destruir dados? |
|---|---|---|
| `recovery-triage.sql` | Somente leitura (`BEGIN READ ONLY`, passa no lint) | Não |
| `containment.sql` | **Modelo protegido, NÃO autorizado para execução**; retira só escritas de `authenticated` e termina em `ROLLBACK` | Não |
| `rollback-structural.sql` | **Modelo protegido, NÃO autorizado para execução**; aborta na 1ª instrução | Sim, se derivado e executado |
| `rollback.sql` | Marcador de bloqueio, **inalterado** | Não |
| `preflight.sql` / `verify.sql` | Asserções somente leitura + snapshots | Não |

## 1. Princípios

1. **Nunca há rollback automático.** `rollback.sql` permanece só como bloqueio.
2. **Nunca reabrir `anon`** (DEC-08): nem policy, nem grant, em nenhum cenário.
3. **Dados novos primeiro:** reverter o código E2 → conter → exportar → só então decidir sobre o banco.
4. **Ausência de notas ou atividade não prova que reverter é seguro.** Um lead
   excluído leva suas notas e seu histórico por `ON DELETE CASCADE`; contagens
   zeradas podem ser consequência disso. Estatísticas do Postgres e o log de
   auditoria só ajudam a *acusar* uso, nunca a negá-lo (reset, crash, retenção indefinida).
5. **Sem evidência suficiente = `INDETERMINADO` = bloqueado.** Erro em qualquer
   consulta da triagem, NULL ou consulta não executada contam como `INDETERMINADO`.
6. **`containment.sql` e `rollback-structural.sql` são modelos protegidos e não estão autorizados para execução.** Nenhum deles é acionável por acidente (ambos terminam em `ROLLBACK`; o estrutural aborta na 1ª instrução) e nenhum deve ser transformado em script executável automaticamente: o script de um incidente é um derivado específico do alvo, revisado por pessoa independente e autorizado à parte.
7. **`ELEGIVEL_COM_ATESTADOS` não é "seguro":** significa apenas que o rollback
   estrutural pode ser *considerado*, com revisão independente e autorização.

## 2. Matriz de recuperação

Como classificar: `recovery-triage.sql` (S1, S1B, S2, S3) + `verify.sql` + atestados A1..A7 (seção 3).

| Estado | Evidências que o definem | Ações permitidas | Bloqueios |
|---|---|---|---|
| **NAO_APLICADA** | S1 = `NAO_APLICADA`; `preflight.sql` = `APROVADO` | Seguir o runbook normal de apply | Rollback não se aplica |
| **PARCIAL_OU_DIVERGENTE** | S1 = `PARCIAL_OU_DIVERGENTE` (objetos faltando/sobrando) | Parar escritas; conter; exportar; preservar o estado; plano específico ou **restauração de backup** | **Rollback estrutural bloqueado** |
| **ANOMALIA_DE_ACESSO** | S1B: `anon` com privilégio, PUBLIC em ACL, policy desconhecida em `leads`, trigger da 015 desabilitado | Tratar como **incidente de segurança**; conter; investigar; corrigir a causa | Bloqueado. **Nunca** conceder nada a `anon` |
| **USO_DETECTADO** | S2: notas, atividade, `status` ≠ `new`, próxima ação, arquivados, `updated_at` ≠ `created_at`, `status_updated_at`, ou estatísticas de INSERT em notas/atividade | Reverter código; conter; **exportar** (seção 5); corrigir adiante (forward fix) | **Rollback estrutural proibido** (destruiria dados novos) |
| **EXCLUSAO_DETECTADA** | S2: DELETE em `leads`/notas/atividade nas estatísticas; S3: `admin_lead_deleted`/`admin_lead_delete_failed` | Como `USO_DETECTADO` + **restauração de backup/PITR em ambiente separado** para recuperar o que o CASCADE apagou | Rollback estrutural proibido; rollback **não** recupera exclusões |
| **INDETERMINADO** | Qualquer consulta S1..S3 que falhou, deu NULL, não rodou, ou atestado A1..A7 faltando; banco aplicado e sem `USO_DETECTADO` | Conter; exportar estrutura e metadados; coletar as evidências que faltam | **Rollback estrutural bloqueado** até resolver |
| **ELEGIVEL_COM_ATESTADOS** | S1 `APLICADA_COMPLETA`, `verify.sql` `APROVADO`, S1B sem anomalia, S2 `SEM_USO_DETECTADO_NO_BANCO`, S3 `SEM_EVENTOS_E2_NA_AUDITORIA` **e** A1..A7 todos comprovados | Derivar script específico de `rollback-structural.sql`, revisão independente, backup testado, **autorização separada** | Só executa com a autorização; mesmo assim restauração de ACL/policies é conferida pelo preflight |

## 3. Atestados externos (o banco não prova)

Todos por escrito, na evidência versionada (sem PII), com a referência da fonte:

| ID | Exigência |
|---|---|
| A1 | O código E2 nunca foi implantado em produção nem recebeu tráfego (histórico de deploys da Vercel e logs de aplicação). |
| A2 | Nenhum lead foi excluído desde o apply (auditoria, estatísticas, contagem do preflight e do backup anterior). |
| A3 | Nenhuma escrita manual ou via `service_role` nos campos novos desde o apply (logs de consulta do Supabase). |
| A4 | Backup íntegro feito **antes** da reversão, com restauração testada em ambiente isolado. |
| A5 | Snapshot pré-015 (EVD-* e DIGEST-* do preflight) disponível e verificável. |
| A6 | Autorização explícita e separada do responsável pela reversão estrutural. |
| A7 | Escritas da E2 interrompidas (contenção aplicada) e código revertido antes de mexer no banco. |

## 4. Quando é restauração de backup, e não rollback

Rollback estrutural **não** resolve, e a recuperação passa por backup/PITR (restaurado
em ambiente **separado**, com extração seletiva e revisão), quando:

1. Um lead foi excluído depois da 015 (CASCADE apagou notas e histórico).
2. As colunas históricas de `leads` foram alteradas ou apagadas (a autoverificação da 015 prova só o momento do apply).
3. Há corrupção, perda ou divergência de `lead_notes`/`lead_activity`.
4. O estado é PARCIAL_OU_DIVERGENTE e não há plano específico validado.
5. Houve escrita indevida por papel não autorizado (anomalia de acesso) e não se sabe o que mudou.
6. O snapshot pré-015 não existe ou não confere (A5).

## 5. Exportação (preservar dados novos antes de qualquer decisão)

**Quem:** pessoa autorizada para o alvo. **Quando:** depois de reverter o código e aplicar a contenção.
**Natureza:** consultas `SELECT` dentro de `BEGIN READ ONLY`, exportadas por `\copy` do cliente.

| Conjunto | Consulta (exemplo) | PII? |
|---|---|---|
| Gestão de leads | `SELECT id, status, status_updated_at, next_action, next_action_at, archived_at, updated_at FROM public.leads ORDER BY id` | `next_action` é texto livre: **tratar como possível PII** |
| Notas | `SELECT id, lead_id, author_id, body, created_at FROM public.lead_notes ORDER BY created_at, id` | **Sim** (`body` é texto livre) |
| Histórico | `SELECT id, lead_id, actor_id, kind, from_value, to_value, created_at FROM public.lead_activity ORDER BY created_at, id` | Não (valores de enum e IDs) |

Regras de proteção:

1. Arquivos **nunca** vão para o repositório, para `.tmp/`, para chat ou e-mail. Armazenar cifrados, com acesso restrito, e registrar quem acessou.
2. Conferir contagens contra a triagem (T2-01, T2-02) e registrar o `sha256` de cada arquivo na evidência (só o hash, nunca o conteúdo).
3. Definir retenção e descarte do export na mesma autorização que o autoriza (LGPD): o export de notas contém dado pessoal.
4. Exportar **antes** da contenção apenas se a autorização de leitura cobrir; a contenção não apaga nada, então não há urgência que justifique pular a ordem.

## 6. Snapshots verificáveis: preservar e restaurar privilégios e policies

O **preflight** é o snapshot do estado anterior. Guardar, na evidência da execução (sem segredos):

- `EVD-ACL-TABELA`, `EVD-ACL-COLUNA`, `EVD-ACL-PADRAO`, `EVD-ACL-SCHEMA` (donos, RLS, ACL bruta);
- `EVD-POLICY` (nome, permissive, papéis, comando, `qual`, `with_check`);
- `EVD-TRIGGER`, `EVD-FUNCAO`, `EVD-CONSTRAINT`/`EVD-INDICE`;
- `DIGEST-ACL`, `DIGEST-POLICIES`, `DIGEST-TRIGGERS`, `DIGEST-FUNCAO`, `DIGEST-CONSTRAINTS-E-INDICES`;
- o `verify.sql` pós-apply como snapshot do estado novo.

Restauração:

1. O script de restauração é **gerado a partir do snapshot**, nunca de memória, e revisado por pessoa independente.
2. Policies legadas são recriadas pela definição de `EVD-POLICY`; ACLs de tabela e de coluna, por `EVD-ACL-*`. **Nada** de `anon`.
3. **Critério de sucesso:** re-executar `preflight.sql` — `RESULTADO = APROVADO` e **todos os DIGEST iguais** aos guardados. Qualquer digest diferente = restauração não verificada = bloqueado.
4. Se o snapshot não existir, ou não houver como comprovar o estado anterior, a recuperação é por backup (seção 4).

## 7. Sequência no incidente

1. Declarar o incidente; parar escritas administrativas; **reverter o código E2** (deploy autorizado).
2. Rodar `recovery-triage.sql` (leitura autorizada) e `verify.sql`; classificar na matriz (seção 2).
3. Aplicar a contenção (`containment.sql`) se houver risco de escrita: depende de autorização AUT-CONTAIN; é não destrutiva.
4. Exportar os dados novos (seção 5).
5. Decidir: correção adiante (padrão), restauração de backup, ou — só em `ELEGIVEL_COM_ATESTADOS` — derivar o script estrutural.
6. Registrar tudo no `REGISTRO.md` e na evidência. Não editar o registro como se algo tivesse sido aplicado antes de executar.

## 8. Pré-condições, impactos e dependências

- **Pré-condições:** alvo identificado; autorização de leitura/escrita por etapa; backup íntegro (A4); snapshot pré-015 (A5); código E2 revertido (A7).
- **Impactos:** a contenção bloqueia criar notas, alterar status/próxima ação/arquivamento e excluir leads pela API, até a restauração das permissões; o formulário de contato (`service_role`) e a leitura admin continuam. O rollback estrutural perde status, próxima ação, arquivamento, notas e histórico.
- **Dependências:** 012 aplicada (acesso `anon` removido); `update_updated_at()` (002) preservada (serve `posts` e `settings`); 013 só afeta a leitura de auditoria no admin; `admin_audit_logs` (009) para a evidência S3.
- **Não cobre:** exclusões já ocorridas, perda de dado por causas externas, nem o que depende de retenção do log de auditoria.

## 9. Aprovações (a preencher)

| Etapa | Executor | Autorizador | Data | Evidência |
|---|---|---|---|---|
| Triagem READ ONLY (alvo) | — | — | — | Pendente |
| Contenção (AUT-CONTAIN) | — | — | — | Pendente |
| Exportação | — | — | — | Pendente |
| Rollback estrutural derivado (AUT-ROLLBACK-ESTRUTURAL) | — | — | — | Pendente |
| Restauração de backup | — | — | — | Pendente |
