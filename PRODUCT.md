# RC2 Soluções — Product Context

> **Estado deste documento.** Descreve o **posicionamento** e a
> **arquitetura-alvo** do site. A migração está **parcialmente implementada**:
> as Fases 0 a 6D já publicaram o posicionamento na Home, a consolidação de
> `/solucoes` com as quatro competências, a primeira migração de URLs e a ponte
> institucional `/zapbox`. Continuam pendentes as migrações residuais de
> território Zapbox e a rota da Agenda Confirmada. Onde este documento descreve
> algo que ainda não existe, o texto marca explicitamente *desired
> positioning*, *target architecture* ou *planned migration*.
>
> Fontes oficiais, nesta ordem de autoridade:
> `documentos-base/RC2_PROPOSTA_ATUALIZACAO.txt` ·
> `documentos-base/RC2_Brand_Guide_v2.1.md` ·
> `documentos-base/RC2_PROMPT_MESTRE_REFORMULACAO.txt`.
> Regras operacionais: `AGENTS.md` e as skills `rc2-brand-system` e
> `rc2-site-migration`.

## Empresa — *desired positioning*

RC2 Soluções é uma **consultoria e implementação de automação, integrações e IA
para operações empresariais**.

Não é agência de marketing, não é software house, não é fábrica de sites e não é
empresa de chatbot.

### Pilares principais

- **Automação de Processos**
- **Integração de Sistemas**
- **IA para Operações**
- **Operações Digitais & Commerce**

### Produto próprio — Zapbox

Território: **WhatsApp · atendimento · vendas · CRM · Sales AI.**

Zapbox é **produto próprio da RC2**. No domínio institucional ele tem uma
**ponte**, `/zapbox`, que explica a relação entre as marcas, delimita os
territórios e encaminha ao produto em <https://www.zapbox.cloud/>.

`CD-1 = BRIDGE_FIRST` — as superfícies da RC2 usam **`/zapbox`** como destino
padrão; só o CTA da ponte sai do domínio. Quando a necessidade do cliente for
predominantemente desse território, a oferta correta é Zapbox.
**A RC2 não compete com o próprio produto.**

### Fronteira RC2 × Zapbox — *CD-3*

**Zapbox** é o canal e o funil: conversa, WhatsApp, atendimento, equipe, lead,
CRM comercial, pipeline, vendas e Sales AI.

**RC2** é o processo e os sistemas: workflows, integrações, APIs, ERP, dados,
observabilidade, IA operacional, arquitetura e sustentação técnica.

**Fronteira compartilhada:** a integração entre o Zapbox e os demais sistemas é
da RC2 quando contratada — o fluxo **entre** as plataformas, nunca a operação
que roda **dentro** delas.

**Cliente:** a operação cotidiana — atender, vender, aprovar, faturar, decidir.

Na dúvida, classifique pelo **objeto do trabalho**, não pelo vocabulário.

### Solução vertical — Agenda Confirmada

Território: **clínicas · confirmações · lembretes · agenda.**

Solução vertical da RC2, dentro da marca. É a primeira prova de um modelo
importante: a RC2 identifica um problema repetível e o transforma em solução
vertical.

A rota `/solucoes/agenda-confirmada` é *planned migration* — **`DEFER_ROUTE`**,
ainda não criada. O posicionamento está aprovado; a página aguarda `CD-2`.

## Problema central

**Operações que cresceram, mas processos e sistemas não acompanharam.**

Sintomas: trabalho manual, copiar e colar entre sistemas, planilha virando
sistema, informação duplicada e espalhada, sistemas isolados, tarefas
dependentes de pessoas específicas, falta de rastreabilidade, e dificuldade de
aplicar IA com segurança sobre processo não estruturado.

## Público

**PMEs com operação digital já existente** — não empresas começando do zero.

Qualificam melhor que número de funcionários: usam vários sistemas (ERP, CRM,
e-commerce, planilhas ou sistemas próprios); têm equipe comercial ou
operacional; já sentem retrabalho; têm volume que justifica automação; têm
gestor ou dono capaz de decidir; precisam integrar tecnologia sem reconstruir
tudo.

Compradores: empresário, diretor, gerente de operações, gerente comercial,
gerente de tecnologia, responsável por e-commerce/digital.

## Mensagem principal

> "A RC2 conecta sistemas, automatiza processos e aplica IA para fazer sua
> operação funcionar melhor."

Tagline institucional permitida:

> "Tecnologia que funciona. Operação que entrega."

Tese de marca a preservar: *"A IA não substitui uma operação mal estruturada."*

## Objetivo da experiência

Transformar uma dor operacional percebida em uma conversa qualificada. O site
deve transmitir maturidade técnica, sobriedade e execução prática — e deixar
claro em 10 segundos o que a RC2 faz, para quem e por que conversar com ela.

## CTA principal — *desired positioning*

**"Falar sobre minha operação"**, destino `/contato`.

WhatsApp é canal auxiliar, nunca substituto da rota principal.

**Não utilizar como proposta vigente:**

- "Solicitar diagnóstico"
- "diagnóstico gratuito" como oferta principal

O CTA principal é o padrão da marca, não um texto único obrigatório em toda
página; CTAs contextuais aprovados estão em `AGENTS.md`.

## Ofertas comerciais

### Conversa inicial — gratuita

- gratuita, curta (20–30 min)
- avaliação de **fit**
- entendimento inicial do problema

**Não promete** levantamento completo, mapeamento detalhado, arquitetura ou
roadmap. Entregar isso de graça é o erro que a reformulação corrige.

### Discovery Operacional — pago

- processo
- sistemas
- arquitetura
- riscos
- prioridades
- roadmap quando aplicável

É a porta de entrada natural para projetos mais complexos.

### Operação Gerenciada — recorrência

Monitoramento, alertas, correções, backups, observabilidade, revisão de
workflows, manutenção de integrações, análise de consumo e evolução. A RC2 não
apenas implanta; acompanha depois.

## Arquitetura comercial — *target architecture*

```
/
├── /solucoes
│   └── /solucoes/agenda-confirmada   (DEFERRED — planned, ver CD-2)
├── /zapbox                            (rota RC2 — ponte do produto)
├── /sobre
├── /blog
├── /contato
├── /privacidade
└── /termos
```

**Rota RC2:** `/zapbox` — publicada.
**Destino do produto:** <https://www.zapbox.cloud/> — fora do domínio,
alcançado pelo CTA da ponte.

**Esta é a arquitetura-alvo — *planned migration*, não estado atual.** O site
hoje ainda tem `/servicos` e suas subpáginas, `/solucoes-com-ia`, as páginas de
solução por problema e `/avaliacoes`. A existência dessas URLs **não autoriza
removê-las** sem análise de SEO, destino equivalente e redirect documentado. As
disposições planejadas por URL estão na skill `rc2-site-migration`.

## Serviços despriorizados

Não posicionar como oferta principal: sites institucionais, landing pages,
construção genérica de e-commerce, chatbot genérico, marketing digital.

Sites, interfaces, formulários, dashboards, portais, APIs e infraestrutura
**continuam sendo capacidade técnica real** e podem existir como partes de
projetos maiores — mas não como pilar da RC2 nem com página própria.

E-commerce sobe de nível: de "implantação de loja" para **Operações Digitais &
Commerce**, integrando plataforma, ERP, logística, pagamentos, atendimento,
dados e automações.

## Prova e autoridade

Enquanto não houver cases documentados, a autoridade vem de: método,
demonstrações que a pessoa pode testar (Zapbox, Valéria, Agenda Confirmada),
screenshots e diagramas reais, avaliações reais, conteúdo técnico, e a
experiência do fundador.

A página de provas chama-se **"Avaliações e Projetos"** — não "Cases de
Sucesso", enquanto não houver case documentado com baseline.

## Restrições

- Não alterar copy sem revisão explícita.
- Não inventar cliente, case, depoimento, resultado, métrica, certificação,
  parceiro, número ou garantia. Laboratório não é cliente; demonstração não é
  case comercial; nunca métrica sem documentação.
- A trajetória do fundador na seção 16 da proposta é material **aprovado** — não
  tratar como claim inventado.
- Não criar paleta fora dos tokens da marca (`src/app/globals.css`).
- Não adicionar segunda família tipográfica.
- Não transformar a interface em estética genérica de "IA".
- Manter acessibilidade, responsividade e performance como parte do acabamento.
- Não iniciar implementação massiva: mudanças em etapas pequenas e validáveis.
