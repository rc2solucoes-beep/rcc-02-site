# Fase 6 — Página da Agenda Confirmada

Fontes: `RC2_Correcoes_Recomendadas_Site.md` §6 (estrutura e copy) e
`RC2_Direcao_de_Arte_e_Sistema_Visual.md` §9, template de landing por problema
(tratamento visual).

Rota publicada: **`/solucoes/agenda-confirmada`**.

---

## 1. O `DEFER_ROUTE` foi encerrado — com uma lacuna ainda aberta

`docs/18` §13 classificava a rota como `DEFER_ROUTE`, com condição de
desbloqueio em §13.1: **`CD-1` respondida e as lacunas U-3, U-4 e U-6
preenchidas**. Estado real na abertura desta fase:

| Lacuna | O que faltava | §6 preenche? |
|---|---|---|
| `CD-1` | destino do handoff | **Sim** — respondida em `docs/19` (`BRIDGE_FIRST`) |
| **U-3** | de qual sistema vem a agenda; integração pronta com qual software | **Em parte** — cita "Google Agenda ou o sistema de gestão da clínica"; não nomeia integrações prontas |
| **U-6** | estágio: produção, piloto ou oferta nova | **Implícito** — as quatro versões indicam oferta produtizada, mas o estágio não é declarado |
| **U-4** | base técnica: Zapbox, automação própria (n8n), ou os dois | **Não** — o §6 não toca no assunto |

A condição de §13.1 portanto **não estava integralmente satisfeita**. A página
foi criada por decisão de negócio explícita; a lacuna U-4 foi tratada não
preenchendo-a:

> **A página não afirma base técnica.** Não diz que roda sobre o Zapbox, sobre
> automação própria, nem sobre os dois. Descreve o que a clínica passa a ter,
> não como é construído.

Um contrato garante isso: nenhuma menção a `zapbox`, `n8n`, "roda sobre" ou
"construído sobre" na copy ou na página. Quando U-4 for respondida, é ali que a
informação entra.

`AGENTS.md` foi atualizado: o `DEFER_ROUTE` saiu, a árvore de arquitetura marca
a rota como publicada, e a lacuna U-4 ficou registrada como pendência.

## 2. Estrutura da página

Template de landing por problema (§9): hero tipográfico → sinais → sequência →
CTA final.

| Seção | Componente | Fonte |
|---|---|---|
| Hero + CTA "Quero automatizar minha agenda" | `PageHero` + `buttonVariants` | §6 |
| "O que acontece hoje" — 6 sintomas | `SignalList` em duas colunas | §6 Problema |
| "Como funciona" — 5 etapas | **`NumberedList`** | §6, redesenhado (ver §3) |
| "Versões" — 4 nomes | `rc2-card` com numeral navy | §6 Versões |
| "O que não faz" — 6 limites | Lista com `XCircle` fino | §6 |
| CTA final "Agendar uma Sessão de Compatibilidade" | `CTABlock` | §6 |

Zero markup ad-hoc: a página inteira é composta com componentes que já existiam
no design system depois da Fase 5.

## 3. O "Como funciona" não virou fluxograma

O §6 desenha a sequência como diagrama vertical de nós e setas:

```
AGENDA ↓ AUTOMAÇÃO ↓ WHATSAPP ↓ CONFIRMAÇÃO / CANCELAMENTO ↓ ATUALIZAÇÃO / ALERTA
```

O Princípio 5 escopa a proibição de fluxograma ao hero, então nada impediria o
diagrama aqui. Ainda assim virou `NumberedList` — a mesma sequência lida como
cinco etapas numeradas, cada uma com uma frase que diz o que acontece.

Motivo: o diagrama comunica encadeamento, que já é óbvio, e não comunica o que
cada etapa faz — que é a informação que a clínica precisa. E reaproveitar o
Numerado mantém a página dentro do sistema em vez de criar um desenho único.

Contrato: a página não pode conter `↓`, `→`, `svg` nem `line x1`.

## 4. Três coisas que a página deliberadamente não faz

1. **Não descreve o escopo de cada versão.** O §6 dá quatro nomes — Start,
   Plus, Agenda Confirmada, Pro — e nada mais. Inventar o que cada uma inclui
   seria criar oferta que nenhuma fonte aprovou. A página lista os nomes e diz
   que o escopo é definido na conversa. Contrato veta qualquer `R$`.
2. **Não promete redução de faltas.** U-7 segue aberta: é benefício declarado
   sem métrica. Os seis sintomas descrevem a operação **atual** da clínica — a
   dor, não o resultado. Nenhum número na página.
3. **Não emite schema de produto.** Só `WebPage`. `Product`/`Offer`/
   `SoftwareApplication` exigiriam preço, disponibilidade ou escopo por versão,
   que não existem.

## 5. Alcance da rota

Uma página nova sem link interno é órfã — o problema que `/avaliacoes` tinha
antes da Fase 4. Ligações criadas:

| Onde | Link |
|---|---|
| Sitemap | entrada própria, `priority` 0.8 |
| Card de produto da Home | CTA "Ver Agenda Confirmada" passou de `/contato` para a rota |
| Footer, coluna Soluções | sexto item, depois das cinco âncoras |

O CTA da Home fecha o que `docs/18` §13.2 tinha previsto: *"o CTA aprovado 'Ver
Agenda Confirmada' só volta a ser aplicável quando houver o que ver"*.

O footer fecha o item do §18 das Correções que a Fase 3 deixara de fora
**apenas** porque a rota não existia.

**Header não incluído.** O §17 lista a Agenda Confirmada no menu principal, mas
isso levaria o header a seis itens. É decisão de densidade de navegação, não de
execução do documento — fica em aberto.

## 6. Vocabulário novo, registrado

O CTA final do §6 é **"Agendar uma Sessão de Compatibilidade"**. Não é expressão
proibida, mas introduz um nome de oferta que não existe na taxonomia aprovada
(conversa inicial gratuita · Discovery Operacional pago · Operação Gerenciada).
Foi aplicado como o §6 pede, apontando para `/contato`. Se a intenção era
nomear a conversa inicial gratuita, vale alinhar o vocabulário.

## 7. Validação

`npm run typecheck` · `npm run lint` (0 erros) · `npm run test` (**428**, com 10
contratos novos da página) · `npm run build` · `npm run audit:brand` ·
`npx playwright test`: 68 passando, 2 falhas pré-existentes.

Verificado em runtime contra `next start`:

- `/solucoes/agenda-confirmada` responde **200**;
- consta do `sitemap.xml`;
- alcançável de `/`, `/solucoes` e `/sobre` (footer);
- **zero overflow horizontal** em 390 · 768 · 1024 · 1440 px;
- "Como funciona" renderiza como sequência numerada 01–05.
