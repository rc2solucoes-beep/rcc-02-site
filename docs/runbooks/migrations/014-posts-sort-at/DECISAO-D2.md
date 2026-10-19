# Decisão D2 — busca literal do CMS (inclusive `*`)

**Estado: ABERTA. Aguarda T-CMS-I03 no ambiente isolado.** Nenhum banco foi consultado nesta entrega.

## Decisão aprovada

A busca é **literal**. Não substituir `*` por `_` e não aceitar curinga indevido. Implementar primeiro a abordagem PostgREST do SDD (§6.3) com testes hostis; sem solução comprovada, usar a RPC parametrizada.

## O que foi implementado (`src/lib/admin/listParams.ts`, `buildSearchOrFilter`)

1. **Termos sem `*`**: `ilike` com padrão `%termo%`, escapado em duas camadas — primeiro `\`, `%` e `_` para o LIKE; depois `\` e `"` para as aspas do PostgREST — e envolvido em aspas duplas, de modo que `,`, `(`, `)`, `.` e `:` não têm significado de sintaxe.
2. **Termos com `*`**: `imatch` (regex POSIX, sem curinga) com o termo escapado por metacaracteres regex e as mesmas aspas.

## Por que há um ramo especial para `*`

Pelo conhecimento do autor do código sobre o PostgREST, os operadores `like`/`ilike` convertem `*` em `%` **depois** de resolver o escape das aspas, e essa conversão não tem escape. Se isso for verdade, `ilike` jamais encontraria um `*` literal e trataria o caractere como curinga — exatamente o resultado que a decisão proíbe. O operador `imatch` não passa por essa conversão.

**Isto é uma hipótese, não um fato comprovado**: não foi verificada em banco, em documentação nem em teste nesta entrega.

## O que prova ou refuta

`tests/integration/rls/e1-posts-sort-at.test.ts`, **T-CMS-I03**: semeia posts sintéticos com títulos contendo cada caractere hostil (`%`, `_`, `\`, `"`, `,`, `(`, `)`, `.`, `*`, `--`, espaços, Unicode) e exige que cada busca devolva **somente** o post que contém o caractere literal. Escrito, **não executado**.

## Critério de decisão

| Resultado de T-CMS-I03 | Ação |
|---|---|
| Todos os casos literais, inclusive `*` | Fechar D2 com a abordagem atual. Registrar a evidência |
| Falha em qualquer caso | Promover `contingencia-rpc-busca.sql` a migration 015, trocar `listAdminPosts` pela chamada de `admin_list_posts` e manter os mesmos testes |
| Falha só no ramo `imatch` | Idem (a RPC não usa LIKE nem regex) |

Até a decisão estar fechada, o PR da E1 **não deve ser aberto**.
