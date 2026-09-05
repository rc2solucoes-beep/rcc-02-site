# Categorização A/B/C dos CTAs do blog — para revisão

**Nada foi executado no banco.** SQL só depois da sua aprovação desta tabela.

## Categorias aplicadas

| | Território | Botão | Destino |
|---|---|---|---|
| **A** | Zapbox | Conhecer Zapbox | `/zapbox` |
| **B** | RC2 — integração / ERP / automação | Falar sobre minha operação | `/contato` |
| **C** | RC2 — IA interna / processos | Falar sobre minha operação | `/contato` |

Critério do documento: *"O problema principal desta página é conversa, lead,
atendimento ou venda pelo WhatsApp? Se sim, Zapbox. Se for processo, sistema,
dado, integração ou operação interna, RC2."*

Cruzei com o território que eu já tinha levantado via `CD-3` do `AGENTS.md`
(mesmo critério de objeto principal). **As duas fontes convergiram nos 11
posts — nenhuma divergência a decidir.** A distinção B/C é interna à RC2 e não
muda destino nem botão; muda só o texto do bloco.

---

## Tabela completa

| # | Post | Cat. | Território (CD-3) | CTA atual | CTA novo | Destino |
|---|---|---|---|---|---|---|
| 1 | `atendimento-automatizado-contexto` | **A** | Zapbox | Solicitar Diagnóstico Gratuito → | Conhecer Zapbox | `/zapbox` |
| 2 | `atendimento-omnichannel-pme` | **A** | Zapbox | *(sem `cta_block`)* | Conhecer Zapbox | `/zapbox` |
| 3 | `automacao-whatsapp-ia` | **A** | Zapbox | *(sem `cta_block`)* | Conhecer Zapbox | `/zapbox` |
| 4 | `leads-sem-resposta-primeiro-retorno` | **A** | Zapbox | Solicitar Diagnóstico Gratuito → | Conhecer Zapbox | `/zapbox` |
| 5 | `mensagens-servico-whatsapp-business-api` | **A** | Zapbox | Solicitar Diagnóstico Gratuito → | Conhecer Zapbox | `/zapbox` |
| 6 | `e-commerce-para-pme-operacao` | **B** | RC2 | Solicitar Diagnóstico Gratuito → | Falar sobre minha operação | `/contato` |
| 7 | `processos-manuais-o-que-automatizar` | **B** | RC2 | Solicitar Diagnóstico Gratuito → | Falar sobre minha operação | `/contato` |
| 8 | `solucoes-automatizadas-…-fornecedores` ¹ | **B** | RC2 | Solicitar Diagnóstico Gratuito → | Falar sobre minha operação | `/contato` |
| 9 | `custo-de-agente-de-ia` | **C** | RC2 | Solicitar Diagnóstico Gratuito → | Falar sobre minha operação | `/contato` |
| 10 | `governanca-agentes-ia-pmes` | **C** | RC2 | Solicitar Diagnóstico Gratuito → | Falar sobre minha operação | `/contato` |
| 11 | `ia-para-pequenas-empresas` | **C** | RC2 | *(sem `cta_block`)* | Falar sobre minha operação | `/contato` |

¹ slug corrompido — correção separada em `docs/sql/30-corrige-slug-corrompido.sql`.

**Resultado: 5 em A · 3 em B · 3 em C.** Bate com o levantamento anterior
(5 Zapbox / 6 RC2).

### Justificativa dos três menos óbvios

- **#5 `mensagens-servico-whatsapp-business-api`** — parece infraestrutura
  técnica (API), mas o objeto é a **mensagem de serviço no WhatsApp**: canal e
  conversa. Território Zapbox pelo `CD-3`, que manda classificar pelo objeto e
  não pelo vocabulário.
- **#6 `e-commerce-para-pme-operacao`** — cobre pedido, estoque, entrega e
  atendimento. O atendimento aparece, mas o objeto principal é a **operação do
  pedido**: B.
- **#11 `ia-para-pequenas-empresas`** — foi o que marquei como ambíguo antes. É
  um guia amplo que passa por atendimento, mas o objeto é **por onde começar com
  IA na operação**: C. Se você discordar, é o único que eu moveria para A.

---

## Textos novos por categoria

**A — Zapbox** (posts 1–5)

> Seu problema é atendimento e vendas pelo WhatsApp? Conheça o Zapbox, produto
> da RC2 para organizar equipe, histórico, CRM, automações e Sales AI.

**B — integração/ERP/automação** (posts 6–8)

> Tem sistemas que ainda não conversam? Mostre para a RC2 como sua operação
> funciona hoje.

**C — IA interna/processos** (posts 9–11)

> Quer entender onde IA realmente pode ajudar sua operação? A primeira conversa
> serve para identificar se existe um processo que vale automatizar ou apoiar
> com IA.

Os três substituem o `cta_block.title` atual, hoje **idêntico nos 8 posts**:
*"Quer identificar gargalos nos processos da sua empresa?"* — incluído no lote,
como você pediu.

---

## As três superfícies do lote

### 1. `cta_block` — 8 posts

Botão e título trocados conforme a tabela. Nos 5 de categoria A, o `url` do
botão também muda de `/contato` para `/zapbox`.

### 2. Corpo do artigo — 11 posts, 20 âncoras

| Post | Âncoras a substituir | Destino atual |
|---|---|---|
| `atendimento-automatizado-contexto` | "Solicitar diagnóstico gratuito de 30 minutos →" · "solicite um diagnóstico gratuito de 30 minutos →" | `/contato` |
| `atendimento-omnichannel-pme` | "Solicitar diagnóstico gratuito de atendimento →" · "solicite um diagnóstico gratuito →" | `https://rc2solucoes.com.br/contato` ² |
| `automacao-whatsapp-ia` | "Solicitar diagnóstico gratuito de automação WhatsApp →" · "solicite um diagnóstico gratuito →" | `https://rc2solucoes.com.br/contato` ² |
| `custo-de-agente-de-ia` | "solicite um diagnóstico →" (×2) | `/contato` |
| `e-commerce-para-pme-operacao` | "Agendar o diagnóstico gratuito de 30 minutos →" · "solicite um diagnóstico gratuito de 30 minutos →" | `/contato` |
| `governanca-agentes-ia-pmes` | "solicite um diagnóstico →" · "solicite um diagnóstico inicial →" | `https://www.rc2solucoes.com.br/contato` ³ |
| `ia-para-pequenas-empresas` | "Solicitar diagnóstico gratuito →" (×2) | `https://www.rc2solucoes.com.br/contato` ³ |
| `leads-sem-resposta-primeiro-retorno` | "Agendar o diagnóstico gratuito de 30 minutos →" · "solicite um diagnóstico gratuito de 30 minutos →" | `/contato` |
| `mensagens-servico-whatsapp-business-api` | "solicite um diagnóstico →" | `/contato` |
| `processos-manuais-o-que-automatizar` | "solicite um diagnóstico de processo →" | `https://www.rc2solucoes.com.br/contato` ³ |
| `solucoes-automatizadas-…-fornecedores` | "Agendar o diagnóstico gratuito de 30 minutos →" · "solicite um diagnóstico gratuito de 30 minutos →" | `/contato` |

² apex sem `www` — custa salto extra de redirect.
³ absoluto para o próprio domínio.

**Normalização incluída no lote:** ² e ³ viram `/contato` relativo, e nos posts
de categoria A viram `/zapbox`.

### 3. Os 3 sem `cta_block`

`atendimento-omnichannel-pme` · `automacao-whatsapp-ia` ·
`ia-para-pequenas-empresas` caem no bloco padrão do `BlogPostArticle`, com botão
"Falar sobre o meu caso →" — já na taxonomia.

**Mas dois deles são categoria A**, e o bloco padrão manda para `/contato`, não
para `/zapbox`. Duas saídas:

- **(a)** criar `cta_block` para os dois, entrando no mesmo lote de SQL;
- **(b)** deixá-los no bloco padrão, aceitando que o CTA final não segue a
  categoria.

Recomendo **(a)**: sem isso, dois dos cinco posts de território Zapbox mandam o
leitor para o funil errado justamente no fim do artigo.

---

## Riscos que o SQL vai respeitar

1. **`regexp_replace` mira só o texto da âncora**, com o `href` de contato no
   padrão. Vários posts têm "solicitação" em prosa legítima — *"comece por uma
   solicitação frequente"*, *"tipo de solicitação"* — que não pode ser tocada.
2. **O texto está aninhado em `<strong>`.** Padrão `<a>texto</a>` simples só
   acerta 1 dos 11.
3. **Dois posts repetem a mesma âncora.** Replace global; conferência conta
   ocorrências, não linhas.
4. **Backup de `cta_block` e `content` antes do UPDATE**, na mesma transação.

## O que preciso de você

1. **Aprovar a tabela** — em especial #11, o único que eu moveria para A.
2. **Decidir (a) ou (b)** para os 3 sem `cta_block`.
