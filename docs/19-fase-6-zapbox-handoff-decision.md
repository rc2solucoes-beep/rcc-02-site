# Fase 6 — Handoff RC2 → Zapbox e fronteira entre as ofertas — Decisão

> **Decisão comercial e arquitetural. Não é implementação.** Nenhum arquivo em
> `src/`, redirect, sitemap, robots, `llms.txt`, analytics, banco ou
> propriedade do Zapbox foi alterado. A rota `/solucoes/agenda-confirmada`
> **não** foi criada.
>
> Fecha **CD-1** e **CD-3**. **CD-2 permanece `DEFER`.**

**Baseline:** `main @ 2a0d67f` · Fases 0 a 5 publicadas · migração SEO SAFE_NOW
publicada · higiene editorial da Fase 6 concluída (PRs #19 e #20).

| Marca | Significado |
|---|---|
| `OBSERVED` | Verificado nesta tarefa, no código, em Production ou em `zapbox.cloud`. |
| `APPROVED` | Consta em fonte oficial citada. |
| `INFERRED` | Decisão de design deste documento. |
| `COMMERCIAL_DECISION_REQUIRED` | Falta autoridade; não inferida aqui. |
| `DEFERRED` | Adiado, com condição de desbloqueio explícita. |

**Convenção de sitemap:** sempre **PRESENTE no sitemap** ou **AUSENTE do
sitemap**. A forma curta está proibida neste documento.

---

## 1. Objetivo

Responder duas perguntas que bloqueiam as unidades seguintes da Fase 6:

- **CD-1** — como o visitante do site RC2 é conduzido ao Zapbox?
- **CD-3** — onde termina o território da RC2 e começa o do Zapbox?

---

## 2. Achado que reorienta a análise

`OBSERVED` — auditando `zapbox.cloud` nesta tarefa, encontrei o que
`docs/18` não tinha registrado:

| Evidência | Local |
|---|---|
| **"Zapbox by RC2 Soluções"** em texto, com link para `https://www.rc2solucoes.com.br` | rodapé de `zapbox.cloud` |
| `"parentOrganization": { "@type": "Organization", "name": "RC2 Soluções" }` | JSON-LD do produto |
| `<meta name="publisher" content="RC2 Soluções">` | metadata |
| **`contato@rc2solucoes.com.br`** como e-mail de contato do produto | rodapé |
| Planos e preços publicados (ex.: "Usuários adicionais: R$ 30,00/cada") | página de planos |

**Consequências diretas:**

1. **A atribuição de marca já é pública e bidirecional.** O visitante que sai
   da RC2 para o Zapbox **não** cai numa marca desconhecida: o destino se
   identifica como RC2. Isso **enfraquece** o risco R-3 registrado em
   `docs/18` ("handoff de marca abrupto").
2. **O Zapbox é destino comercial autossuficiente** — tem planos, preços e
   fluxo próprio de conversão. Uma landing comercial equivalente no domínio
   RC2 seria **competing page**, não complemento.
3. **O canal de contato é compartilhado**, o que remove ambiguidade
   operacional básica sobre quem recebe o lead.

`INFERRED` — isso **derruba o principal argumento emocional** a favor da ponte
(“não largar o usuário”) e obriga a decidir CD-1 por critérios mais duros:
sinal orgânico, mensuração e reversibilidade.

---

## 3. CD-3 — Fronteira RC2 × Zapbox

### 3.1 Fundamento nas fontes

`APPROVED` — `RC2_PROPOSTA_ATUALIZACAO.txt`:

> *"o **Zapbox passou a ter o direito natural de ocupar o território de
> atendimento e vendas pelo WhatsApp**. Portanto, a RC2 deve subir um nível."*

E, na mesma fonte, o roteamento por problema:

> *"Problema E — WhatsApp → Oferta padronizada: **Zapbox**"*

`APPROVED` — `AGENTS.md`: *"A RC2 não deve competir com seu próprio produto.
Não crie na RC2 oferta que duplique o território do Zapbox."*

### 3.2 Validação do território RC2 candidato

| Item candidato | Veredicto | Fonte |
|---|---|---|
| processos operacionais · automação de workflows | **APPROVED** | `AGENTS.md` (competência 1) |
| sistemas · APIs · integrações · ERP | **APPROVED** | `AGENTS.md` (competência 2) |
| dados | **APPROVED** | `AGENTS.md` §Operações Digitais & Commerce |
| observabilidade · sustentação técnica | **APPROVED** | `docs/11` — Operação Gerenciada |
| IA aplicada à operação interna | **APPROVED** | `AGENTS.md` (competência 3) |
| arquitetura técnica | **SUPPORTED** | proposta §16; Discovery Operacional (`docs/11`) |
| **integração entre Zapbox e outros sistemas** | **APPROVED** | `docs/14` §5.8 — "as integrações entre o Zapbox e os demais sistemas podem entrar no acompanhamento técnico da RC2 — o fluxo entre as plataformas, não o atendimento que roda dentro delas" |
| atendimento cotidiano · operação comercial diária | **REJECTED** como serviço RC2 | `AGENTS.md`; `docs/14` §5.8 |
| conversas no WhatsApp · gestão cotidiana de CRM | **REJECTED** | idem |
| operação da equipe de vendas · Sales AI | **REJECTED** | idem |

Nenhum item candidato foi rejeitado por falta de fonte. A definição proposta é
sustentada integralmente.

### 3.3 Validação do território Zapbox candidato

`OBSERVED` em `zapbox.cloud` — cada item tem página própria:

| Item | Evidência |
|---|---|
| WhatsApp · conversas · atendimento · equipe | `/` — "Transforme seu WhatsApp em uma operação organizada" |
| leads · vendas · CRM comercial · pipeline | `/crm-vendas` — "Do WhatsApp para o pipeline" |
| Sales AI | `/sales-ai` — "IA que atende. Qualifica. E sabe quando chamar uma pessoa." |
| automações ligadas ao fluxo conversacional/comercial | `/automacoes` |
| integrações **a partir do** Zapbox | `/integracoes` |

Nenhuma capacidade foi inventada; todas constam do site do produto.

### 3.4 A regra `CHANNEL_AND_OBJECT` resolve os casos?

`INFERRED` — testada contra 15 casos reais (§3.5). **Resolve 13 diretamente.**
Os outros 2 caem numa fronteira compartilhada que a regra **precisa nomear**,
não evitar. Com essa ressalva incorporada, a regra é suficiente.

O critério operante é **o objeto principal do trabalho**, não o vocabulário —
porque, como `docs/18` §5.1 registrou, as duas marcas usam taglines quase
idênticas para automação e integração.

### 3.5 Casos de fronteira

| # | Caso | Dono | Justificativa |
|---|---|---|---|
| 1 | Responder automaticamente um lead no WhatsApp | **ZAPBOX** | objeto = conversa, no canal do produto |
| 2 | Qualificar lead | **ZAPBOX** | objeto = lead; é Sales AI |
| 3 | Distribuir conversa entre atendentes | **ZAPBOX** | objeto = conversa e equipe de atendimento |
| 4 | Registrar negócio no CRM | **ZAPBOX** | objeto = pipeline comercial |
| 5 | Sincronizar Zapbox com ERP | **SHARED_BOUNDARY** | a plataforma expõe; a **integração técnica é RC2** quando contratada (`docs/14` §5.8) |
| 6 | Enviar pedido aprovado para o financeiro | **RC2** | objeto = processo de retaguarda |
| 7 | Consumir webhook do Zapbox | **RC2** | objeto = fluxo entre sistemas |
| 8 | Criar dashboard operacional | **RC2** | objeto = dados da operação |
| 9 | Automatizar faturamento | **RC2** | objeto = processo interno |
| 10 | Agente interno que consulta sistemas | **RC2** | IA para Operações; sem canal comercial |
| 11 | Revisar workflow n8n | **RC2** | objeto = workflow |
| 12 | Monitorar integração Zapbox ↔ ERP | **RC2** | Operação Gerenciada (`docs/11`) |
| 13 | Operar as vendas do cliente | **OUT_OF_SCOPE** | nem RC2 nem Zapbox — **é do cliente** |
| 14 | Configurar regras comerciais no Zapbox | **SHARED_BOUNDARY** | configuração do produto; o cliente opera, a RC2 pode implantar em projeto |
| 15 | Evoluir integração após mudança de API | **RC2** | sustentação técnica |

**Descoberta:** os casos 13 e 14 revelam uma **quarta parte** que a fronteira
original de duas colunas não previa — **o cliente**. Sem nomeá-lo, "operar as
vendas" ficaria implicitamente atribuído a alguém. `docs/14` §5.8 já afirma que
"o cliente opera o negócio"; a regra final incorpora isso.

### 3.6 Decisão CD-3 — regra operacional

`INFERRED` — **`CHANNEL_AND_OBJECT`, com quatro donos**. Texto curto, pronto
para ser copiado depois para `AGENTS.md` e `PRODUCT.md`:

```
ZAPBOX OWNS
  O canal e o funil: conversa, WhatsApp, atendimento, equipe de atendimento,
  lead, CRM comercial, pipeline, Sales AI e as automações que acontecem
  dentro desse fluxo.

RC2 OWNS
  O processo e os sistemas: workflows, automação de retaguarda, integrações,
  APIs, ERP, dados, observabilidade, IA aplicada à operação interna,
  arquitetura e sustentação técnica.

SHARED BOUNDARY
  A ligação entre os dois mundos. A integração Zapbox ↔ demais sistemas é
  implantada e sustentada pela RC2 quando contratada — o fluxo ENTRE as
  plataformas, nunca a operação que roda DENTRO delas.

CLIENT OWNS
  A operação cotidiana do próprio negócio: atender, vender, aprovar,
  faturar, decidir.

CRITÉRIO DE DESEMPATE
  Pergunte qual é o OBJETO principal do trabalho, não o vocabulário.
  Se o objeto é uma conversa, um lead ou uma venda → Zapbox.
  Se o objeto é um processo, um sistema ou um dado → RC2.
```

---

## 4. CD-1 — Modelos de handoff

### 4.1 Pontuação comparativa

`INFERRED` — escala 1–5, sem precisão financeira inventada:

| Critério | A · Bridge | B · Redirect externo | C · Landings RC2 | D · Híbrido |
|---|---|---|---|---|
| Clareza de marca | 5 | **4** | 2 | 3 |
| Experiência do usuário | 4 | 4 | 3 | 3 |
| **Reversibilidade** | **5** | **1** | 5 | 2 |
| SEO | 4 | 2 | 3 | 3 |
| **Analytics** | **5** | **2** | 4 | 3 |
| Manutenção | 3 | 5 | 1 | 2 |
| Dependência externa | 4 | 2 | 4 | 3 |
| Consistência com a arquitetura RC2 | 4 | 4 | 1 | 3 |
| Velocidade de execução | 3 | 5 | 2 | 3 |
| Risco | 5 | 2 | 2 | 3 |
| **Total** | **42** | **31** | **27** | **28** |

Note que **B pontua bem em clareza de marca (4)** — precisamente por causa do
achado da §2. A diferença não está aí, e sim em **reversibilidade, analytics e
risco**, onde B é estruturalmente fraco.

### 4.2 Por que cada alternativa foi rejeitada

**B — `DIRECT_EXTERNAL_REDIRECT`.** Rejeitado por três motivos objetivos:

1. **Irreversível na prática.** Um `308` permanente entra em cache de
   navegador e de crawler; `git revert` restaura código, não o processamento
   externo. É a mesma advertência que governou a migração SAFE_NOW, agravada
   por ser cross-domain.
2. **Não se mede o que não se renderiza.** Um redirect não gera evento de
   clique. Hoje **já não há nenhum link editorial** para o Zapbox nessas
   páginas (`docs/18` §3.1) — as 3 referências por página vêm do Footer e do
   schema. Redirecionar direto significa **passar de "não medimos" para
   "nunca poderemos medir"**.
3. **Transfere sinal de 4 URLs indexadas** para um domínio que este
   repositório não versiona: se uma rota do Zapbox mudar, o redirect quebra e
   nada aqui avisa.

**C — `KEEP_RC2_LANDINGS`.** Rejeitado por violar `AGENTS.md`: manter páginas
comerciais completas para o território do produto é **competir com o próprio
produto**. Agravado pelo achado da §2 — o Zapbox tem planos e preços próprios;
duplicar geraria competing pages e manutenção dupla.

**D — `HYBRID`.** Rejeitado por ausência de motivo: as quatro URLs de
território Zapbox têm a **mesma natureza** (conversa/lead/atendimento) e a
mesma equivalência comprovada em `docs/18` §9. Tratar algumas de um jeito e
outras de outro criaria inconsistência sem ganho.

### 4.3 Decisão CD-1

`INFERRED` — **`BRIDGE_FIRST`**, com uma correção importante ao desenho
esboçado em `docs/18`:

> **Uma única ponte**, e não quatro páginas-ponte.

`docs/18` §10.2 sugeria converter as 4 URLs em páginas de transição. Isso
significaria manter quatro superfícies quase idênticas. A forma correta é:

1. criar **uma** página de ponte no domínio RC2;
2. as quatro URLs de território Zapbox migram para ela por **redirect
   interno** — `rc2solucoes.com.br` → `rc2solucoes.com.br`, **1 salto,
   reversível**, sem transferir sinal para fora;
3. a ponte encaminha ao destino específico do Zapbox, com **clique
   instrumentado**;
4. o redirect **externo** permanente só é reavaliado depois, com dados (§8).

Isso consolida o sinal em uma URL do próprio domínio, cria o ponto de medição
que hoje não existe e mantém tudo reversível.

---

## 5. A ponte

### 5.1 O que ela é — e o que não é

`INFERRED` — estrutura aprovada:

| # | Bloco |
|---|---|
| 1 | contexto RC2 — o problema operacional que o visitante trouxe |
| 2 | o reconhecimento de que esse território tem solução dedicada |
| 3 | **identificação explícita: "Zapbox é um produto da RC2"** |
| 4 | resumo curto do produto — o suficiente para decidir, não para comparar |
| 5 | CTA externo para a rota específica do Zapbox |
| 6 | sinalização clara de que o destino é outro domínio |
| 7 | saída para as competências RC2, para quem chegou por engano |

**Proibido** na ponte: lista completa de features · preços · planos ·
documentação técnica · formulário próprio · qualquer conteúdo que exista para
ser comparado com o site do produto. **A ponte roteia; ela não vende.**

### 5.2 URL

`INFERRED` — **`/zapbox`**.

| Candidata | Veredicto |
|---|---|
| **`/zapbox`** | **escolhida** — curta, inequívoca, não colide com nada, não cria categoria prematura |
| `/solucoes/zapbox` | rejeitada — `/solucoes/<slug>` é o namespace das páginas legadas por dor, e o Zapbox **não é competência RC2**; colocá-lo ali contradiz a Fase 5 |
| `/produtos/zapbox` | rejeitada agora — ver §6 |
| reutilizar URL legada | rejeitada — nenhuma das quatro é neutra; todas carregam enquadramento por dor |

### 5.3 SEO da ponte

`INFERRED` — **`INDEXABLE`**, com `index, follow` e canonical própria.

Justificativa: a ponte **receberá o sinal** das quatro URLs migradas. Marcá-la
`noindex` mataria exatamente aquilo que a decisão de não redirecionar para fora
pretende preservar. Além disso, ela tem conteúdo próprio legítimo — o
enquadramento RC2 e a fronteira de território — que não existe em `zapbox.cloud`.

| Item | Definição |
|---|---|
| canonical | `https://www.rc2solucoes.com.br/zapbox` |
| robots | `index, follow` |
| sitemap | **PRESENTE no sitemap**, quando publicada |
| schema | `WebPage`. **Não** usar `Product` nem `Offer` — a RC2 não publica preço do produto no seu domínio |
| internal links | Home, Footer, e a fronteira em `/solucoes#ia-para-operacoes` |

---

## 6. Arquitetura de produtos

**Pergunta:** o site precisa de uma categoria explícita `/produtos`?

`INFERRED` — **ainda não.** Motivos:

1. Há **um** produto com domínio externo (Zapbox) e **um** que ainda não tem
   rota nem definição (Agenda Confirmada, `DEFER`).
2. A skill `rc2-site-migration` já prevê a Agenda Confirmada em
   **`/solucoes/agenda-confirmada`** — criar `/produtos/` agora obrigaria a
   reabrir essa decisão sem necessidade.
3. Uma categoria com um item só é hierarquia prematura.

**Reavaliar quando** a Agenda Confirmada tiver rota definida (`CD-2`). Se as
duas convergirem para um namespace comum, `/produtos` passa a fazer sentido —
e `/zapbox` pode receber um redirect interno na ocasião, a custo baixo.

---

## 7. Superfícies

### 7.1 Header

`INFERRED` — **A: não aparece.** O Header tem quatro itens por decisão da Fase
5; produto não é competência, e um submenu "Produtos" para um item só
adicionaria peso de navegação sem ganho. Reavaliável junto com §6.

### 7.2 Footer

`INFERRED` — **manter como está.** A linha "Produto → Zapbox" já existe e
aponta para `zapbox.cloud`. Quando a ponte for publicada, **passa a apontar
para `/zapbox`** — link interno, mensurável, e o `location: "footer_produto"`
é preservado, mudando só o `destination`.

Espaço para a Agenda Confirmada fica reservado, **sem ser criado agora**.

### 7.3 Home

`INFERRED` — a seção de produtos permanece. Quando a ponte existir, o CTA
"Conhecer Zapbox" passa a apontar para **`/zapbox`** em vez de
`zapbox.cloud`; `location: "home_products"` e `label: "conhecer_zapbox"`
**preservados**, muda só o `destination`.

A Home **já** afirma que o Zapbox é "Produto próprio da RC2" — não precisa de
texto novo.

### 7.4 `/solucoes`

`INFERRED` — papel inalterado. A fronteira em `#ia-para-operacoes` já declara o
território e já linka para o produto. Quando a ponte existir, esse link passa a
apontar para `/zapbox`. **As quatro competências não mudam.**

O Zapbox é citado **apenas** quando o problema é conversacional — nunca como
quinta competência.

### 7.5 `/contato`

`INFERRED` — **triagem leve, sem transformar o contato em suporte do produto.**

O formulário permanece como está: nem campo novo, nem fluxo novo, nem alteração
no Discovery. O que muda é apenas uma linha de orientação — quando o problema é
WhatsApp, atendimento ou vendas, o caminho é o Zapbox.

`OBSERVED` — o e-mail de contato do Zapbox **é o mesmo da RC2**
(`contato@rc2solucoes.com.br`), então um lead que chegar por engano não se
perde. Isso reduz a urgência dessa mudança: é melhoria, não correção.

---

## 8. Disposição por URL

`INFERRED` — sob a decisão `BRIDGE_FIRST`:

| URL | Papel hoje | Papel com a ponte | Destino externo final | Elegível a redirect externo? | Momento |
|---|---|---|---|---|---|
| `/servicos/automacoes-com-ia` | página legada, 200, **PRESENTE no sitemap** | redirect **interno** → `/zapbox` | `zapbox.cloud/sales-ai` | **não por ora** | após a ponte + observação |
| `/servicos/automacao-de-atendimento` | alias 308 → `automacoes-com-ia` | **reapontar** → `/zapbox`, 1 salto | — | n/a (alias) | **junto** com a URL acima |
| `/solucoes/atendimento-lento` | 200, **PRESENTE no sitemap** | redirect **interno** → `/zapbox` | `zapbox.cloud/sales-ai` | **não por ora** | após a ponte |
| `/solucoes/leads-sem-resposta` | 200, **PRESENTE no sitemap** | redirect **interno** → `/zapbox` | `zapbox.cloud/crm-vendas` | **não por ora** | após a ponte |
| `/solucoes/whatsapp-desorganizado` | 200, **PRESENTE no sitemap** | redirect **interno** → `/zapbox` | `zapbox.cloud/` | **não por ora** | após a ponte |
| `/solucoes-com-ia` | 200, **PRESENTE no sitemap**, intenção dividida | **`SPLIT_INTENT`** — ver §9 | — | **não** | — |

**Regra de sitemap mantida:** cada URL só sai do sitemap **na mesma unidade** em
que deixa de ser 200 + indexável + canônica. Quando as quatro migrarem para a
ponte, saem do sitemap e a ponte entra.

`OBSERVED` — o alias `/servicos/automacao-de-atendimento` **precisa viajar
junto**: se `automacoes-com-ia` migrar sozinha, o alias vira chain de 2 saltos.
É a mesma regra que salvou dois aliases na Fase 5.

---

## 9. `/solucoes-com-ia`

`APPROVED` (`docs/18` §7) — **`SPLIT_INTENT` preservado.** Metade da intenção é
RC2 operacional, metade é comercial/Zapbox. **Nenhum 308 global é aprovado** —
nem para `zapbox.cloud`, nem para `/solucoes#ia-para-operacoes`.

Das opções da tarefa, a decisão é **B: virar página de orientação/triagem.**

`INFERRED` — a página permanece 200 e **PRESENTE no sitemap**, com conteúdo
reescrito e curto, cuja única função é separar as duas intenções:

| Intenção do visitante | Encaminhamento |
|---|---|
| **`RC2_OPERATIONAL_AI`** — agentes internos, documentos, classificação, governança | `/solucoes#ia-para-operacoes` |
| **`ZAPBOX_COMMERCIAL_AI`** — atendimento, qualificação de leads, follow-up, vendas | `/zapbox` |

Por que não a opção C (absorver e remover): os dois destinos já contêm o
conteúdo; o que falta não é conteúdo, é **roteamento**. E a URL tem histórico
orgânico próprio para "soluções com IA", que uma remoção descartaria.

---

## 10. Analytics do handoff

`INFERRED` — contrato definido antes da implementação. **Evento único
`cta_click`; nenhum event kind novo.**

| Superfície | Situação | Location | Label | Destination |
|---|---|---|---|---|
| Home — produtos | **`PRESERVE_EXISTING`** | `home_products` | `conhecer_zapbox` | muda para `/zapbox` |
| Footer — produto | **`PRESERVE_EXISTING`** | `footer_produto` | `conhecer_zapbox` | muda para `/zapbox` |
| Ponte — CTA externo | **`NEW_SURFACE_REQUIRED`** | `zapbox_bridge` | slug da rota de destino | `zapbox.cloud/<rota>` |
| Ponte — saída para competências RC2 | **`NEW_LOCATION`** | `zapbox_bridge` | slug da âncora | `/solucoes#<âncora>` |
| `/solucoes-com-ia` — triagem | **`NEW_LOCATION`** | `ai_routing` | `ia_para_operacoes` / `zapbox` | destino correspondente |
| Fronteira em `#ia-para-operacoes` | **`NEW_SURFACE_REQUIRED`** | `solutions_ia_boundary` | `conhecer_zapbox` | `/zapbox` |
| Páginas migradas (`service_detail_*`, `solution_detail_*`, related, navigation) | **`SOURCE_PAGE_SERIES_ENDED`** | — | — | quando redirecionarem |

**Ganho central:** hoje o clique de saída para o Zapbox **não é medido em lugar
nenhum** — as páginas de território não têm link editorial para o produto. A
ponte cria esse ponto de medição. **Nenhum identificador histórico é
reutilizado com novo significado.**

---

## 11. Responsabilidade comercial

`OBSERVED` — o que as evidências permitem afirmar:

| Pergunta | Resposta | Base |
|---|---|---|
| O Zapbox é apresentado como produto da RC2? | **Sim, publicamente nos dois domínios** | rodapé e `parentOrganization` em `zapbox.cloud`; Home e Footer da RC2 |
| O produto tem modelo comercial próprio? | **Sim** — planos e preços publicados | `zapbox.cloud` |
| O site RC2 pode receber lead de Zapbox? | **Sim, e já recebe** — o e-mail de contato é o mesmo | `contato@rc2solucoes.com.br` nos dois sites |
| Suporte é apresentado por qual marca? | **Zapbox**, no próprio domínio | `zapbox.cloud` |

**`COMMERCIAL_DECISION_REQUIRED` (`CD-4`)** — nenhuma fonte responde:

- com **qual entidade** o cliente contrata a assinatura do Zapbox;
- se um projeto RC2 pode **incluir** a assinatura, ou se são contratos
  separados;
- se existe comissionamento ou repasse quando a RC2 origina o lead.

**Isso não bloqueia CD-1 nem a ponte** — a ponte roteia, não vende nem cobra.
Bloqueia apenas eventual copy que fale de contratação conjunta.

---

## 12. Responsabilidade técnica

`APPROVED` — confirmado contra `docs/11` §Operação Gerenciada e `docs/14` §5.8:

| Parte | Responsabilidade |
|---|---|
| **Zapbox** | o produto e a plataforma — canal, conversas, CRM comercial, Sales AI |
| **RC2** | projetos de integração ao redor do produto, quando contratados; arquitetura; sustentação técnica |
| **Cliente** | a operação cotidiana do próprio negócio |
| **Operação Gerenciada** | pode sustentar integrações Zapbox ↔ sistemas **quando incluídas no escopo** — o fluxo entre as plataformas, não o atendimento dentro delas |

Nada aqui é novo: é a arquitetura da Fase 3 confirmada, agora com a fronteira
explícita da §3.6.

---

## 13. Claims por marca

| Claim | RC2 | Zapbox | Ambos | Proibido | Evidência |
|---|---|---|---|---|---|
| automação de processos e workflows | ✅ | — | — | — | `AGENTS.md` |
| automação dentro do fluxo conversacional | — | ✅ | — | — | `zapbox.cloud/automacoes` |
| integração entre sistemas, ERP, APIs | ✅ | — | — | — | `AGENTS.md` |
| integrações a partir do Zapbox | — | ✅ | — | — | `zapbox.cloud/integracoes` |
| IA aplicada à operação interna | ✅ | — | — | — | `AGENTS.md` |
| IA de atendimento e qualificação | — | ✅ | — | — | `zapbox.cloud/sales-ai` |
| WhatsApp como canal de atendimento/vendas | — | ✅ | — | — | proposta; `AGENTS.md` |
| CRM comercial · pipeline | — | ✅ | — | — | `zapbox.cloud/crm-vendas` |
| Sales AI | — | ✅ | — | — | idem |
| redução de trabalho manual | — | — | ✅ | — | ambos, **sem número** |
| "produto próprio da RC2" | — | — | ✅ | — | rodapé do Zapbox; Home da RC2 |
| **"chatbot"** | — | — | — | ❌ | `AGENTS.md` — o termo é "agente de IA" |
| qualquer métrica de resultado sem documentação | — | — | — | ❌ | `AGENTS.md` |
| preços do Zapbox no domínio RC2 | — | — | — | ❌ | `INFERRED` — evita duplicação e desatualização |

---

## 14. Critérios para o redirect externo futuro

`INFERRED` — uma URL só se torna elegível a `308` para `zapbox.cloud` quando
**todos** forem verdadeiros:

1. equivalência de intenção comprovada (já feita em `docs/18` §9 para as quatro);
2. ponte publicada e estável;
3. links internos versionados já apontando para a ponte;
4. analytics do handoff funcionando, com volume observado;
5. Search Console revisado para a URL de origem;
6. backlinks conhecidos;
7. rota de destino no Zapbox estável e verificada;
8. **`OBSERVATION_PERIOD_REQUIRED`** — período de observação cumprido.

**Não fixo duração**: não há base para escolher 30, 60 ou 90 dias. O critério é
**dado suficiente para comparar** o volume da ponte antes e depois, e essa
decisão é de quem responde pelo negócio.

`INFERRED` — vale registrar que, com o redirect **interno** para a ponte, o
externo pode simplesmente **nunca ser necessário**: a ponte já consolida o
sinal, roteia o usuário e mede o clique. O redirect externo passa a ser
otimização, não requisito.

---

## 15. Dependências de dados

| Classe | Itens |
|---|---|
| **`NO_DATA_REQUIRED`** | CD-3 completo · decisão CD-1 · arquitetura e URL da ponte · indexabilidade · contrato de analytics · disposição do `/solucoes-com-ia` · Header, Footer, Home, `/solucoes` |
| **`SEARCH_CONSOLE_REQUIRED`** | redirect externo das quatro URLs · dimensionar a perda potencial |
| **`BACKLINK_DATA_REQUIRED`** | quanto sinal externo seria transferido em cada URL |
| **`COMMERCIAL_DECISION_REQUIRED`** | `CD-2` (Agenda Confirmada) · `CD-4` (contrato e comissionamento) |

**Toda a Fase 6 até a ponte avança sem dado externo.**

---

## 16. Bloqueadores remanescentes

| ID | Decisão | Status | Bloqueia |
|---|---|---|---|
| **CD-1** | handoff RC2 → Zapbox | ✅ **FECHADA** — `BRIDGE_FIRST` | — |
| **CD-3** | fronteira RC2 × Zapbox | ✅ **FECHADA** — `CHANNEL_AND_OBJECT`, quatro donos | — |
| **CD-2** | natureza da Agenda Confirmada | **`DEFER`** | rota `/solucoes/agenda-confirmada` |
| **CD-4** | contrato e comissionamento do Zapbox | **`COMMERCIAL_DECISION_REQUIRED`** *(novo)* | apenas copy de contratação conjunta |

**CD-2 permanece `DEFER`**, com as três lacunas inalteradas: **base técnica**
(roda sobre o Zapbox?), **integração com o sistema da clínica** e **estágio
real do produto**.

`CD-4` é **novo**, descoberto na §11, e **não bloqueia** nenhuma unidade
planejada.

---

## 17. Unidades seguintes da Fase 6

`INFERRED` — derivadas das decisões acima:

| Unidade | Escopo | Depende de | Pode começar? |
|---|---|---|---|
| **6D — Ponte `/zapbox`** | criar a rota, metadata, schema, analytics `zapbox_bridge`, sitemap | CD-1 ✅ CD-3 ✅ | **sim** |
| **6E — Superfícies e links** | Home, Footer e a fronteira de `#ia-para-operacoes` passam a apontar para `/zapbox`; `destination` muda, `location` e `label` preservados | 6D | não |
| **6F — `/solucoes-com-ia` como triagem** | reescrever como roteamento de intenção | 6D | não |
| **6G — Migração interna** | as 4 URLs + o alias → `/zapbox`, com sitemap e links internos na mesma unidade | 6D, 6E, 6F | não |
| **6H — Observação** | medir a ponte; só então reavaliar redirect externo | 6G | não |
| **6I — Agenda Confirmada** | responder CD-2 e criar a rota | CD-2 | **não** |

**6D é a única que pode começar imediatamente.**

---

## 18. Riscos

| # | Risco | Mitigação |
|---|---|---|
| R-1 | A ponte virar uma segunda landing do Zapbox | §5.1 lista o que é proibido nela; sem preços, sem features completas |
| R-2 | Duplicação de conteúdo entre `/zapbox` e `zapbox.cloud` | ponte curta, com conteúdo próprio (enquadramento e fronteira), sem `Product`/`Offer` schema |
| R-3 | Migrar as 4 URLs antes da ponte existir | ordem 6D → 6E → 6F → 6G é obrigatória |
| R-4 | Chain pelo alias `automacao-de-atendimento` | viaja na mesma unidade que o seu destino |
| R-5 | Perder o lookup reverso de `relatedServices` (`docs/18` §14.2) | teste-guarda obrigatório, como na Fase 5 |
| R-6 | Sitemap publicando URL que redireciona | regra da §8, com o mecanismo já implantado na Fase 5 |
| R-7 | Rota do Zapbox mudar e quebrar o CTA da ponte | com ponte, o impacto é um link quebrado — não um redirect quebrado; verificação periódica das 5 rotas |
| R-8 | `/solucoes-com-ia` perder tráfego ao virar triagem | página permanece 200 e indexável, com conteúdo próprio |
| R-9 | Links legados no CMS | `CMS_INTERNAL_LINK_DEBT` segue aberta; o redirect interno mantém tudo funcional |

---

## 19. Fora do escopo

CD-2 e a rota da Agenda Confirmada · redirect externo permanente ·
`/servicos/e-commerce`, `/solucoes/processos-manuais`,
`/solucoes/sistemas-desconectados` (`NEEDS_SEO_DATA`) ·
`/servicos/sites-e-landing-pages` (`KEEP`) · hub `/servicos` · taxonomia global
de analytics · edição em massa do CMS · qualquer alteração em `zapbox.cloud` ·
slug corrompido do blog · renomear `/avaliacoes` · criar `/produtos`.

---

## 20. Decisões fechadas

1. **CD-1 = `BRIDGE_FIRST`** — 42 pontos contra 31, 28 e 27.
2. **Uma ponte só**, em **`/zapbox`**, e não quatro páginas-ponte.
3. **As 4 URLs migram por redirect interno** para a ponte — reversível, sem
   transferir sinal para fora do domínio.
4. **O alias `automacao-de-atendimento` viaja junto**, sempre em 1 salto.
5. **A ponte é `INDEXABLE`**, com canonical própria e **PRESENTE no sitemap**.
6. **Sem `Product`/`Offer` schema** e sem preços no domínio RC2.
7. **CD-3 = `CHANNEL_AND_OBJECT`, com quatro donos** — Zapbox, RC2, fronteira
   compartilhada e **cliente**.
8. **Critério de desempate: o objeto do trabalho**, nunca o vocabulário.
9. **`/solucoes-com-ia` vira triagem**, mantendo `SPLIT_INTENT`; nenhum 308
   global aprovado.
10. **Header não recebe Zapbox**; `/produtos` não se justifica ainda.
11. **Home e Footer preservam `location` e `label`**; muda só o `destination`.
12. **Redirect externo não é requisito** — vira otimização, com 8 critérios e
    `OBSERVATION_PERIOD_REQUIRED` sem duração inventada.
13. **`CD-4` registrado** — contrato e comissionamento sem fonte; não bloqueia.
14. **CD-2 permanece `DEFER`**, com as três lacunas inalteradas.
15. **Nada foi implementado nesta tarefa.**
