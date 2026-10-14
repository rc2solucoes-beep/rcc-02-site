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

## Verificação independente (C14, obrigatória antes da primeira execução real)

Feita pelo dono da infraestrutura **ou por uma segunda pessoa**, que não deve ser quem configurou o `.env.test.local`, e registrada na evidência (nome, data, resultado de cada item):

1. No painel, o nome e o **ref** do projeto de teste conferem com `RC2_TEST_PROJECT_REF`, e esse projeto **não** é o de produção (comparação com o projeto de produção conhecido pelo dono).
2. As chaves exibidas no painel **desse** projeto conferem com as do `.env.test.local` (compare os quatro últimos caracteres; **nunca** cole as chaves em lugar nenhum).
3. Se as chaves forem do formato novo (`sb_…`), registre que a guarda **não** as inspeciona e que este item é a única verificação direta delas.
4. `RC2_PRODUCTION_PROJECT_REF` contém o ref **real** de produção.
5. O `.env.test.local` não contém nenhuma URL de produção, e `RC2_TEST_PROJECT_REF_ALLOWLIST` contém somente refs de projetos de teste.
6. O marcador existe **no projeto de teste** com o valor correto (item K do `verify-baseline.sql`).

Sem este checklist assinado, a execução real da matriz não começa.

## Como rodar

```bash
npm run test:integration
```

A guarda (`tests/integration/support/guard.ts`, `target.ts`) roda antes de qualquer conexão e é reaplicada em cada criação de cliente. O cliente `service_role` é um proxy com três propriedades:

1. **Revalida cada chamada** de método, inclusive em objetos aninhados como `auth.admin`: guardar a referência não permite usá-la depois que o ambiente deixar de ser seguro.
2. **Revalida a execução diferida.** Os construtores de consulta do Supabase (`from().select().eq()`) só enviam a requisição ao serem aguardados; o proxy envolve também os resultados das chamadas, então `then` revalida imediatamente antes do envio. Uma consulta montada com o alvo válido e aguardada depois de invalidá-lo não dispara nenhuma requisição.
3. **Fica preso ao alvo original.** A cada chamada compara URL, ref e chaves atuais com o `VerifiedTarget` com que o cliente nasceu; trocar o projeto A por outro projeto B igualmente válido invalida as referências de A (`target_changed`). A comparação não imprime nem registra chaves.

Erros externos (Supabase, rede, bibliotecas) nunca têm a mensagem copiada para logs, relatórios ou exceções: o harness registra só categorias e códigos controlados (`tests/integration/support/errors.ts`), preservando os motivos conhecidos da guarda. A suíte **não** faz parte do `npm test`.

Relatórios: `test-results/integration/rls-matrix-<nome>.{json,md}` (pasta ignorada pelo git). Anexe o `.md` à evidência.

## Dados sintéticos e limpeza

Os testes criam dois usuários (`e0a-<tag>-admin@example.test` e `…-member@example.test`) e linhas com prefixo `e0a-` ou `__e0a_`. **Cada recurso é registrado antes de ser criado**, removido no `afterAll` e inspecionado ao final; **qualquer falha de limpeza reprova a suíte**. Se uma execução for interrompida, remova pelo painel do **projeto de teste** os usuários `e0a-*` e as linhas com esses prefixos.

## Descarte

Apagar o projeto de teste no painel (ação do dono). Nada de produção depende dele.

## O que este ambiente não faz

Não recebe cópia de dados de produção; não serve de Preview da Vercel nesta entrega (EX-4 é opcional e posterior); **não substitui o preflight de produção** (E0b.1, autorizado à parte) e **não prova paridade atual** com a produção.
