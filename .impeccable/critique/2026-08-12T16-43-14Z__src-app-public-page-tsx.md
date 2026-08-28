---
target: projeto público RC2 Soluções
total_score: 25
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 3
timestamp: 2026-08-12T16-43-14Z
slug: src-app-public-page-tsx
---
Method: dual-agent (A: a_design_review · B: b_evidence_scan)

## Saúde estética

**Nota estética:** 7,2/10 — sóbrio e consistente; premium moderado, ainda não autoral.

### Huashu — avaliação visual

| Dimensão | Nota | Leitura |
|---|---:|---|
| Conceito | 7,7 | “Precisão operacional” aparece no grid, na tipografia e no Signal Interrupt. |
| Alinhamento filosófico | 8,5 | Paleta, contenção do laranja e contraste seguem bem a identidade v3. |
| Hierarquia | 7,4 | Heroes e capítulos navy são fortes; listas longas e CTAs concorrentes diluem o percurso. |
| Craft | 7,0 | Sistema consistente, mas corpo pequeno, quebras ópticas e sobreposição mobile pedem acabamento. |
| Funcionalidade | 6,8 | Navegação e formulário são claros; WhatsApp cobre conteúdo e o formulário móvel chega tarde. |
| Originalidade | 5,8 | A camada de marca é própria; a gramática de landing page ainda é intercambiável. |

### Nielsen — leitura secundária de usabilidade

| # | Heurística | Nota | Evidência principal |
|---|---|---:|---|
| 1 | Visibilidade do estado | 3 | Formulário tem etapas, mas o indicador comprime no mobile. |
| 2 | Correspondência com o mundo real | 4 | Linguagem visual de operação e engenharia é clara. |
| 3 | Controle e liberdade | 3 | Rotas e saídas são claras; há concorrência entre CTAs equivalentes. |
| 4 | Consistência e padrões | 3 | Sistema coeso, com repetição excessiva da mesma gramática. |
| 5 | Prevenção de erros | 3 | Formulário orienta a progressão, embora a faixa de etapas perca legibilidade móvel. |
| 6 | Reconhecimento em vez de memória | 3 | Ações visíveis, mas a taxonomia Serviços/Soluções exige mapa mental. |
| 7 | Flexibilidade e eficiência | n/a | Não é uma interface operacional. |
| 8 | Estética e minimalismo | 3 | Contido e limpo, porém páginas longas acumulam cards e listas. |
| 9 | Recuperação de erros | 3 | Fluxo de contato tem estrutura clara; estados não foram submetidos nesta leitura estética. |
| 10 | Ajuda e documentação | n/a | Não é requisito central de uma superfície de persuasão. |
| **Total** |  | **25/32** | **Bom (78%)** |

## Veredito de especificidade

A RC2 já possui assinatura reconhecível: Barlow Condensed, off-white/navy/laranja, Signal Interrupt, régua e grid técnico. Isso comunica engenharia operacional melhor que a média das consultorias de IA. Contudo, a composição permanece parcialmente intercambiável com SaaS B2B: hero tipográfico, cards, seção navy, CTA e footer. A promessa de “operação funcionando” não ganha prova visual própria — faltam mapas de processo, topologias de integração, interfaces anotadas, registros de implementação ou presença humana contextual.

O detector automático retornou 0 achados para a home. A inspeção visual e o código, porém, encontraram questões que ele não modela: corpo relevante em 14px, WhatsApp sobreposto no mobile e sombra com matiz verde em um card escuro. Não houve overlay confiável porque o CSP bloqueou o script de visualização.

## Impressão geral

O site parece sério, técnico e confiável. A paleta é o ativo mais maduro; a composição editorial é boa; a disciplina de marca evita quase todos os clichês de IA. O principal salto agora não é “embelezar”: é substituir parte da abstração por evidência visual real e dar a cada rota uma forma própria, preservando a copy.

## O que funciona

- O laranja funciona como sinal de ação, não como decoração; a proporção visual está contida.
- Heroes e capítulos navy criam hierarquia macro e boa sensação de confiança.
- `/contato` no desktop é limpo, previsível e reduz ansiedade com progressão visível.
- Não há roxo, neon, robôs, cérebro, chip ou gradientes coloridos; a marca evita o repertório genérico de IA.

## Questões prioritárias

### [P1] A promessa operacional não tem prova visual

**Por que importa:** o site afirma experiência prática, mas demonstra sobretudo domínio de identidade gráfica. Isso limita a percepção premium, que depende de evidência e especificidade.

**Evidência:** `/`, `/servicos`, `/solucoes-com-ia` e `/sobre` dependem quase totalmente de texto, cards e grid abstrato; a história do fundador não possui retrato contextual.

**Direção:** inserir um objeto de prova autoral por rota — mapa de processo, integração anotada, painel real tratado, sequência operacional ou retrato em contexto — sem alterar uma linha de copy.

**Comando sugerido:** `$impeccable bolder`.

### [P1] O WhatsApp flutuante cobre conteúdo no mobile

**Por que importa:** introduz uma falha de acabamento visível justamente no viewport mais sensível e reduz legibilidade.

**Evidência:** sobreposição observada em `/servicos`, `/solucoes-com-ia`, `/sobre` e `/contato`; em `/sobre`, o botão de 56×56 cobre a biografia.

**Direção:** reservar safe area, reposicionar por contexto ou recolher o controle em blocos densos.

**Comando sugerido:** `$impeccable adapt`.

### [P1] Corpo informativo pequeno demais para a escala premium

**Por que importa:** 14px recorrente transforma precisão em economia visual e viola o mínimo de 16px da própria marca para conteúdo.

**Evidência:** conteúdo relevante abaixo do mínimo aparece nas cinco rotas analisadas.

**Direção:** elevar corpo informativo, reduzir densidade simultânea e separar claramente conteúdo, apoio e metadado.

**Comando sugerido:** `$impeccable typeset`.

### [P2] As rotas repetem quase a mesma gramática

**Por que importa:** consistência vira monotonia; a página parece uma família de templates, não capítulos distintos de uma mesma narrativa.

**Evidência:** opener com blueprint, cards brancos, capítulo navy, CTA navy e footer reaparecem quase sem mudança estrutural. O blueprint perde força pela repetição.

**Direção:** atribuir uma composição própria a cada tipo de informação — fluxo sequencial, diagrama, matriz, faixa editorial ou estudo visual — sempre dentro dos tokens atuais.

**Comando sugerido:** `$impeccable layout`.

### [P2] Heroes fortes, mas com composição óptica incompleta

**Por que importa:** quebras isoladas e grande vazio à direita parecem resultado do container, não decisão editorial.

**Evidência:** “VEZES.” isolado na home, “OPERAÇÃO.” isolado em `/servicos`, e grandes áreas direitas vazias em `/servicos` e `/solucoes-com-ia`.

**Direção:** recalibrar largura, escala e quebras responsivas; usar contraponto operacional discreto no espaço residual, sem acrescentar texto.

**Comando sugerido:** `$impeccable layout`.

## Red flags por persona

- **Jordan, visitante novo:** Serviços, Soluções com IA e Soluções por Problema têm pesos semelhantes; cinco rotas por dor seguidas de seis serviços elevam a indecisão. No contato mobile, o formulário só aparece após o inventário de benefícios.
- **Riley, avaliador criterioso:** percebe distância entre a promessa de precisão e a ausência de artefatos verificáveis; múltiplos CTAs equivalentes no contato enfraquecem a sensação de fluxo controlado.
- **Casey, usuário mobile distraído:** o WhatsApp cobre conteúdo, listas longas exigem leitura contínua e o botão de menu mede 38×38px, abaixo do alvo recomendado de 44×44px.

## Observações menores

- O logo no header desktop fica visualmente subordinado ao CTA.
- O estado ativo em pill pêssego é mais “SaaS amigável” que “instrumento operacional”.
- A home contém uma sombra verde/matizada em card escuro, contrariando a regra de verde não estrutural e sombras não coloridas.
- O stepper do contato comprime labels e o tempo estimado em 12px no mobile.
- As integrações de Ahrefs/DoubleClick são bloqueadas pelo CSP e o Meta Pixel recebe PixelID inválido; não quebram o layout, mas adicionam ruído técnico de console.

## Perguntas para orientar uma próxima fase

- Qual único artefato visual pode provar “operação funcionando” sem acrescentar palavras?
- A prioridade é elevar autoria da marca, corrigir acabamento mobile ou ajustar tipografia primeiro?
- A próxima intervenção deve cobrir apenas os três P1 ou também diferenciar a gramática das rotas?

Nenhuma recomendação exige mudança de copy.
