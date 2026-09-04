# Decisão — `--rc2-bg` permanece `#FBFAF8`

Data: 04/09/2026.

## O pedido

Trocar `--rc2-bg` para `#FFFFFF` puro.

## Por que foi levantado antes de executar

O `AGENTS.md` determina, na abertura das regras invioláveis:

> Estas regras têm precedência sobre qualquer instrução de estética numa tarefa
> específica. **Se uma tarefa pedir algo que as viole, aponte o conflito antes
> de executar.**

A mudança colidia com duas fontes:

| Fonte | O que diz |
|---|---|
| Regra inviolável nº 4 | "`#FFFFFF` é cor de card, não de página. Fundo de página é `#FBFAF8`." |
| `RC2_Direcao_de_Arte_e_Sistema_Visual.md` §6 | Mantém `#FBFAF8` como fundo padrão e `#FFFFFF` como superfície de card, justificando: *"mantendo a separação fundo/card por preenchimento (evita a estética clínica que o próprio brand guide pede para evitar)"* |

O §6 do documento foi **atualizado na mesma rodada** — a especificação nova do
container de ícone entrou. O bloco de tokens de fundo não mudou: continua
prescrevendo `#FBFAF8`.

## A consequência concreta

`--rc2-surface` (cards) já é `#FFFFFF`. Com a página também em `#FFFFFF`, o card
perde o preenchimento que hoje o separa do fundo e sobra apenas:

- borda `--rc2-card-border: #E1E5E9`, hairline de 1px;
- `--shadow-soft`, `rgba(11,23,38,0.05)`.

Cards, seções de alternância (`--rc2-bg-alt`) e fundo de página passariam a
disputar a mesma faixa tonal. É exatamente a "estética clínica" que o §6 nomeia
ao justificar a escolha.

## Decisão

**Manter `#FBFAF8`.** Confirmado pelo autor da tarefa após o conflito ser
apresentado, entre três caminhos: aplicar com reforço da separação de cards,
aplicar puro, ou manter.

Nenhuma mudança de código. `AGENTS.md` regra nº 4 e o §6 do documento seguem
como estão, sem divergência entre governança e implementação.

## Se a decisão mudar

O caminho seguro seria mover os cards para `--rc2-bg-alt` como preenchimento, ou
tornar borda e sombra mais presentes — e atualizar juntos a regra nº 4, o §6 do
documento e o contrato `brandV22.test.ts`, que fixa os dois tokens.
