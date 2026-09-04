# Fase 3 — Consolidação de arquitetura de informação

Fonte: `documentos-base/RC2_Correcoes_Recomendadas_Site.md` §§12, 13, 17, 18, 19, 20.

Encerra a arquitetura de `/servicos`, publica o Zapbox no header e devolve
`/avaliacoes` à navegação. Não é uma fase visual.

---

## 1. O que já estava feito

O §13 (páginas de WhatsApp → Zapbox) e metade do §12 foram executados nas Fases
6E/6F (`docs/21`, `docs/22`). Nada foi refeito:

| URL | Destino | Origem |
|---|---|---|
| `/servicos/automacoes-com-ia` | `/zapbox` | `docs/22` |
| `/servicos/automacao-de-atendimento` | `/zapbox` | `docs/22` |
| `/solucoes/atendimento-lento` | `/zapbox` | `docs/22` |
| `/solucoes/leads-sem-resposta` | `/zapbox` | `docs/22` |
| `/solucoes/whatsapp-desorganizado` | `/zapbox` | `docs/22` |
| `/servicos/agentes-de-ia` | `/solucoes#ia-para-operacoes` | `docs/16` |
| `/servicos/automacao-de-processos` | `/solucoes#automacao-de-processos` | `docs/16` |
| `/servicos/integracao-de-sistemas` | `/solucoes#integracao-de-sistemas` | `docs/16` |
| `/servicos/operacoes-digitais` | `/solucoes#operacoes-digitais-commerce` | `docs/16` |

## 2. Redirects adicionados nesta fase

| Origem | Destino | Tipo | Nota |
|---|---|---|---|
| `/servicos` | `/solucoes` | 301 | O hub. §12. |
| `/servicos/e-commerce` | `/solucoes#operacoes-digitais-commerce` | 301 | §12 escreve `#operacoes-digitais`; a âncora publicada em `SOLUCOES_ANCHORS` é `operacoes-digitais-commerce`. Vale a real — âncora inexistente entrega o usuário no topo da página. |
| `/servicos/sites-e-landing-pages` | `/solucoes` | 301 | Serviço despriorizado, sem competência equivalente. Destino é a página comercial, não a home. |
| `/services/` | `/solucoes` | 301 | Apontava para `/servicos`, que passou a redirecionar. Reapontado ao destino final — mas ver §5.1: a regra é inalcançável. |

Com isso **nenhuma URL sob `/servicos` responde 200.**

### Checklist de migração (skill `rc2-site-migration`)

1. **Função atual** — hub comercial legado e dois serviços despriorizados.
2. **Conteúdo** — preservado em `src/lib/content/services.ts` (`PRESERVE_DATA`); nenhum dado apagado.
3. **Histórico orgânico** — as três já estavam fora da navegação desde a Fase 5.
4. **Destino equivalente** — `/solucoes` e a âncora de Operações Digitais & Commerce.
5. **Chains** — nenhuma entre regras. Ver §5.1 para o salto extra que o
   framework introduz em URLs com barra final. Contrato automatizado em
   `redirects.test.ts`.
6. **Intenção de busca** — e-commerce vai para a competência equivalente; sites/landing não têm equivalente e vão ao hub comercial.
7. **Documentado** — este arquivo.

## 3. Sitemap (§19, §20)

- `/servicos` saiu de `staticPages` em `src/app/sitemap.ts`.
- `e-commerce` e `sites-e-landing-pages` entraram em `MIGRATED_SERVICE_SLUGS`
  (`src/lib/content/migratedRoutes.ts`), o que os remove do sitemap **e** de
  `/llms-full.txt` pela mesma fonte única.

**Não removido, contra o §20:** `/solucoes/processos-manuais` e
`/solucoes/sistemas-desconectados`. O §20 condiciona a remoção a "após
redirects", e o §12 não define destino para elas. Removê-las do sitemap sem
redirect deixaria duas páginas vivas e órfãs — pior que o estado atual.
Continuam 200, indexáveis e no sitemap até que exista decisão de destino.

**Não adicionado, contra o §19:** `/solucoes/agenda-confirmada`. A rota é
`DEFER_ROUTE` e não existe (`AGENTS.md`, `docs/18` §13).

## 4. Header e Footer (§17, §18)

| Mudança | Arquivo |
|---|---|
| **Zapbox** entra no header | `src/lib/content/navigation.ts` → `NAV_LINKS` |
| **Avaliações e Projetos** entra na coluna Empresa do footer | `src/lib/content/navigation.ts` → `FOOTER_COMPANY_LINKS` |

`/avaliacoes` existia, estava no sitemap e não recebia nenhum link interno —
órfã na prática. O rótulo é "Avaliações e Projetos", nunca "Cases de Sucesso":
não há case documentado.

"Serviços" já havia saído da navegação na Fase 5. Nada a remover.

## 5. Links internos

`/solucoes/sistemas-desconectados` era a única página viva que ainda oferecia
`/servicos/e-commerce`, em `relatedServices` e `relatedLinks`. Ambos reapontados
para `/solucoes#operacoes-digitais-commerce` — o mesmo destino do 301, para que
o link interno não pague um salto.

Contrato novo em `internalLinks.test.ts`: nenhum href alcançável começa com
`/servicos`.

### 5.1. Barra final custa um salto extra — comportamento do framework

Verificado em runtime com `next start`:

```
/servicos                        308 → /solucoes                              1 salto
/servicos/e-commerce             308 → /solucoes#operacoes-digitais-commerce  1 salto
/servicos/sites-e-landing-pages  308 → /solucoes                              1 salto
/services/                       308 → /services → /solucoes                  2 saltos
/about/                          308 → /about   → /sobre                      2 saltos
```

O Next normaliza a barra final **antes** de avaliar `redirects()`. A regra
`/services/` nunca chega a ser avaliada, e a de `/about/` também não — ambas já
eram código morto antes desta fase. Nenhum redirect novo desta fase encadeia.

**Resolvido depois, na Fase 7** (`docs/29` §1): o §21 das Correções pede
explicitamente `A → C` no lugar de `A → B → C`, o que reabriu esta decisão. A
normalização foi desligada, cada consolidação passou a gerar também a variante
com barra, e um catch-all no fim da lista normaliza o resto do site. Medido:
49 URLs, zero cadeias.

---

## 6. Conflitos com o documento de Correções

Aplicados como especificação independente, com três desvios registrados. Todos
por precedência do `AGENTS.md` e das decisões `CD-*`.

| § | O que o documento pede | O que foi feito | Por quê |
|---|---|---|---|
| 13 | `/servicos/automacoes-com-ia` → `https://zapbox.cloud/sales-ai` | Mantido `/zapbox` | `CD-1 = BRIDGE_FIRST`. Redirect externo permanente é `OPTIONAL_FUTURE_OPTIMIZATION`, não requisito, e exige oito pré-condições ainda não cumpridas. O documento reconhece isso ao escrever "quando a página existir". Além disso o apex `zapbox.cloud` responde 308 — o destino correto teria `www`. |
| 17 | "Zapbox ↗ abre domínio próprio" | Link para a ponte `/zapbox`, sem seta externa | `CD-1`: só o CTA da ponte sai do domínio. |
| 17, 18, 19 | "Agenda Confirmada" no header, no footer e no sitemap | **Não incluído** | `DEFER_ROUTE`: `/solucoes/agenda-confirmada` não existe e `CD-2` não foi decidida. `AGENTS.md`: "nunca criar `href` para essa rota". Criar o item produziria 404 na navegação principal. |

### Não executado, fora do escopo pedido

- **§17 renomeia "Blog" para "Conteúdo".** O rótulo mexe em taxonomia de
  analytics e em testes e2e de navegação, e não estava entre os itens que a
  tarefa nomeou. Decisão de copy pendente.
- **`/solucoes-com-ia`.** O §19 a omite do sitemap recomendado, mas o §12 não
  define redirect. Continua 200 e publicada, órfã de link interno desde a Fase
  6F (`internalLinks.test.ts` já registra esse estado).

## 7. Páginas que deixaram de ser alcançáveis

`src/app/(public)/servicos/page.tsx` e `src/app/(public)/servicos/[slug]/page.tsx`
continuam no repositório mas nunca renderizam — o redirect do `next.config.ts`
resolve antes. Foram mantidas de propósito: a remoção dos arquivos é
irreversível num diff e não traz benefício de SEO. Removê-las é decisão
separada, depois do período de observação.

### 7.1. Testes removidos junto com as páginas

Matar uma página mata os testes dela. Dois casos e2e foram removidos, com o
motivo registrado no próprio arquivo:

| Teste | Arquivo | Substituto |
|---|---|---|
| "serviços usa seção de prova realmente densa" | `typography-rhythm.spec.ts` | Nenhum. `.rc2-section--proof` continua definido em `globals.css` e ficou **sem consumidor alcançável** — `/servicos` era o único. Candidato a reaplicação no rollout visual. |
| "página individual de serviço diferencia CTA intermediário e final" | `personality-copy.spec.ts` | O teste equivalente de `/solucoes/[slug]`, que cobre o mesmo contrato de CTA. |

### 7.2. Duas correções de teste descobertas no caminho

Não são da Fase 3, mas foram consertadas porque impediam a verificação:

- **`typography-rhythm.spec.ts` comparava `"Barlow Condensed"` com espaço.** O
  `next/font` gera `__Barlow_Condensed_xxxxxx` no build de produção. O contrato
  passava em dev e falhava em produção. Passou a usar `/Barlow[_ ]Condensed/`.
- **O e2e rodava contra um `next dev` obsoleto.** `playwright.config.ts` usa
  `reuseExistingServer: !CI`, e mudança em `next.config.ts` só vale após
  restart do servidor. Um dev server antigo na porta 3000 mascarava 10 falhas e
  fazia 6 testes de `/servicos` passarem contra a arquitetura antiga. Toda a
  verificação desta fase foi refeita com `next start` em porta limpa.

## 9. Fase 3B — fecha o §20

As duas últimas soluções por problema que ainda respondiam 200 passaram a
redirecionar, direto ao destino final:

| Origem | Destino | Tipo |
|---|---|---|
| `/solucoes/processos-manuais` | `/solucoes` | 301 |
| `/solucoes/sistemas-desconectados` | `/solucoes` | 301 |

Ambas saíram do sitemap via `MIGRATED_SOLUTION_SLUGS`. **Nenhum link interno
apontava para elas** — verificado antes da mudança; a única ocorrência do termo
em `src/` era o slug de um artigo de blog homônimo.

### Consequência: `/solucoes/[slug]` também ficou sem slug alcançável

Somando a Fase 3, os dois templates dinâmicos comerciais estão inteiros sem
rota viva:

- `/servicos/[slug]` — 5 slugs, todos redirecionando
- `/solucoes/[slug]` — 5 slugs, todos redirecionando

Isso esvaziou `allHrefs()` em `internalLinks.test.ts`, o que tornaria **vácuos**
os contratos "nenhum link aponta para X" — eles passariam sobre uma lista
vazia. Um contrato explícito foi adicionado para tornar a condição visível:
se algum slug voltar a renderizar, `allHrefs()` deixa de ser vazio e os demais
contratos voltam a ter efeito.

Dois testes e2e perderam o alvo e migraram de página em vez de sumir:

| Teste | Antes | Agora |
|---|---|---|
| CTA contextual de página de solução | `/solucoes/processos-manuais` | `/solucoes` |
| Link interno reapontado para a âncora | `/solucoes/sistemas-desconectados` | Coberto estaticamente em `internalLinks.test.ts` |

## 8. Validação

`npm run typecheck` · `npm run lint` (0 erros) · `npm run test` (386) ·
`npm run build` · `npm run audit:brand` · `npx playwright test` contra
`next start` em porta limpa: **71 passando, 2 falhas pré-existentes**
(`admin.spec.ts:44`, `home-motion.spec.ts:4`), ambas confirmadas contra o
baseline com as mudanças em stash.

Redirects verificados em runtime, não só na configuração — ver §5.1.

Contratos atualizados: `redirects.test.ts`, `internalLinks.test.ts`,
`sitemapMigration.test.ts`, `zapboxUrlMigration.test.ts`,
`zapboxBridgeSitemap.test.ts`, `navigation.test.ts`.
