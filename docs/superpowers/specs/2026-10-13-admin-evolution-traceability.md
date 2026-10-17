# Matriz de rastreabilidade — evolução do painel administrativo

**Data:** 2026-10-13 (revisão 2, após a revisão externa de engenharia)
**Status:** Rascunho para revisão final de engenharia. **Sem autorização de implementação.**
**PRD:** `2026-10-13-admin-evolution-prd.md` · **SDDs:** `…-admin-cms-listing-design.md` (CMS), `…-admin-leads-management-design.md` (Leads e fundação E0), `…-newsletter-design.md` (Newsletter)

Cada requisito tem um critério de aceite `CA-<ID>`, definido na coluna "Critério de aceite" do PRD §6. Os testes `T-*` estão definidos nas matrizes de testes dos SDDs. Verificações manuais `CHK-*` estão em §7; as `LC-*` estão no SDD Newsletter §17.

Legenda de seções: **CMS** = SDD CMS · **LEADS** = SDD Leads · **NL** = SDD Newsletter.

## 1. Requisitos × decisões × projeto × testes × entrega

### 1.1 Fundação (E0)

| Requisito | Decisões | Projeto | Testes / verificação | Entrega | Pré-condições |
|---|---|---|---|---|---|
| RF-OPS-01 | DEC-02 | LEADS §4.1 | CHK-OPS-01 | E0a | — |
| RF-OPS-02 | DEC-16 | LEADS §4.2 | T-OPS-U01 | E0a | DEP-01, PV-15 |
| RF-OPS-03 | DEC-16 | LEADS §4.3 | T-OPS-U02 | E0a | — |
| RF-SEG-01 | DEC-08 | LEADS §5.1–5.3 | T-SEG-I01, T-SEG-I02, T-LEAD-I01, CHK-SEG-01 | E0b.2 | BL-04, BL-09, PV-01, PV-20 |
| RF-SEG-02 | DEC-03 | LEADS §5.4 | T-SEG-I03, T-SEG-E01 | E0b.3 | BL-04, BL-09, PV-02 |
| RF-SEG-03 | DEC-14 | LEADS §5.5 | T-SEG-U01, CHK-SEG-02 | E0b.4 | BL-06, PV-16 |
| RF-SEG-04 | DEC-14 | LEADS §5.5 | T-SEG-U02 | E0b.4 | PV-07, PV-19 |
| RF-SEG-05 | DEC-12 | LEADS §6 | T-RL-I01, T-RL-I02, T-RL-I03, T-RL-U01 | E0c | E0a, E0b.1, E0b.4, PV-21 |

### 1.2 CMS

| Requisito | Decisões | Projeto | Testes | Entrega | Pré-condições |
|---|---|---|---|---|---|
| RF-CMS-01 | PRP-07 (aprovada, condicionada aos testes) | CMS §6.3 | T-CMS-U01, T-CMS-U02, T-CMS-I03, T-CMS-E01 | E1 | testes de escape verdes |
| RF-CMS-02 | — | CMS §6.1 | T-CMS-U01, T-CMS-E01 | E1 | — |
| RF-CMS-03 | DEC-04 | CMS §6.1, §6.2 | T-CMS-U01, T-CMS-U03, T-CMS-E01 | E1 | — |
| RF-CMS-04 | DEC-04, RN-15 | CMS §5.1, §6.5 | T-CMS-U04, T-CMS-I01, T-CMS-I07 | E1 | PV-13, PV-17 |
| RF-CMS-05 | DEC-04 | CMS §6.2, §8 | T-CMS-I02 | E1 | — |
| RF-CMS-06 | DEC-04 | CMS §6.4 | T-CMS-U03, T-CMS-E02 | E1 | — |
| RF-CMS-07 | PRP-03 (aprovada) | CMS §6.2 | T-CMS-U07, T-CMS-I04, T-CMS-E02 | E1 | — |
| RF-CMS-08 | — | CMS §6.6 | T-CMS-E03 | E1 | — |
| RF-CMS-09 | DEC-01, DEC-05 | CMS §5.1, §12 | T-CMS-I05, T-CMS-I06, T-CMS-E05 | E1 | PV-14 |
| RF-CMS-10 | DEC-18, RN-03 | CMS §6.7 | T-CMS-U05, T-CMS-E04 | E1 | — |
| RF-CMS-11 | DEC-09 (padrão) | CMS §9 | T-CMS-U06 | E1 | — |
| RF-CMS-12 | DEC-06 | CMS §6.8 | T-CMS-U09 | E1 | — |
| RF-CMS-13 | DEC-04, RN-15 | CMS §5.1, §6.5 | T-CMS-U04, T-CMS-U08 | E1 | — |

### 1.3 Leads

| Requisito | Decisões | Projeto | Testes | Entrega | Pré-condições |
|---|---|---|---|---|---|
| RF-LEAD-01 | PRP-03, PRP-07 | LEADS §10.1 | T-LEAD-U04, T-LEAD-E01 | E2 | E1 (utilitários) |
| RF-LEAD-02 | — | LEADS §8.2 | T-LEAD-E02 | E2 | — |
| RF-LEAD-03 | DEC-10, PRP-01 | LEADS §9.1, §9.4 | T-LEAD-U01, T-LEAD-I07, T-LEAD-I09, T-LEAD-I16 | E2 | PV-06 |
| RF-LEAD-04 | DEC-07, PRP-01 | LEADS §9.2, §9.4 | T-LEAD-U01, T-LEAD-I02, T-LEAD-I05, T-LEAD-I10 | E2 | PV-06 |
| RF-LEAD-05 | DEC-10 | LEADS §9.1, §10.2 | T-LEAD-U01, T-LEAD-U07, T-LEAD-E02 | E2 | — |
| RF-LEAD-06 | DEC-10 | LEADS §10.2 | T-LEAD-E03 | E2 | — |
| RF-LEAD-07 | DEC-09 | LEADS §10.3 | T-LEAD-U03, T-LEAD-I04, T-LEAD-I06, T-LEAD-E04 | E2 | PV-05 |
| RF-LEAD-08 | DEC-07, RN-14 | LEADS §9.3 (fases BEFORE/AFTER), §10.2, §11 | T-LEAD-U05, T-LEAD-U08, T-LEAD-I08, T-LEAD-I11, T-LEAD-I12, T-LEAD-I13, T-LEAD-I15 | E2 | PV-28 |
| RF-LEAD-09 | DEC-08 | LEADS §9.1, §16 | T-LEAD-I07, T-LEAD-E05 | E2 | — |
| RF-LEAD-10 | — | LEADS §9.3 (trava otimista e precisão), §10.2 | T-LEAD-U02, T-LEAD-U09, T-LEAD-I14 | E2 | — |
| RF-LEAD-11 | — | LEADS §11 | T-LEAD-U06 | E2 | — |

### 1.4 Newsletter

| Requisito | Decisões | Projeto | Testes / verificação | Entrega | Pré-condições |
|---|---|---|---|---|---|
| RF-NL-01 | DEC-15 | NL §13, §5.1, §7.1 | T-NL-U09, T-NL-U24, T-NL-E01 | E3 | BL-01, BL-10 |
| RF-NL-02 | DEC-11 | NL §4.2, §7.1, §7.2 | T-NL-U24, T-NL-I04, T-NL-I05, T-NL-I13, T-NL-I27, T-NL-E02, T-NL-E08 | E3 | — |
| RF-NL-03 | DEC-23 | NL §5.4 | T-NL-U03, T-NL-I05, T-NL-E01, T-NL-E05 | E3 | — |
| RF-NL-04 | DEC-11 | NL §7.4 | T-NL-E03, T-NL-E05 | E3 | — |
| RF-NL-05 | DEC-11 | NL §5.2, §7.3, §7.5 (checklist RFC 8058), §9 | T-NL-U08, T-NL-U15, T-NL-U17, T-NL-I14, T-NL-I29, T-NL-E03, T-NL-E04, LC-02 | E3 | BL-02, PV-11, PV-25 |
| RF-NL-06 | DEC-11, PRP-09 (aprovada), PRP-08 (rejeitada) | NL §6.1–6.3, §6.6, §6.7 | T-NL-U01, T-NL-U02, T-NL-I13, T-NL-I14, T-NL-I15, T-NL-I25, T-NL-I29, T-NL-E07 | E3 | — |
| RF-NL-07 | DEC-12, DEC-14, PRP-02 (provisória) | NL §5 | T-NL-U13, T-NL-U15, T-NL-I24, T-SEG-U01 | E3 | E0b.4, E0c, PV-22 |
| RF-NL-08 | DEC-17, PRP-05, PRP-11 (aprovada, configuração inicial) | NL §8 (recuperação §8.1, dimensionamento §8.5, `dead` §8.7, gate §8.9) | T-NL-U04, T-NL-U05, T-NL-U06, T-NL-U07, T-NL-U16, T-NL-U18, T-NL-U19, T-NL-I06, T-NL-I07, T-NL-I08, T-NL-I09, T-NL-I10, T-NL-I11, T-NL-I12, LC-01 | E3 | BL-03, PV-04, PV-08, PV-12, PV-24, PV-27 |
| RF-NL-09 | DEC-13, DEC-21 | NL §4.2, §11.1 | T-NL-I01, T-NL-I03 | E3 | — |
| RF-NL-10 | DEC-21 | NL §4.3 | T-NL-U10, T-NL-I23 | E3 | — |
| RF-NL-11 | DEC-19 (revisada) | NL §12.1 (essencial), §12.2 (complemento) | T-NL-I02, T-NL-E11 (essencial), T-NL-E13 (complemento) | E4-essencial e E4-complemento | E3, E1, N4 |
| RF-NL-12 | DEC-19 (revisada), DEC-22 | NL §11.2–11.5, §12 | T-NL-U23, T-NL-I16, T-NL-I17, T-NL-I18, T-NL-I19, T-NL-I20, T-NL-I28, T-NL-I30, T-NL-I31 (condicional ao fallback `postgres`), T-NL-E11, T-NL-E13 | E4-essencial (descadastrar, excluir) e E4-complemento (reenviar, revogar tokens) | E3, PV-26 |
| RF-NL-13 | DEC-13, DEC-23 | NL §10 | T-NL-I19, T-NL-I21, T-NL-I22, LC-04 | E3 (purga) e E4-essencial (eliminação) | BL-01, PV-05 |
| RF-NL-14 | DEC-15 | NL §13 | T-NL-E09, T-NL-E10 | E3 | BL-10 |
| RF-NL-15 | DEC-24, DEC-27, PRP-04 (condicionada), PRP-10 (aprovada, opção O5) | NL §6.4, §6.5 | T-NL-U11, T-NL-U14, T-NL-U22, T-NL-E02, T-NL-E06, LC-03, LC-06 | E3 | BL-05, BL-07, PV-09, PV-10, PV-23, PV-25 |
| RF-NL-16 | DEC-17 | NL §8.6, §12.1 | LC-01, CHK-NL-01, T-NL-E11 | E3 (endpoint) e E4-essencial (indicador) | DEP-04 |
| RF-NL-17 | DEC-13 | NL §10.4 | LC-04 | E3 | BL-01, BL-08, DEP-06 |
| RF-NL-18 | DEC-24 | NL §6.4, §13 | T-NL-U12, T-NL-E06, LC-03 | E3 | BL-05 |
| RF-NL-19 | DEC-26, DEC-25, RN-12, RN-13 | NL §18.3–18.5, §7.5 | T-NL-U20, T-NL-U21, T-NL-I26, T-NL-E12, LC-07, LC-08 | E3 | BL-11 |

### 1.5 Requisitos não funcionais

| ID | Verificação |
|---|---|
| RNF-01 | CHK-NFR-01: medir listas em ambiente isolado e registrar baseline (sem meta assumida). Teste T-CMS-I04 garante ausência de colunas pesadas. |
| RNF-02 | T-NL-E09 (axe); revisão manual de teclado e foco nas telas novas do CMS e de Leads |
| RNF-03 | T-NL-E10 e `npm run audit:brand` em cada PR |
| RNF-04 | CHK-NFR-02: nenhuma dependência nova nos `package.json` das entregas, salvo aprovação |
| RNF-05 | Artefato `rollback` por migration (CHK-OPS-01), seção de rollback em cada SDD e, na newsletter, o ponto sem retorno do NL §18.4 |
| RNF-06 | T-NL-U06, T-NL-I14, T-LEAD-U02 |
| RNF-07 | CHK-NL-02: inventário do SDD Newsletter §10.2 confere com o esquema |
| RNF-08 | T-NL-U03, T-NL-U13 |
| RNF-09 | T-NL-I01, T-NL-I18, T-LEAD-I01, T-LEAD-I02; CHK-SEG-03 (REVOKE explícito presente em cada migration nova) |
| RNF-10 | T-NL-U22, T-NL-E06, LC-03 |
| RNF-11 | T-NL-I16, T-NL-I17 |

## 2. Decisões × requisitos atendidos

### 2.1 Decisões aprovadas

| Decisão | Requisitos |
|---|---|
| DEC-01 | RF-CMS-09 (e restrição de todas as entregas: branch de tracking intacta) |
| DEC-02 | RF-OPS-01 |
| DEC-03 | RF-SEG-02 |
| DEC-04 | RF-CMS-03, 04, 05, 06, 13 |
| DEC-05 | RF-CMS-09 (restrição: semântica de `published_at` preservada) |
| DEC-06 | RF-CMS-12 |
| DEC-07 | RF-LEAD-04, 08 |
| DEC-08 | RF-SEG-01, RF-LEAD-09 |
| DEC-09 | RF-LEAD-07; padrão aplicado em RF-CMS-11 |
| DEC-10 | RF-LEAD-03, 05, 06 |
| DEC-11 | RF-NL-02, 04, 05, 06 |
| DEC-12 | RF-SEG-05, RF-NL-07 |
| DEC-13 | RF-NL-09, 13, 17 |
| DEC-14 | RF-SEG-03, 04, RF-NL-07 |
| DEC-15 | RF-NL-01, 14 |
| DEC-16 | RF-OPS-02, 03 e testes de integração de todas as entregas |
| DEC-17 | RF-NL-08, 16 |
| DEC-18 | RF-CMS-10 |
| **DEC-19 (revisada)** | RF-NL-11, 12; RNF-11 |
| DEC-20 | restrição de projeto (PRD §5.1) |
| DEC-21 | RF-NL-09, 10 |
| DEC-22 | RF-NL-12 (e exclusões de escopo) |
| DEC-23 | RF-NL-03, 13 |
| DEC-24 | RF-NL-15, 18 |
| **DEC-25** | RF-NL-19 (gate de ativação); BL-11 |
| **DEC-26** | RF-NL-19 (desativação e manutenção obrigatória); NL §18.4–18.5 |
| **DEC-27** | RF-NL-15, RNF-10; BL-05 |

### 2.2 Decisões propostas e seu estado

| Proposta | Estado (revisão externa) | Requisitos | Projeto |
|---|---|---|---|
| PRP-01 | aprovada, condicionada à validação dos privilégios | RF-LEAD-03, 04 | LEADS §9.4 |
| PRP-02 | aprovada provisoriamente (calibrar) | RF-SEG-05, RF-NL-05, 07 | LEADS §6.3, NL §5.2 |
| PRP-03 | aprovada | RF-CMS-07, RF-LEAD-01, RF-NL-11 | CMS §6.1 |
| PRP-04 | condicionada ao isolamento de rastreadores | RF-NL-15 | NL §6.4 |
| PRP-05 | aprovada, com correção da recuperação do outbox (feita) | RF-NL-08 | NL §8.1, §8.4 |
| PRP-06 | aprovada, mantém o bloqueio jurídico | RF-NL-13 | NL §10.2 |
| PRP-07 | aprovada, condicionada aos testes | RF-CMS-01, RF-LEAD-01 | CMS §6.3 |
| **PRP-08** | **rejeitada** | — (substituída por PRP-09) | NL §6.1, §20 |
| PRP-09 | **aprovada** | RF-NL-06 | NL §6 |
| PRP-10 | **aprovada, opção O5**; execução depende da coordenação com o responsável pela tracking | RF-NL-15 | NL §6.5 |
| PRP-11 | **aprovada como configuração inicial**, sujeita a validação operacional (LC-01) | RF-NL-08 | NL §8.5 |

## 3. Regras de negócio × requisitos

| Regra | Requisitos |
|---|---|
| RN-01 | RF-CMS-04 |
| RN-02 | RF-CMS-09 |
| RN-03 | RF-CMS-10 |
| RN-04 | RF-LEAD-06 |
| RN-05 | RF-LEAD-07 |
| RN-06 | RF-NL-10 |
| RN-07 | RF-NL-02, RF-NL-12 |
| RN-08 | RF-NL-05 |
| RN-09 | RF-NL-01, RF-NL-14 |
| RN-10 | RF-NL-14 |
| RN-11 | RF-NL-18 |
| RN-12 | RF-NL-19 |
| RN-13 | RF-NL-19 |
| RN-14 | RF-LEAD-08 |
| RN-15 | RF-CMS-04, RF-CMS-13 |

## 4. Bloqueios de lançamento × requisitos e entregas

| Bloqueio | Requisitos afetados | Entregas | Verificação |
|---|---|---|---|
| BL-01 jurídico | RF-NL-01, 13, 17 | E3 (lançamento), `P-RET-*` | LC-04 |
| BL-02 domínio e DNS | RF-NL-05 | E3 | LC-02 |
| BL-03 processador do outbox | RF-NL-08, 16 | E3 (integração e ativação) | LC-01 |
| BL-04 suíte de RLS | RF-SEG-01, 02, RF-LEAD-*, RF-NL-02, 09, 11, 12 | E0b, E0c, E1, E2, E3, E4 | relatório da suíte (T-OPS-U01 e testes `-I`) |
| BL-05 isolamento e exposição de token | RF-NL-15, 18 | ativação da E3 | LC-03, LC-06, T-NL-E06 |
| BL-06 variáveis do Turnstile | RF-SEG-03 | E0b.4 | CHK-SEG-02 |
| BL-07 tracking integrada | RF-NL-01, 14, 15, 17 | E3 (ativação; e o trecho de isolamento da E3) | LC-06 |
| BL-08 política de privacidade | RF-NL-17 | E3 | LC-04 |
| BL-09 preflight remoto | RF-SEG-01, 02 | E0b | CHK-SEG-01 |
| BL-10 copy da Home | RF-NL-01, 14 | E3 | LC-05 |
| **BL-11 administração essencial** | RF-NL-11, 12, 16, 19 | ativação pública da E3 | LC-07, T-NL-E11 |

## 5. Premissas × onde se validam

| Premissa | Validação |
|---|---|
| PV-01, PV-02, PV-03, PV-04 | preflight E0b.1 (CHK-SEG-01) |
| PV-05 | T-LEAD-I06, T-NL-I19 |
| PV-06 | T-LEAD-I03 |
| PV-07 | verificação do dono do domínio; decide o uso de `cf-connecting-ip` (T-SEG-U02) |
| PV-08 | painel da Vercel; decide `maxDuration` do dispatch e a opção B do NL §8.9 |
| PV-09, PV-10 | LC-03, T-NL-E06 |
| PV-11 | LC-02 |
| PV-12 | documentação do provedor + T-NL-U06 |
| PV-13 | preflight da migration do CMS |
| PV-14 | teste em ambiente isolado (T-CMS-I05) |
| PV-15 | DEP-01 |
| PV-16 | CHK-SEG-02 |
| PV-17 | T-CMS-I01 |
| PV-18 | busca de código durante o plano |
| PV-19 | documentação da Vercel + deploy isolado (T-SEG-U02) |
| PV-20 | confirmação do dono de scripts e automações (CHK-SEG-01) |
| PV-21 | T-RL-I01 |
| PV-22 | DEP-02 |
| PV-23 | LC-03 |
| PV-24 | LC-01 |
| PV-25 | LC-02 |
| PV-26 | T-NL-I16, T-NL-I17, T-NL-I30 (e T-NL-I31 se houver fallback `postgres`) |
| PV-27 | LC-01 |
| PV-28 | T-LEAD-I15 |

## 6. Dependências externas × requisitos

| Dependência | Requisitos |
|---|---|
| DEP-01 ambiente isolado | RF-OPS-02 e todos os testes `-I` |
| DEP-02 domínio e quota do Resend | RF-NL-05, RF-NL-07 |
| DEP-03 processador | RF-NL-08 |
| DEP-04 sonda externa | RF-NL-16 |
| DEP-05 variáveis de ambiente | RF-SEG-05, RF-NL-08, RF-NL-19 |
| DEP-06 revisão jurídica | RF-NL-01, 13, 17 |
| DEP-07 tracking integrada | RF-SEG-03/04 (rota de contato), RF-NL-01, 14, 15, 17 |

### 6.1 Dependências entre entregas

Duas condições distintas (PRD §14): **início** e **merge/ativação**.

| Entrega | Pode começar quando | Só integra ou é lançada quando |
|---|---|---|
| E0a | DEP-01 | BL-04 |
| E0b.1 | E0a e autorização | BL-09 |
| E0b.2 | E0a | E0b.1, PV-20, BL-04 |
| E0b.3 | E0a | E0b.1, BL-04 |
| E0b.4 | E0a; empilhada sobre a tracking | BL-06; ordem de integração da tracking |
| E0c | E0a, E0b.1, E0b.4 | BL-04; PV-21 |
| E1 | E0a | BL-04; testes de escape verdes (PRP-07) |
| E2 | E0a, E1 | E0b.2 e E0b.3 aplicadas no ambiente de teste; BL-04; PV-06 (PRP-01) |
| E3 | E0a, E0b.4, E0c; tracking empilhada ou integrada | **Integrar:** BL-03, BL-04. **Ativar publicamente:** BL-01, BL-02, BL-03, BL-05, BL-07, BL-08, BL-10 e BL-11 |
| E4-essencial | E3 no ambiente isolado; E1 | BL-04; **precisa estar em produção antes da ativação (BL-11)** |
| E4-complemento | E4-essencial | BL-04; não bloqueia a ativação |

Dependência de código entre entregas: **E1 → E2 e E1 → E4** (utilitários de lista); **E0b.4 → E0c** (mesma rota); **E0c → E3** (função de rate limit). Dependência de estado de banco para testes: **E0b.2 e E0b.3 → E2**. Gate: **E4-essencial → ativação pública da E3** (DEC-25). O trecho de isolamento de rastreadores da E3 depende da integração da tracking (PRP-10).

## 7. Verificações manuais

| ID | Verificação | Responsável proposto |
|---|---|---|
| CHK-OPS-01 | Cada migration tem `README`, `preflight`, `apply`, `verify` e `rollback`; `rollback` da remoção de `anon` não recria permissão | revisor de engenharia |
| CHK-SEG-01 | Saída do preflight remoto arquivada; PV-01..04 e PV-20 confirmadas | dono da infraestrutura |
| CHK-SEG-02 | Segredo e site key reais do Turnstile em Production e Preview antes do deploy | dono da infraestrutura |
| CHK-SEG-03 | `REVOKE` explícito e RLS presentes em cada tabela nova | revisor de engenharia |
| CHK-NL-01 | Endpoint de saúde e sonda externa retornando valores coerentes | infraestrutura |
| CHK-NL-02 | Inventário de dados da newsletter confere com o esquema aplicado | revisor de engenharia e jurídico |
| CHK-NFR-01 | Baseline de latência das listas registrado | engenharia |
| CHK-NFR-02 | Nenhuma dependência nova sem aprovação | revisor de engenharia |
| LC-01..LC-08 | Verificações de lançamento do SDD Newsletter §17 | conforme SDD |

## 8. Cobertura e itens deliberadamente sem teste automatizado

- **Todo requisito funcional** (RF-OPS, RF-SEG, RF-CMS, RF-LEAD, RF-NL-01 a 19) aparece em §1 com decisão, projeto, teste ou verificação e entrega.
- **Toda decisão aprovada** (DEC-01 a DEC-27) aparece em §2.1; todas as propostas (PRP-01 a PRP-11) aparecem em §2.2 com seu estado.
- **Todo bloqueio** (BL-01 a BL-11) tem requisito afetado e verificação em §4.
- **Toda premissa** (PV-01 a PV-28) tem um local de validação em §5.
- **Todo risco remanescente** (R-05 a R-11) está no PRD §13 com tratamento e, quando aplicável, verificação (BL-05, BL-01, LC-02). Nenhum está marcado como aceito ou verificado antes da respectiva validação.
- Sem teste automatizado, por natureza: RF-OPS-01 (CHK-OPS-01), RF-NL-17 (LC-04) e RNF-01, que depende de baseline antes de definir meta.
