# Ambiente Supabase isolado para testes de RLS

Requisitos de origem: RF-OPS-02, DEC-16, BL-04, DEP-01, PV-15. **Este ambiente nunca contém dados de produção e nenhuma credencial de produção é usada com ele.**

## Limites da proteção anti-produção (leia antes de configurar)

1. A **allowlist é configurada pelo operador**: reduz o risco de apontar a suíte para o projeto errado, mas **não o elimina**.
2. As chaves no formato novo do Supabase (`sb_publishable_…`, `sb_secret_…`) são **opacas**: não carregam o ref do projeto e a guarda **não as inspeciona**. Só as chaves JWT legadas têm o claim `ref` conferido automaticamente.
3. Por isso existem quatro camadas: guarda estática (URL, ref, allowlist, ref de produção, `NEXT_PUBLIC_SUPABASE_URL`), o gateway do Supabase (chave de um projeto não vale contra a URL de outro), o **marcador de ambiente de teste** e a **verificação independente humana** abaixo.
4. Risco residual declarado: operador que lista produção na allowlist, omite o ref de produção **e** cria o marcador na produção. A verificação independente existe para cobrir esse caso.
5. Variáveis do shell **não podem contradizer** o `.env.test.local`: se uma variável definida no processo tiver valor diferente do arquivo, a suíte recusa a execução (`env_conflict`).

## Opções (EX-1, decisão do dono da infraestrutura)

| Opção | Prós | Contras |
|---|---|---|
| **Projeto Supabase separado** (recomendada) | Isolamento total; não depende de plano pago nem de integração com GitHub (a confirmar) | Segundo projeto a administrar; limite de projetos do plano |
| Branch Supabase | Herda a estrutura do projeto | Pode exigir plano pago e integração com Git; a branch parte do estado de produção e não é independente |

Nome sugerido: `rc2-test-isolated`. Anote o **ref** do projeto (o trecho `<ref>` de `https://<ref>.supabase.co`). O ref **não** é segredo, mas não o grave em documentos do repositório.

**A criação do projeto ainda não está autorizada** (EX-1 pendente).

## Snapshot histórico (EX-2)

O ambiente reproduz o **snapshot conhecido** do estado da produção, **incluindo o drift documentado**, e não aplica cegamente todas as migrations completas. É um **snapshot histórico** (`docs/07-supabase-migration-baseline.md` de 30/08 e metadados de 13/10), **sujeito à confirmação posterior no preflight E0b.1**. **Este ambiente não declara paridade atual com a produção.**

Aplicar no **SQL Editor do projeto de teste**, nesta ordem:

| # | Arquivo | Observação |
|---|---|---|
| 1 | `supabase/migrations/001_leads.sql` | inclui `leads_anon_insert` (estado do snapshot, R1) |
| 2 | `supabase/migrations/002_posts_settings.sql` | |
| 3 | `migrations/add_blog_seo_fields.sql` | **não** é idempotente; rodar uma só vez; precisa vir **antes** da 011 |
| 4 | `migrations/add_faq_cta_fields.sql` | |
| 5 | `supabase/migrations/003_admin_users.sql` | |
| 6 | `supabase/migrations/004_expand_settings.sql` | |
| 7 | `supabase/migrations/005_fix_admin_users_rls.sql` | |
| 8 | `supabase/migrations/006_add_postal_code_and_locality.sql` | |
| 9 | `supabase/migrations/007_create_authors.sql` | |
| 10 | **`009` parcial** | executar **somente** o `CREATE TABLE IF NOT EXISTS public.admin_audit_logs (...)` do início do arquivo. **Não** aplicar os `CREATE INDEX` (3), nem `ENABLE ROW LEVEL SECURITY` explícito, nem as 4 policies: no snapshot só a tabela existe, e a RLS veio do `ensure_rls`. Se o projeto de teste não ligar a RLS sozinho, execute `ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;` e registre o desvio. |
| 11 | `supabase/migrations/010_admin_audit_logs_hardening.sql` | integralmente (constraints e 2 índices) |
| 12 | `supabase/migrations/011_scheduled_publish_cron.sql` | exige a extensão `pg_cron` habilitada (Database → Extensions) |

**Não aplicar** `008_bootstrap_first_admin.sql` (no snapshot a função **não existe**).

### Marcador de ambiente de teste (obrigatório; exigido por `clients.ts`)

Depois do snapshot, no **SQL Editor do projeto de teste**, crie o marcador (o valor é o ref do projeto de teste):

```sql
INSERT INTO public.settings (key, value)
VALUES ('__rc2_isolated_test_env__', '<ref-de-teste>')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

A suíte lê esse valor com a chave `anon`, **antes** de criar o cliente `service_role`, e recusa a execução se ele não existir ou não for igual ao ref de teste. A tabela `settings` é de leitura pública; o ref não é segredo.

Depois, rodar `docs/runbooks/ambiente-teste/verify-baseline.sql` (somente leitura) e **arquivar a saída** na evidência. Divergências esperadas e documentáveis: itens I e J (extensões e objetos só do remoto), conforme o projeto de teste.

Perfil alternativo "estado dos arquivos" (aplicar `008` e `009` completos): só se a revisão decidir que o ambiente deve refletir os arquivos.

## Credenciais (EX-3)

1. No painel do projeto de teste, copie a URL, a chave `anon` e a chave `service_role` (ou as chaves equivalentes do novo formato).
2. Crie **`.env.test.local`** na raiz do repositório (ignorado pelo git) com:

```
RC2_TEST_SUPABASE_URL=https://<ref-de-teste>.supabase.co
RC2_TEST_PROJECT_REF=<ref-de-teste>
RC2_TEST_PROJECT_REF_ALLOWLIST=<ref-de-teste>
RC2_PRODUCTION_PROJECT_REF=<ref-de-producao>
RC2_TEST_SUPABASE_ANON_KEY=...
RC2_TEST_SUPABASE_SERVICE_ROLE_KEY=...
```

3. **Nunca** coloque essas chaves em `.env.local` (que pode apontar para produção), em commits, em logs ou em evidências.
4. Não exporte variáveis `RC2_TEST_*` no shell com valores diferentes dos do arquivo (a suíte recusa a execução).

## Verificação independente (C14, via padrão do gate da primeira execução real)

Feita pelo dono da infraestrutura **ou por uma segunda pessoa**, que não deve ser quem configurou o `.env.test.local`, e registrada na evidência (nome, data, resultado de cada item):

1. No painel, o nome e o **ref** do projeto de teste conferem com `RC2_TEST_PROJECT_REF`, e esse projeto **não** é o de produção (comparação com o projeto de produção conhecido pelo dono).
2. As chaves exibidas no painel **desse** projeto conferem com as do `.env.test.local` (compare os quatro últimos caracteres; **nunca** cole as chaves em lugar nenhum).
3. Se as chaves forem do formato novo (`sb_…`), registre que a guarda **não** as inspeciona e que este item é a única verificação direta delas.
4. `RC2_PRODUCTION_PROJECT_REF` contém o ref **real** de produção.
5. O `.env.test.local` não contém nenhuma URL de produção, e `RC2_TEST_PROJECT_REF_ALLOWLIST` contém somente refs de projetos de teste.
6. O marcador existe **no projeto de teste** com o valor correto (item K do `verify-baseline.sql`).

O gate da primeira execução real tem **duas vias**; basta uma delas, e nenhuma dispensa a autorização expressa e separada da execução:

- **Via A:** este checklist C14, assinado por verificador independente.
- **Via B:** a exceção E0a-C14-EX01 (abaixo), formalizada e acompanhada dos controles compensatórios exigíveis antes da execução.

Sem a via A **ou** a via B comprovada, a execução real da matriz não começa.

### Exceção E0a-C14-EX01 (via B)

Resultado do C14 original em 2026-10-16: **NÃO ATENDIDO**. A exceção não altera o requisito, não o dá por atendido e não o substitui.

| Campo | Valor |
|---|---|
| ID | E0a-C14-EX01 |
| Aprovada em | 2026-10-16 |
| Autoridade | Responsável pelo projeto e pela infraestrutura |
| Justificativa | Indisponibilidade de segunda pessoa |
| Escopo | Exclusivamente a E0a e o projeto isolado `rc2-test-isolated`; não vale para outros projetos nem para fases posteriores |
| Risco residual aceito | Ausência de segregação entre configuração, conferência e autorização |
| Estado | Aceitação de risco aprovada; controles compensatórios sujeitos a comprovação |

**Controles exigíveis antes da execução (pré):** CC-1 a CC-8 e CC-9a. **Após a execução (pós):** CC-9b. A aprovação da exceção, isoladamente, **não libera nada**. Cada controle é registrado na evidência com resultado individual, sem ref de produção, URL de produção nem chaves.

| ID | Controle | Aceite objetivo | Fase |
|---|---|---|---|
| CC-1 | Identidade do projeto isolado | Nome e ref de teste conferidos no painel; não é o projeto de produção | pré |
| CC-2 | Ref de produção | Valor conferido no painel de produção e diferente do ref de teste; registrar "confirmado: sim/não", nunca o valor | pré |
| CC-3 | URL, ref e allowlist | Só o projeto de teste; validação local repetida imediatamente antes da execução | pré |
| CC-4 | Chaves e ambiente | Claims `role`/`ref`/`exp` de chaves JWT conferem; sem variáveis `RC2_*` divergentes no shell; chaves opacas `sb_…` conferidas manualmente no painel | pré |
| CC-5 | Guarda anti-produção | `npx vitest run tests/unit/ops` verde e saídas D1–D4 da Task 3 arquivadas. O ensaio D5 **não** conta aqui | pré |
| CC-6 | Marcador de isolamento | Item K do `verify-baseline.sql` com 1 linha e valor igual ao ref de teste | pré |
| CC-7 | Criação e limpeza | `cleanup.ts` e o passo de limpeza da Task 8 revisados; prefixos `e0a-` e `__e0a_` listados; inspeção manual definida | pré |
| CC-8 | Interrupção no primeiro erro | Procedimento único de falha da Task 8 (Step 4) aceito pelo responsável | pré |
| CC-9a | Higiene de segredos, pré-execução | `.env.test.local` ignorado e não rastreado; varredura do diff (commitado e não commitado) e das evidências existentes, com saída apenas de status | pré |
| CC-9b | Higiene de segredos, pós-execução | Varredura final das evidências novas e do diff, com saída apenas de status | pós |

As varreduras de segredos produzem somente `CONFORME` ou `DIVERGENTE`, nunca exibem correspondências e nunca leem o `.env.test.local`.

#### Procedimento da varredura de segredos (CC-9a, antes; CC-9b, depois)

A função abaixo extrai **valores plausíveis** (JWT, chaves `sb_secret_`/`sb_publishable_` e atribuições de `SERVICE_ROLE_KEY`/`ANON_KEY` com 20 ou mais caracteres, em formato `=`, `:` ou JSON, com ou sem aspas) e **descarta somente os valores que contêm o marcador `FICTICIO`**. A exceção é por valor, não por linha nem por arquivo: um segredo real na mesma linha, ou no mesmo arquivo, de uma fixture `FICTICIO` continua sendo detectado. Valores só com maiúsculas e `_` (placeholders como `SUBSTITUIR_MANUALMENTE`), reticências, `<…>` e nomes de variáveis não são tratados como segredo. A saída é apenas `CONFORME`, `DIVERGENTE` ou `NÃO INSPECIONADO`.

```bash
tokens() {
  local t; t="$(cat)"
  printf '%s' "$t" | grep -oE 'eyJ[A-Za-z0-9_-]{10,}(\.[A-Za-z0-9_-]+){0,2}'
  printf '%s' "$t" | grep -oE 'sb_(secret|publishable)_[A-Za-z0-9_-]{10,}'
  printf '%s' "$t" | grep -oE "(SERVICE_ROLE_KEY|ANON_KEY)[\"']?[[:space:]]*[:=][[:space:]]*[\"']?[A-Za-z0-9_.+/=-]{20,}" \
    | sed -E "s/^[^:=]*[:=][[:space:]]*[\"']?//" | grep -E '[a-z0-9]'
}
scan_secrets() { tokens | grep -v 'FICTICIO' | grep -q .; case $? in 0) echo DIVERGENTE;; 1) echo CONFORME;; *) echo "NÃO VERIFICADO";; esac; }
scan_paths() { if ls "$@" >/dev/null 2>&1; then cat "$@" | scan_secrets; else echo "NÃO INSPECIONADO"; fi; }
```

Nunca imprima a saída de `tokens`; use apenas `scan_secrets`/`scan_paths`.

**CC-9a (antes da execução).** Cole a função e execute:

```bash
git check-ignore -q .env.test.local && echo "env ignorado: CONFORME" || echo "env ignorado: DIVERGENTE"
git ls-files --error-unmatch .env.test.local >/dev/null 2>&1 && echo "env rastreado: DIVERGENTE" || echo "env rastreado: CONFORME"
echo "diff commitado:";   git diff main...HEAD | scan_secrets
echo "diff não staged:";  git diff | scan_secrets
echo "diff staged:";      git diff --cached | scan_secrets
echo "evidências:";       scan_paths docs/runbooks/evidence/*.md
```

**CC-9b (depois da execução).** Repita os comandos acima e acrescente as evidências novas e os relatórios gerados:

```bash
echo "relatórios:";      scan_paths test-results/integration/*
```

Limites declarados: a varredura não lê o `.env.test.local` nem outros arquivos de credenciais; não detecta valores curtos (menos de 20 caracteres) em formato desconhecido; não detecta o ref de produção (um identificador de 20 caracteres sem padrão distintivo; ele é controlado por regra de registro, CC-2); e o marcador `FICTICIO` só vale para valores sintéticos. Fonte não listada não foi inspecionada: o resultado **não** afirma cobertura completa.

**Autorizações separadas.** O gate resolvido não autoriza, por si, a execução. São autorizações expressas, específicas e distintas: **AUT-D5** (ensaio D5, real, que remove e restaura o marcador) e **AUT-EXEC** (execução real da suíte). A autorização de uma não vale para a outra.

## Como rodar

Só com o gate C14 resolvido (via A ou via B) **e** autorização expressa da execução real (AUT-EXEC). Para preservar o código de saída real da suíte, **não** encadeie o comando a um pipe (o status de `tail` mascararia o do teste); redirecione para um log e capture o status:

```bash
mkdir -p test-results/integration
LOG="test-results/integration/run-$(date +%Y%m%dT%H%M%S).log"
RC2_E2_PHASE=pre015 npm run test:integration > "$LOG" 2>&1; STATUS=$?   # ou post015
echo "exit=$STATUS"; tail -25 "$LOG"
```

**`RC2_E2_PHASE` é obrigatório (E2).** Valores aceitos: `pre015` (esquema 012, antes da migration 015) e `post015` (depois da 015). Sem a variável, ou com outro valor, as suítes legadas `baseline` e `e0b-security` falham de propósito (`requireLegacyLeadPhase`): as expectativas sobre `leads` diferem entre as fases (UPDATE de `message` pelo admin: permitido antes, negado depois; DELETE de leads pelo admin: negado antes, permitido depois). Declare a fase que corresponde ao estado real do banco; uma fase divergente do esquema produz falha, e isso é o comportamento esperado. As autorizações AUT-D5 e AUT-EXEC já emitidas para a E0/E1 **não** cobrem a E2 nem a fase `post015`: a execução com a 015 exige autorização própria. Os procedimentos da 015 (medição de locks, limpeza de fixtures) ficam em `docs/runbooks/migrations/015-leads-management/README.md`.

`exit=0` é o único resultado de sucesso. Qualquer outro valor, ou qualquer divergência, aciona o procedimento de falha da Task 8 (Step 4): parar, registrar, preservar, tratar resíduos só no projeto de teste e exigir nova autorização antes de repetir. Não há reexecução automática.

A guarda (`tests/integration/support/guard.ts`, `target.ts`) roda antes de qualquer conexão e é reaplicada em cada criação de cliente. O cliente `service_role` é um proxy com três propriedades:

1. **Revalida cada chamada** de método, inclusive em objetos aninhados como `auth.admin`: guardar a referência não permite usá-la depois que o ambiente deixar de ser seguro.
2. **Revalida a execução diferida.** Os construtores de consulta do Supabase (`from().select().eq()`) só enviam a requisição ao serem aguardados; o proxy envolve também os resultados das chamadas, então `then` revalida imediatamente antes do envio. Uma consulta montada com o alvo válido e aguardada depois de invalidá-lo não dispara nenhuma requisição.
3. **Fica preso ao alvo original.** A cada chamada compara URL, ref e chaves atuais com o `VerifiedTarget` com que o cliente nasceu; trocar o projeto A por outro projeto B igualmente válido invalida as referências de A (`target_changed`). A comparação não imprime nem registra chaves.

Erros externos (Supabase, rede, bibliotecas) nunca têm a mensagem copiada para logs, relatórios ou exceções: o harness registra só categorias e códigos controlados (`tests/integration/support/errors.ts`), preservando os motivos conhecidos da guarda. A suíte **não** faz parte do `npm test`.

Relatórios: `test-results/integration/rls-matrix-<nome>.{json,md}` (pasta ignorada pelo git). Anexe o `.md` à evidência.

## Dados sintéticos e limpeza

Os testes criam dois usuários (`e0a-<tag>-admin@example.test` e `…-member@example.test`) e linhas com prefixo `e0a-` ou `__e0a_`. **Cada recurso é registrado antes de ser criado**, removido no `afterAll` e inspecionado ao final; **qualquer falha de limpeza reprova a suíte**. Se uma execução for interrompida, remova pelo painel do **projeto de teste** (com a autorização aplicável) os usuários `e0a-*` e as linhas com esses prefixos.

## Descarte

Apagar o projeto de teste no painel (ação do dono). Nada de produção depende dele.

## O que este ambiente não faz

Não recebe cópia de dados de produção; não serve de Preview da Vercel nesta entrega (EX-4 é opcional e posterior); **não substitui o preflight de produção** (E0b.1, autorizado à parte) e **não prova paridade atual** com a produção.
