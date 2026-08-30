# Fase 1 — Decisões comerciais

> **Registro operativo.** Consolida as decisões comerciais que a análise
> (`docs/08-site-baseline-audit.md`, seção 18) identificou como **bloqueantes de
> todas as fases seguintes**: Discovery Operacional, Operação Gerenciada e a
> fronteira exata entre RC2 e Zapbox.
>
> **Nada aqui é invenção.** Cada definição é transcrita de
> `documentos-base/RC2_PROPOSTA_ATUALIZACAO.txt`, o documento de maior
> autoridade segundo `AGENTS.md`. Onde a proposta não decide, este documento
> **marca a dependência** em vez de fabricar uma resposta.
>
> Esta fase **não altera o site**. Nenhuma copy, rota, CTA ou componente foi
> tocado.

## Procedência

| Marcação | Significado |
|---|---|
| `APROVADO` | Consta em `RC2_PROPOSTA_ATUALIZACAO.txt`, com a seção citada. |
| `OBSERVADO` | Verificado nesta tarefa contra o site real (RC2 ou Zapbox). |
| `PENDENTE` | Decisão que a proposta **não** resolve. Bloqueia a fase indicada. |

Baseline técnica desta fase: `main` @ `cf645cc` — Fase 0 já incorporada.

---

## 1. Discovery Operacional

`APROVADO` — proposta, seção 7.

**Problema que resolve:** a empresa sabe que tem gargalo, mas não sabe a
arquitetura nem a prioridade.

**Modelo:** projeto **pago**. Faixa de **R$ 1,5 mil a R$ 5 mil**, conforme a
complexidade.

**Papel no funil:** entrada para qualquer projeto RC2.

**Prioridade:** Alta.

### Entrega (transcrição literal da proposta)

- mapa do processo
- sistemas envolvidos
- gargalos
- fluxos
- integrações
- riscos
- arquitetura proposta
- prioridades
- estimativa

### Fronteira com a conversa gratuita

`APROVADO` — proposta + `AGENTS.md` + `PRODUCT.md`.

| | Conversa de diagnóstico | Discovery Operacional |
|---|---|---|
| Preço | gratuita | **pago** |
| Duração | curta (20–30 min) | conforme escopo |
| Objetivo | entender o problema e avaliar **fit** | processo, sistemas, arquitetura, riscos, roadmap |

A conversa gratuita **não promete**: levantamento completo, mapeamento
detalhado, arquitetura, roadmap ou discovery completo.

**Consequência direta para a Fase 3.** O `/contato` atual promete hoje, de
graça, exatamente a entrega do Discovery pago — *"Mapeamento inicial da
operação · Identificação de gargalos · Sugestão de automações possíveis ·
Priorização por impacto e complexidade · Roadmap de implantação · Proposta para
execução"* (`OBSERVADO`, docs/08 §6 UX-01). Seis dos nove itens de entrega do
Discovery estão nessa lista. A Fase 3 precisa mover esses itens para a oferta
paga.

### `PENDENTE 1.1` — exibir preço no site?

A proposta define a faixa **internamente**. Ela **não** decide se R$ 1,5 mil–
R$ 5 mil vai publicado na página. Bloqueia a redação final da Fase 3.

---

## 2. Operação Gerenciada

`APROVADO` — proposta, seção 7.

**Problema que resolve:** a automação foi implantada, mas precisa de
monitoramento e evolução.

**Modelo:** **MRR** (recorrência).

**Conexão:** todos os serviços.

**Prioridade:** Alta.

**Justificativa estratégica, na proposta:** melhora o LTV e torna a RC2 menos
dependente apenas de projetos.

### Entrega (transcrição literal da proposta)

- monitoramento
- alertas
- correções
- backups
- observabilidade
- revisão de workflows
- manutenção de integrações
- análise de consumo
- evolução

### Estado atual

`OBSERVADO` — **0 ocorrências** de "Operação Gerenciada" em `src/`
(docs/08 §7). A oferta de maior valor recorrente não existe no site.

### `PENDENTE 2.1` — formato de apresentação

Página própria, seção dentro de `/solucoes`, ou ambas? A proposta define a
oferta, não o seu lugar na arquitetura. Bloqueia a Fase 5.

### `PENDENTE 2.2` — modelo de preço

A proposta diz "MRR" sem faixa, ao contrário do Discovery. Bloqueia qualquer
copy que mencione valor.

---

## 3. Fronteira RC2 × Zapbox

`APROVADO` — proposta, seção 8.

> Zapbox deve assumir tudo que for:
> **WhatsApp + equipe + atendimento + vendas + CRM + Sales AI.**
>
> A RC2 não deveria competir com o próprio produto.

### Divisão de territórios

| Marca | Território |
|---|---|
| **RC2** | Automação de Processos · Integração de Sistemas · IA para Operações · Operações Digitais & Commerce |
| **Zapbox** | WhatsApp · equipe/atendimento · vendas · CRM · Sales AI |
| **Agenda Confirmada** | clínicas · agenda · confirmações · lembretes |

### Presença do Zapbox definida pela proposta

| Local | Tratamento aprovado |
|---|---|
| Header | **Zapbox ↗** — link direto para `zapbox.cloud` |
| Footer | seção **Produto** → "Zapbox — Atendimento e vendas pelo WhatsApp" |
| Home | seção **"Produto criado pela RC2"** → Zapbox |

`OBSERVADO` — hoje o Zapbox tem **0 ocorrências** em `src/` (docs/08 §7).

### Páginas do Zapbox — questão #3 da docs/08 §19: **RESOLVIDA**

`OBSERVADO` — verificado em 2026-08-30, todas respondendo 200:

| URL | Title |
|---|---|
| `zapbox.cloud/` | Zapbox \| Atendimento em equipe pelo WhatsApp |
| `zapbox.cloud/automacoes` | Automação de Atendimento e Vendas \| Zapbox |
| `zapbox.cloud/crm-vendas` | CRM para WhatsApp e Gestão de Vendas \| Zapbox |
| `zapbox.cloud/integracoes` | Integrações WhatsApp, CRM e ERP \| Zapbox |
| `zapbox.cloud/sales-ai` | Sales AI para WhatsApp \| Zapbox |

**O produto tem páginas equivalentes.** A regra de `rc2-site-migration` — *"URLs
relacionadas a WhatsApp só migram para o Zapbox quando houver página equivalente
no produto"* — deixa de ser um bloqueio absoluto.

### Candidatos de destino — a confirmar por conteúdo

`PENDENTE 3.1` — o mapeamento abaixo é **hipótese derivada de títulos**, não
decisão. Cada linha exige leitura do conteúdo das duas pontas antes de virar
301, conforme o checklist de 7 passos da skill.

| URL RC2 (território Zapbox) | Candidato | Confiança |
|---|---|---|
| `/solucoes/whatsapp-desorganizado` | `zapbox.cloud/` | média |
| `/solucoes/atendimento-lento` | `zapbox.cloud/` | média |
| `/solucoes/leads-sem-resposta` | `zapbox.cloud/crm-vendas` ou `/sales-ai` | **baixa** |
| `/servicos/automacoes-com-ia` | `zapbox.cloud/automacoes` | média |

Nenhuma dessas URLs pode ser redirecionada nesta fase. Bloqueia a Fase 6.

---

## 4. Vocabulário aprovado — insumo da Fase 2

`APROVADO` — `AGENTS.md` + proposta.

**CTA principal:** "Falar sobre minha operação" → `/contato`.

| Contexto | CTA aprovado |
|---|---|
| Home, `/solucoes`, CTA final | Falar sobre minha operação |
| Header | Falar com a RC2 |
| `/sobre` | Conversar com a RC2 |
| `/contato` | Agendar conversa de diagnóstico |
| Automação de Processos | Mapear um processo |
| Integração de Sistemas | Quero integrar meus sistemas |
| IA para Operações | Explorar IA na operação |
| Zapbox | Conhecer Zapbox (link externo) |
| Agenda Confirmada | Ver Agenda Confirmada |

**Descontinuados**, proibidos como CTA vigente: "Solicitar diagnóstico" ·
"Diagnóstico gratuito".

`OBSERVADO` — os 8 pontos que a Fase 2 precisa tratar (docs/08 §7), incluindo
`Header.tsx` (2×), o default de `CTABlock.tsx`, o submit de `ContactForm.tsx` e
o default do CMS em `CtaTab.tsx` — este último com a frase literalmente
proibida *"Solicitar Diagnóstico Gratuito →"*.

A palavra "diagnóstico" **continua válida** para descrever a conversa inicial e
como etapa do método em `/sobre`. O que está proibido é seu uso **como CTA**.

---

## 5. Dependências consolidadas

| ID | Pendência | Bloqueia | Quem decide |
|---|---|---|---|
| 1.1 | Publicar a faixa de preço do Discovery? | Fase 3 | negócio |
| 2.1 | Operação Gerenciada: página, seção ou ambas? | Fase 5 | negócio |
| 2.2 | Modelo/faixa de preço da Operação Gerenciada | Fase 3/5 | negócio |
| 3.1 | Mapeamento 1:1 das 4 URLs → páginas Zapbox | Fase 6 | análise de conteúdo + SEO |
| 3.2 | Histórico orgânico das URLs a migrar | Fase 6 | Search Console |

Herdadas de docs/08 §19, **não** resolvidas nesta fase por não serem
comerciais: slug corrompido do blog (#1), `FloatingWhatsApp` (#2), qual URL
sobrevive entre `/servicos` e `/solucoes` (#4), Ahrefs (#5), Meta Pixel (#6),
URL de `/avaliacoes` (#7), alvo de 44px do menu (#9).

**O que está destravado:** a Fase 2 (vocabulário) **não depende de nenhuma
pendência acima** — os CTAs aprovados estão integralmente definidos na seção 4.

---

## 6. Critérios de aceite desta fase

- [x] Discovery Operacional definido, com entrega e modelo, citando a fonte
- [x] Operação Gerenciada definida, com entrega e modelo, citando a fonte
- [x] Fronteira RC2 × Zapbox declarada, com a presença aprovada por local
- [x] Existência de páginas equivalentes no Zapbox verificada (questão #3)
- [x] Vocabulário de CTA consolidado como insumo da Fase 2
- [x] Pendências marcadas em vez de fabricadas
- [x] Nenhuma alteração em `src/`, rota, copy publicada ou banco
- [x] Nenhum claim, número ou case inventado

---

## 7. Próxima fase

**Fase 2 — vocabulário.** Substituir os CTAs descontinuados pelos aprovados nos
8 pontos mapeados, incluindo o default do CMS.

Está destravada: não depende de nenhuma pendência da seção 5.

Restrição herdada da Fase 0, a proteger como baseline: canonical da home em
`www`, self-canonical das internas, `noindex,nofollow` das legais, ausência de
overflow horizontal em 768px, os 8 campos `required`, honeypot opcional e o
fluxo Zod/RHF.
