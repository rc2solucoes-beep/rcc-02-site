# Fase 4 — Copy e reposicionamento

Fonte: `documentos-base/RC2_Correcoes_Recomendadas_Site.md` §§4, 5, 7, 9, 10, 11.

Só texto, dentro dos componentes que já existiam. A camada tipográfica e de
espaçamento veio da Fase 1 e não foi tocada aqui.

---

## 1. §4 — Zapbox na Home

**Removido:** "É o produto da RC2 para esse território — e é onde essas
necessidades devem ser resolvidas." Era arquitetura de marca falando com ela
mesma; o leitor quer saber o que o produto faz.

**Aplicado** (`src/lib/content/home.ts` → `HOME_PRODUCTS.zapbox`):

- tagline: "Atendimento e vendas pelo WhatsApp"
- corpo: "Organize sua equipe, centralize conversas e histórico e evolua sua
  operação com CRM, automações e Sales AI."
- CTA "Conhecer Zapbox" → `/zapbox` (inalterado, `BRIDGE_FIRST`)

`HomeProducts.tsx` ganhou uma linha para renderizar a tagline — única mudança
estrutural da fase.

## 2. §5 — Agenda Confirmada na Home

**Removido:** "reduzindo faltas e horários vagos". O §5 pede que a redução de
faltas não apareça como resultado garantido, e não há métrica documentada que a
sustente.

**Aplicado:** "Automatize lembretes e confirmações pelo WhatsApp, reduza o
trabalho manual da recepção e ganhe mais previsibilidade sobre sua agenda."

**CTA:** "Ver Agenda Confirmada" → `/contato`. O §5 sugere "Conhecer Agenda
Confirmada", mas o rótulo aplicado é o da tabela aprovada no `AGENTS.md`, e o
destino segue `/contato` porque `/solucoes/agenda-confirmada` é `DEFER_ROUTE`.

Contrato novo: nenhuma copy de produto pode conter "reduzindo faltas" / "reduz
faltas".

## 3. §7 e §9 — `/sobre`

O H1 já era "Tecnologia que funciona. Operação que entrega."

| Bloco | Mudança |
|---|---|
| Abertura (`PageHero`) | Passa a ser a frase de especialidade do §7 |
| "A empresa" | Os quatro parágrafos antigos, que misturavam institucional e biografia, deram lugar aos dois do §7: onde a RC2 entra e como o trabalho começa |
| Trajetória do fundador | Bloco novo "Experiência de operação antes da automação", com os sete itens do §9 em `SignalList` |
| Citação | Trocada pelo princípio do §9: "Tecnologia só faz sentido quando melhora um processo real e continua funcionando depois da implantação." |
| CTA final | "Conversar com a RC2" — CTA contextual de `/sobre` na tabela do `AGENTS.md`. `HomeCtaBlock` ganhou `primaryLabel` opcional para isso. |

Todos os dados da trajetória vêm da seção 16 da `RC2_PROPOSTA_ATUALIZACAO` —
material aprovado, não claim inventado.

## 4. §10 — `/avaliacoes`

Era a violação mais direta de governança em produção: a página se chamava
**"Avaliações e Cases"** e trazia uma seção **"Cases de Sucesso"** cujo único
conteúdo era o próprio site — laboratório apresentado como case.

Reestruturada nas quatro seções do §10:

| Seção | Conteúdo | Fonte |
|---|---|---|
| Avaliações de clientes | `GoogleReviews` | Inalterado |
| Produtos próprios | Zapbox e Agenda Confirmada | `HOME_PRODUCTS` |
| Demonstrações | Zapbox no ar e Valéria | `HOME_DEMOS` |
| Projetos de laboratório | Este site, rotulado "Laboratório interno" | Reescrito |

Produtos e demonstrações **leem a mesma fonte da Home** em vez de duplicar copy,
para as duas páginas não divergirem.

Título e metadata passam a "Avaliações e Projetos". A palavra "Cases"
desapareceu da página.

## 5. §11 — Valéria

**Antes:** "O agente de IA do nosso comercial" — descrevia o mecanismo por
dentro. **Agora:** "Converse com a Valéria", com o que ela faz e o convite do
§11 ("Você não precisa imaginar como funciona: é só chamar e conversar com
ela").

### `DE-1` caiu

`docs/12` §19 barrava a Valéria como `DEPENDÊNCIA EXTERNA`: faltava "qualquer
destino, descrição aprovada ou ativo verificável", com `OBSERVED` de "zero
ocorrências" nas fontes.

Isso mudou. Ela aparece seis vezes na `RC2_PROPOSTA_ATUALIZACAO` — autoridade
nº 1 — incluindo o CTA "Conversar com a Valéria" (linha 1139) e a demonstração
"conversar com Valéria" (linha 946). O §11 das Correções fornece a descrição
aprovada. O contrato que proibia mencioná-la foi substituído por contratos que
protegem *como* ela é apresentada.

### ⛔ CTA sem destino — BLOQUEADO

O §11 define o rótulo "Conversar com a Valéria" mas **não define URL**.

Apliquei primeiro o WhatsApp comercial já publicado (`5511988028550`) e
**confirmei com o time em 03/09/2026 que não é o canal dela**. O CTA foi
removido antes de qualquer publicação: um botão apontando para o canal errado
promete uma conversa que não acontece.

Estado atual: a demonstração usa o título e a descrição do §11, **sem link**.
Descrever é seguro; prometer o clique, não.

**Para ativar**, preencher em `HOME_DEMOS` o item da Valéria:
`ctaLabel`, `href`, `external` e `analyticsLabel`. O render de demos já suporta
destino externo (`target`, `rel`, ícone de saída) — caso que o próprio
comentário do código deixava previsto. Contrato em `homeContent.test.ts` fixa
`href === undefined` e falha quando o destino entrar, obrigando a atualização
deliberada.

Isso mantém `DE-1` parcialmente aberto: a **descrição** aprovada existe agora, o
**destino verificável** ainda não.

## 6. Fora de escopo, registrado

- **§10 pede "Demonstrações: Valéria, automações, integrações".** Entraram
  Valéria e Zapbox, que são os ativos com destino verificável. "Automações" e
  "integrações" como itens de demonstração exigiriam ativo aprovado que não
  existe — seria claim sem lastro.
- **§6 (`/solucoes/agenda-confirmada`)** não faz parte desta fase e continua
  `DEFER_ROUTE`.

## 7. Validação

`npm run typecheck` · `npm run lint` (0 erros) · `npm run test` (385) ·
`npm run build` · `npm run audit:brand` · `npx playwright test` contra
`next start` em porta limpa: **68 passando, 2 falhas pré-existentes**
(`admin.spec.ts:44`, `home-motion.spec.ts:4`).

Contratos atualizados: `homeContent.test.ts` (CTA da Agenda Confirmada, promessa
de faltas, apresentação da Valéria, marcação de destino externo),
`zapboxHandoff.test.ts` (o handoff protegido deixa de ser "sem link" e passa a
ser "nenhum destino de demo vai direto ao domínio do Zapbox").
