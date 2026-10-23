# Migration 015 — Gestão operacional de Leads (E2)

**ESTADO: RASCUNHO TÉCNICO. NÃO EXECUTAR SQL ANTES DE REVISÃO, PREFLIGHT E AUTORIZAÇÃO DO AMBIENTE ISOLADO.**

| Campo | Valor |
|---|---|
| Escopo | E2 — RF-LEAD-01..11 / SDD Leads Parte II |
| Apply único | `supabase/migrations/015_leads_management.sql` |
| Pré-requisitos do esquema | `public.leads`, `public.admin_users`, `auth.users`, `public.update_updated_at()`, extensões/funções existentes conferidas |
| Dependências de segurança | Migration 012 e 013 aplicadas no **isolado**, testes baseline E0b; para produção, 012/013 têm **GOs próprios**, PV-20 condiciona 012 |
| Natureza | Aditiva sobre leads, cria notas/atividades e modifica os grants/RLS de leads |
| Alvos | Isolado primeiro; produção só após autorização própria |
| Revisão SQL | **PENDENTE** — revisão independente de apply/preflight/verify/contingência |
| Execução | **NÃO EXECUTADA** (criação documental e de código da F1) |

## Fases e evidência esperada

1. Confirmar o alvo e a baseline; executar `preflight.sql` em transação **READ ONLY** apenas após autorização expressa para aquele ambiente.
2. Comparar **definições**, não apenas nomes, de constraints, índices, policies, funções, schemas, triggers e grants; inspecionar dependências sobre `leads`. **NO-GO** se divergirem.
3. Revisão por segundo engenheiro da segurança: grants de coluna, RLS de todas as tabelas, autorização do `SECURITY DEFINER`, schema não exposto, `PUBLIC EXECUTE`, trigger ordenado e ausência de políticas legadas permissivas. Verificar acesso `anon` efetivamente revogado (012) antes de executar.
4. Aplicar no Supabase **isolado** manualmente com autorização explícita. Rodar `verify.sql` READ ONLY e suíte RLS com `T-LEAD-I01..I16`, incluindo PV-06 e PV-28.
5. Homologar o código E2 e regressão do formulário de contato no isolado. Preparar evidências de limpeza dos dados sintéticos.
6. Para produção: autorizar preflight próprio de 012/013/015, resolver PV-20, avaliar backup íntegro/recuperação, **autorizar cada apply separadamente**, verificar cada migration e só depois liberar eventual merge/deploy do código.
7. Registrar execução no `docs/runbooks/migrations/REGISTRO.md`. Não editar o registro como se a migration estivesse aplicada antes de executar.

## Regras NO-GO

- Qualquer intenção de executar o SQL sem revisão ou autorização.
- Resultado de preflight inesperado, incluindo policies legadas permissivas, trigger preexistente na tabela `leads`, divergência da função `update_updated_at()`, índices equivalentes com outros nomes ou schema externo driftado.
- `anon` ainda com acesso/INSERT em `leads`; não usar este artefato para substituir o GO da 012.
- Falhas em testes de grants por coluna (PRP-01/PV-06), no-op/ordem dos triggers (PV-28), integridade do histórico, FK cascade, concorrência e RLS.
- Banco de produção ou Preview como alvo de teste de escrita.
- Falta de cópia íntegra e recuperação adequada para produção.

## Segurança da função de histórico

`rc2_internal.leads_record_activity()` é `SECURITY DEFINER` para permitir inserir histórico sem conceder INSERT direto à API. Precisa de **revisão especial** do papel proprietário e eventuais privilégios efetivos, porque executa com permissões do proprietário. O schema `rc2_internal` deve ficar fora da configuração de schemas expostos da Data API. O SQL fixa `search_path` vazio, qualifica objetos e revoga EXECUTE de PUBLIC/anon/authenticated; **não presumir que isto basta sem verificar no alvo e nos testes**.

## Reversão / recuperação

`rollback.sql` é um **marcador READ ONLY de contingência**, não um DROP automático: destruir `lead_notes` ou `lead_activity` elimina dados e histórico. Em incidente, parar escritas, reverter o código antes de alterações de banco, preservar/exportar os dados, elaborar script de retorno compatível com o estado real e obter autorização separada. **Nunca reabrir grants/policy INSERT para anon**. A migration 015 não altera nem reaplica a 014.

## Autorizações (a preencher)

| Etapa | Executor | Autorizador | Data | Evidência |
|---|---|---|---|---|
| Preflight isolado READ ONLY | — | — | — | Pendente |
| Apply isolado | — | — | — | Pendente |
| Preflight produção READ ONLY | — | — | — | Pendente |
| Apply produção | — | — | — | Pendente |
| Merge/deploy do código E2 | — | — | — | Pendente |
