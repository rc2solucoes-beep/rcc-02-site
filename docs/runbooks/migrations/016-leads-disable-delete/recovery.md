# Migration 016 — Procedimento de recuperação

**ESTADO: PROCEDIMENTO DOCUMENTAL. NADA AQUI FOI EXECUTADO OU AUTORIZADO.** Cada etapa exige autorização própria, por ambiente.

## O que a 016 muda (e o que isso implica para recuperar)

Só remove um privilégio (`DELETE` de `authenticated` em `public.leads`) e uma policy (`leads_e2_admin_delete`). **Nenhum dado é
alterado.** Portanto não há "dado a restaurar" por causa da 016; o que pode ser necessário é **restaurar a capacidade**.

## Cenários

| Situação | Estado do banco | Ação |
|---|---|---|
| Guard, `lock_timeout` (55P03) ou autoverificação abortou | **Nada aplicado** (transação revertida) | Ler o erro, confirmar com o preflight, repetir em janela de menor tráfego. Não editar o SQL para contornar |
| Aplicada, e o `verify.sql` da 016 aprovou | Estado desejado | Nenhuma. Registrar no `REGISTRO.md` |
| Aplicada por engano ou o negócio precisa excluir leads | `authenticated` sem DELETE | **Migration 017 nova** (ver README, "Reabilitação futura"). Não há rollback automático |
| Aplicada e o painel ou o formulário falharam | Verificar `verify.sql` (POS-11: `service_role` preservada) | Reverter o **código** (promover o deploy anterior na Vercel). A 016 é compatível com o código anterior à E2, que não exclui leads |
| Exclusão indevida de leads (antes da 016, ou pela API) | Dados perdidos | Fora do escopo da 016. Recuperar dos CSVs preservados (contagem e SHA-256 registrados) ou de backup/PITR, se existir |

## Snapshot do estado anterior (do preflight)

Guardar a saída do `preflight.sql` desta pasta, em particular:

- `DIGEST-ACL-LEADS`, `DIGEST-POLICIES-LEADS`, `DIGEST-NOTAS-E-ATIVIDADE`, `DIGEST-TRIGGERS-LEADS`: para comparar o antes e o depois.
- `EVD-POLICY-DELETE-DEFINICAO`: a definição exata da policy removida (comando, papéis, `USING`, `WITH CHECK`), base de uma 017.
- `VOLUME-LEADS`: informativo; o total pode mudar por novos leads legítimos.

## Regras

1. **Nunca reabrir `anon`** (DEC-08), em nenhum cenário.
2. Reabilitar o DELETE é uma **correção adiante** (017), nunca um rollback do SQL da 016.
3. Em produção, sem backup completo/PITR, a exclusão exige exportação verificada antes (CSV com contagem e SHA-256 registrados).
4. Não executar `containment.sql` nem `rollback-structural.sql` da 015 por causa da 016: eles tratam outro problema (a E2 inteira).
