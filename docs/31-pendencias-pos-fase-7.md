# Pós-Fase 7 — Pendências de migração: registro e estado

Registro das duas pendências apontadas pelo `/pre-pr` (reviewer
`seo-migration-checker`) sobre as mudanças das PRs #28 e #29, já mescladas em
`main` e publicadas.

Estado verificado em **2026-09-26**, por leitura HTTP pública de produção
(`https://www.rc2solucoes.com.br`). Nenhum SQL foi executado nesta verificação e
nenhum dado foi alterado.

---

## 1. Slug corrompido do blog — ordem entre UPDATE e deploy

Unidade: commit `5253af5` (redirect em `next.config.ts` → `MIGRACOES`) +
`docs/sql/30-corrige-slug-corrompido.sql` (UPDATE do slug no Supabase).

| | Valor |
|---|---|
| Post | `d049fc80-5e04-4944-8000-5f417f881b14` |
| URL antiga (103 chars) | `/blog/solucosolucoes-automatizadas-avaliar-fornecedoreses-automatizadas-7-criterios-para-avaliar-fornecedores` |
| URL nova | `/blog/solucoes-automatizadas-7-criterios-para-avaliar-fornecedores` |

### 1.1 Por que a ordem importa

O redirect e o slug vivem em sistemas diferentes: o redirect sai com o deploy;
o slug muda com o UPDATE. A rota `/blog/[slug]` busca o post pelo slug e chama
`notFound()` quando não encontra; usa ISR com `revalidate = 60` e
`generateStaticParams` (`src/app/(public)/blog/[slug]/page.tsx`). Redirects do
`next.config.ts` rodam antes do sistema de arquivos.

| Ordem | URL antiga | URL nova | Janela |
|---|---|---|---|
| **Deploy primeiro** | 308 → URL nova | **404** — nenhum post tem o slug novo | O post fica **inalcançável pelas duas URLs** até o UPDATE; o sitemap (gerado do banco) ainda lista a URL antiga, que redireciona para um 404 |
| **UPDATE primeiro** | 200 enquanto o cache ISR vale; depois da próxima revalidação (≥ 60 s), **404** até o deploy | **200** imediato (renderização sob demanda) | Só a URL antiga fica 404, entre a revalidação e o deploy; o post continua acessível pela URL nova, que já entra no sitemap |

**Ordem segura: UPDATE primeiro, deploy logo em seguida.** Ela nunca deixa o
post inalcançável; o único custo é a URL antiga responder 404 no intervalo
entre a revalidação do cache e a conclusão do deploy. Encurte esse intervalo
fazendo o deploy imediatamente após validar o UPDATE.

### 1.2 Procedimento

1. **Executar o UPDATE** de `docs/sql/30` no Supabase SQL Editor, por um admin
   (a RLS de `posts` só permite escrita a admin). O script guarda o estado
   anterior (passo 1 do script), só altera o registro se o slug ainda for o
   corrompido (idempotente) e exige conferência antes do `COMMIT` (passo 3 do
   script).
2. **Validar o UPDATE:** o passo 3 do script retorna exatamente 1 linha com o
   slug novo; `GET /blog/solucoes-automatizadas-7-criterios-para-avaliar-fornecedores`
   em produção responde **200**.
3. **Fazer o deploy** do código com o redirect, logo em seguida.
4. **Validar depois do deploy:**
   - URL antiga → **308** com `Location` na URL nova;
   - URL antiga com barra final → **308** para a URL nova (um salto);
   - URL nova → **200**;
   - `sitemap.xml` lista a URL nova e não lista a antiga.

**Reversão:** o rodapé de `docs/sql/30` tem o UPDATE inverso; o redirect sai
removendo a entrada de `MIGRACOES`. Reverter só o banco, com o redirect no ar,
recria o caso "deploy primeiro" — reverta os dois juntos.

### 1.3 Estado em produção — **RESOLVIDO**

Verificado em 2026-09-26:

| Verificação | Resultado |
|---|---|
| URL nova | **200** |
| URL antiga | **308** → URL nova |
| `sitemap.xml` | lista só a URL nova |

O UPDATE foi aplicado e o redirect está publicado. Não é possível determinar,
pelo repositório ou por produção, **em que ordem** os dois ocorreram; o estado
final é o correto. O procedimento acima vale para qualquer correção futura de
slug publicado.

---

## 2. `/solucoes-com-ia` → `/solucoes` — **DECISION_REQUIRED**

Unidade: commit `8de50f6`, publicado. O comentário da regra em `MIGRACOES`
dizia "Decisão tomada", sem citar fonte.

### 2.1 O que as fontes dizem

| Fonte | Posição |
|---|---|
| `documentos-base/RC2_PROPOSTA_ATUALIZACAO.txt` §10 | "`/solucoes-com-ia` — Incorporar em `/solucoes#ia-para-operacoes`" |
| `docs/16` §7.1 | esse destino **não é equivalente em intenção**: metade da intenção é Zapbox |
| `docs/18` §7 | classificação `SPLIT_INTENT`; redirect único rejeitado |
| `docs/19` §9 (`APPROVED`) e §20, item 9 (decisões fechadas) | "`/solucoes-com-ia` vira triagem, mantendo `SPLIT_INTENT`; **nenhum 308 global aprovado**" |
| `RC2_Direcao_de_Arte_e_Sistema_Visual.md`, pendências | decisão de produto sobre `/solucoes-com-ia` sinalizada como em aberto |
| commit `8de50f6` | 308 → `/solucoes`, "decisão tomada: a metade RC2 vive em `/solucoes`" |

Nenhum documento posterior ao `docs/19` substitui a decisão fechada do §20,
item 9. O redirect publicado **contradiz a última decisão aprovada** e não tem
aprovação registrada.

### 2.2 Estado

Em produção: `/solucoes-com-ia` → **308** → `/solucoes`. Nenhuma alteração foi
feita no redirect nesta unidade: revertê-lo ou mantê-lo é decisão de negócio.

### 2.3 Decisão pendente

Uma das duas, registrada por quem decide:

- **(A) Ratificar o redirect.** Registrar a aprovação aqui, com data e
  responsável, e marcar `docs/19` §9 e §20, item 9, como substituídos por este
  documento. Registrar também por que o destino é `/solucoes` e não
  `/solucoes#ia-para-operacoes` (proposta §10), e como a metade Zapbox da
  intenção é atendida (hoje: um clique a mais, `/solucoes` → `/zapbox`).
- **(B) Voltar à decisão do `docs/19`.** Remover o redirect e implementar a
  página de triagem 200 do `docs/19` §9, reincluindo a URL no sitemap — uma
  nova unidade de migração, com o checklist completo.

Enquanto não houver registro, o `seo-migration-checker` deve continuar
apontando esta regra: a pendência é real.
