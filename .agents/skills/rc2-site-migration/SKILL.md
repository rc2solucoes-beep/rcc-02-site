---
name: rc2-site-migration
description: Posicionamento, arquitetura de informação e regras de migração do site RC2 Soluções. Use SEMPRE que estiver escrevendo ou revisando copy do site, criando ou alterando páginas e rotas, definindo navegação ou menu, decidindo CTA, tratando URLs, redirects ou SEO de migração, posicionando serviços, ou decidindo se algo pertence à RC2, ao Zapbox ou ao Agenda Confirmada. Também use ao planejar a nova home, consolidar páginas de serviço, avaliar claims e provas, ou antes de qualquer alteração estrutural do site. Cobre o novo posicionamento (Automação + Integrações + IA para Operações), territórios de produto, CTA "Falar sobre minha operação", conversa gratuita vs Discovery Operacional pago, e preservação de URLs.
---

# RC2 — Reformulação e migração do site

Fonte de verdade estratégica: `documentos-base/RC2_PROPOSTA_ATUALIZACAO.txt`.
Método de execução: `documentos-base/RC2_PROMPT_MESTRE_REFORMULACAO.txt`.

Complementa `AGENTS.md`. Para regras visuais, use `rc2-brand-system`.

## Regra de execução — leia primeiro

> **Não iniciar implementação massiva.
> Executar mudanças em etapas pequenas e validáveis.**

Uma página ou um componente por vez. Cada etapa precisa ser revisável e
reversível isoladamente. Não refatore o site inteiro em uma tarefa, mesmo que o
plano completo esteja claro. Se uma tarefa parecer exigir mudança ampla,
proponha o fatiamento antes de escrever código.

## Territórios — quem resolve o quê

| Marca | Território |
|---|---|
| **RC2** | Automação de Processos + Integrações de Sistemas + IA para Operações |
| **Zapbox** | WhatsApp + Atendimento + Vendas + CRM + Sales AI |
| **Agenda Confirmada** | Agenda e confirmações para clínicas |

**Zapbox** é produto próprio da RC2. Destino padrão: a ponte **`/zapbox`**,
que encaminha ao produto em <https://www.zapbox.cloud/>.
**Agenda Confirmada** é solução vertical RC2 — rota `DEFER_ROUTE`, ainda não
criada; CTA contextual para `/contato`.

Antes de escrever qualquer oferta, pergunte a qual território ela pertence.

- Necessidade predominantemente de WhatsApp, múltiplos atendentes, CRM
  comercial, atendimento, vendas por WhatsApp ou Sales AI → **Zapbox**.
- Problema predominantemente de clínica, agenda, confirmação, lembrete, falta ou
  horário vago → **Agenda Confirmada**.
- Processo manual, sistemas desconectados, integração, dado espalhado, falta de
  rastreabilidade, IA sem processo → **RC2**.

**A RC2 não compete com o próprio produto.** Não crie página, serviço ou copy
RC2 que duplique o território do Zapbox.

### Fronteira — `CHANNEL_AND_OBJECT`

Classifique pelo **objeto principal do trabalho**, não pelo vocabulário: as duas
marcas usam palavras parecidas para automação e integração.

| Dono | Objeto |
|---|---|
| **Zapbox** | conversa · WhatsApp · atendimento · equipe · lead · CRM comercial · pipeline · venda · Sales AI |
| **RC2** | processo · workflow · sistema · API · ERP · dado · integração · observabilidade · IA operacional |
| **Fronteira** | integração Zapbox ↔ demais sistemas — da RC2 **quando contratada**; o fluxo *entre* plataformas, nunca a operação *dentro* delas |
| **Cliente** | a operação cotidiana: atender, vender, aprovar, faturar, decidir |

Conversa, lead ou venda → Zapbox. Processo, sistema ou dado → RC2.

### Handoff — `BRIDGE_FIRST`

```
superfície RC2  →  /zapbox  →  https://www.zapbox.cloud/
```

Nunca linke uma superfície RC2 direto ao domínio do produto por padrão. Use
`https://www.zapbox.cloud/` com **`www`** — o apex responde 308.

## Posicionamento e mensagem

RC2 Soluções é consultoria e implementadora de **Automação de Processos**,
**Integração de Sistemas**, **IA para Operações** e **Operações Digitais &
Commerce**.

Mensagem central:

> "A RC2 conecta sistemas, automatiza processos e aplica IA para fazer sua
> operação funcionar melhor."

Frase institucional permitida:

> "Tecnologia que funciona. Operação que entrega."

Problema central a nomear na copy — operação que cresceu sem que processos e
sistemas acompanhassem: tarefas manuais, copiar e colar, sistemas desconectados,
informação espalhada, processo dependente de pessoa específica, falta de
rastreabilidade, IA sem processo estruturado.

Fale do problema do cliente, não de tecnologia pela tecnologia.

## CTA

**CTA principal: "Falar sobre minha operação"** → `/contato`.

Descontinuados, proibidos como CTA vigente:

- "Solicitar diagnóstico"
- "Diagnóstico gratuito"

WhatsApp é canal auxiliar, nunca substituto da rota principal.

## Conversa inicial vs Discovery Operacional

| | Conversa de diagnóstico | Discovery Operacional |
|---|---|---|
| Preço | gratuita | **pago** |
| Duração | curta | conforme escopo |
| Objetivo | entender o problema e avaliar fit | processo, sistemas, arquitetura, riscos e roadmap |

Existe uma terceira oferta: **Operação Gerenciada**, em recorrência (MRR) —
monitoramento, alertas, correções, backups, observabilidade, revisão de
workflows, manutenção de integrações, análise de consumo e evolução. A RC2 não
apenas implanta; acompanha depois. Prioridade alta na proposta.

A conversa gratuita **não promete** levantamento completo, arquitetura, roadmap,
mapeamento detalhado nem discovery completo. Nenhuma copy pode sugerir isso.
Projeto que exige esse nível de análise evolui para o Discovery Operacional pago
— e isso deve ficar explícito.

## Consolidação de serviços

Não posicionar como oferta principal: sites institucionais, landing pages,
construção genérica de e-commerce, chatbot genérico, marketing digital.

Sites, interfaces, formulários, APIs e dashboards **podem existir como partes de
projetos maiores** — nunca como pilar da RC2.

E-commerce é tratado como **"Operações Digitais & Commerce"**, com foco em
integração entre plataforma, ERP, logística, pagamentos, atendimento, dados e
automações. Não como "fazemos sua loja".

## Arquitetura de informação pretendida

```
/
├── /solucoes
│   └── /solucoes/agenda-confirmada   (DEFERRED — não criada)
├── /zapbox                            (ponte do produto — publicada)
├── /sobre
├── /blog
├── /contato
├── /privacidade
└── /termos
```

`/zapbox` é rota da RC2. O domínio do produto fica fora da árvore e é alcançado
pelo CTA da ponte.

Esta é a arquitetura **pretendida**, não uma autorização para apagar o que
existe. A existência de URLs antigas fora dessa árvore **não autoriza removê-las
ou redirecioná-las** sem análise de SEO e plano de migração.

## Home futura — ordem das seções

Hero aprovado pela proposta (alternativa A, recomendada):

> **Sua operação não precisa de mais ferramentas. Precisa funcionar melhor.**
>
> A RC2 conecta sistemas, automatiza processos e aplica inteligência artificial
> para reduzir trabalho manual, retrabalho e gargalos na operação.
>
> `[Falar sobre minha operação]` `[Conhecer soluções]`

A RC2 abre falando de **operação**, não de WhatsApp — essa promessa agora é do
Zapbox.

Seções, nesta ordem:

1. Hero operacional
2. Problemas
3. Soluções
4. Produtos próprios
5. Método
6. Autoridade
7. Demonstrações
8. Filosofia
9. Conteúdo
10. CTA final

Construa uma seção por vez, validando antes de seguir.

## Destino de cada URL existente

Disposições da proposta (seção 10). Isto é **plano**, não autorização para
executar em lote — cada linha ainda passa pelo checklist de migração abaixo.

**Consolidar em `/solucoes`:**

| URL atual | Destino |
|---|---|
| `/servicos` | vira `/solucoes` (página comercial única) |
| `/solucoes-com-ia` | `/solucoes#ia-para-operacoes` |
| `/servicos/agentes-de-ia` | incorporar em IA para Operações |
| `/servicos/automacao-de-processos` | incorporar em Automação + Integrações |
| `/solucoes/processos-manuais` | incorporar em `/solucoes` ou virar artigo |
| `/solucoes/sistemas-desconectados` | mesmo tratamento |

**Migrar para a ponte `/zapbox` — redirect interno, reversível:**

- `/servicos/automacoes-com-ia`
- `/solucoes/atendimento-lento`
- `/solucoes/leads-sem-resposta`
- `/solucoes/whatsapp-desorganizado`

**Despriorizar:**

- `/servicos/sites-e-landing-pages` — sai da navegação principal
- `/servicos/e-commerce` — vira Operações Digitais & Commerce ou entra em `/solucoes`

**Preservar:** `/`, `/sobre`, `/contato`, `/blog`, `/privacidade`, `/termos`.

**`/avaliacoes`:** manter, renomeando o conteúdo para **"Avaliações e Projetos"**.
A expressão "Cases de Sucesso" não pode ser usada enquanto não houver case
documentado — hoje o conteúdo é avaliação e demonstração.

## Migração SEO e preservação de URLs

**Nunca remover uma URL apenas porque ela não fará parte da nova navegação.**
Sair do menu e sair do site são decisões diferentes.

Antes de alterar qualquer URL:

1. verificar função atual
2. verificar conteúdo
3. considerar histórico orgânico
4. definir destino equivalente
5. evitar redirect chains
6. preservar intenção de busca
7. documentar o redirect

Regras de redirect:

- Redirect vai para o destino **equivalente em intenção**, não para a home. Home
  como destino é confissão de que não houve análise.
- Um salto só. Se a URL já era destino de um redirect anterior, aponte a origem
  antiga direto para o destino final.
- Redirect permanente só quando a decisão for permanente.
- Todo redirect fica documentado.

**URLs de território Zapbox migram para `/zapbox`**, não para o domínio
externo. O redirect é interno: mantém o sinal no domínio, cria ponto de medição
e continua reversível.

**Redirect externo permanente é `OPTIONAL_FUTURE_OPTIMIZATION`, não requisito.**
Só depois de equivalência comprovada, ponte publicada, links internos migrados,
analytics funcionando, Search Console revisado, backlinks conhecidos, destino
externo estável e período de observação cumprido.

Considere também: sitemap, canonical, títulos e descriptions, dados
estruturados e links internos que apontam para a URL alterada.

## Conteúdo e claims

Nunca inventar: clientes, cases, depoimentos, resultados, métricas,
certificações, parceiros, números, garantias.

- **Laboratório não é cliente.**
- **Demonstração não é case comercial.**

Nunca usar métrica sem documentação. Se um dado não existe em documento
aprovado, ele não vai para a página. Na dúvida entre inventar um número e
escrever sem número, escreva sem número.

**O inverso também vale.** A trajetória do fundador na seção 16 da proposta é
material **aprovado** e é a âncora de autoridade enquanto os cases amadurecem.
Não trate esses dados como claim inventado nem os remova — consulte a proposta
antes de concluir que um número é fictício.

Autoridade se constrói com o que é verdade: método, demonstração identificada
como demonstração, experiência real do fundador, conteúdo técnico do blog,
clareza sobre o processo. A frase legítima é **"Construímos isso. Você pode
testar."**

Tom: especialista que fala como parceiro, direto, sem hype. Evitar revolução,
disruptivo, mágico, solução completa, líder de mercado, simples assim. "Chatbot"
é "agente de IA"; "barato" é "acessível".

## Critérios de aceite

Antes de dar uma etapa por concluída:

- [ ] A mudança é pequena e validável isoladamente.
- [ ] CTA principal é "Falar sobre minha operação" apontando para `/contato`.
- [ ] Nenhuma ocorrência de "Solicitar diagnóstico" ou "Diagnóstico gratuito"
      como CTA vigente.
- [ ] A conversa gratuita não promete levantamento, arquitetura ou roadmap.
- [ ] Território correto: nada da RC2 invade o Zapbox ou o Agenda Confirmada.
- [ ] Serviços despriorizados não aparecem como oferta principal.
- [ ] Nenhuma URL removida sem análise, destino equivalente e redirect
      documentado.
- [ ] Nenhum redirect chain introduzido.
- [ ] Nenhum claim, número, case ou depoimento sem origem em documento aprovado.
- [ ] Links internos, sitemap e canonical coerentes com a mudança.
- [ ] Regras visuais de `rc2-brand-system` respeitadas.
- [ ] `npm run build` e `npm run audit:brand` passando.
