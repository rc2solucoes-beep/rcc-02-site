# RC2 Soluções — Refatoração Visual do Site
## Creative Direction + UI System Specification

**Escopo:** refatoração exclusivamente visual do site rc2solucoes.com.br. Copy, funcionalidades, arquitetura técnica e regras de negócio permanecem inalteradas. Zapbox está fora de escopo — produto com identidade própria.

**Território selecionado:** Sinal em Movimento
**Intensidade da transformação:** Nível 4 — Transformação expressiva, dentro do brandkit

---

## 1. Executive Summary

O site atual da RC2 já carrega corretamente os fundamentos do brand guide — paleta Warm/Navy/Safety Orange, tipografia Barlow, tom de voz consultivo. O problema não é de fundamento, é de disciplina de aplicação: o peso tipográfico reservado para "raridade" (Barlow Condensed ExtraBold) virou padrão universal de título, o Safety Orange aparece uma vez como background dominante (violando a própria regra do guide), e a interface não tem nenhum momento de expressão de marca além de texto e cards.

A direção escolhida — **Sinal em Movimento** — resolve isso levando o conceito do logo Signal Interrupt (padrão que se rompe no ponto exato de transformação) para o comportamento da interface: uma palavra que muda no hero, números que contam ao aparecer, cor que "acontece" no instante certo em vez de decorar o tempo todo. Nenhum fluxograma, nó ou elemento diagramático — essa linguagem foi explicitamente descartada por ler como template genérico de IA.

O resultado é uma interface mais contida na maior parte do tempo, e mais viva nos poucos momentos em que precisa ser.

---

## 2. Current State

### Identidade
O site aplica a paleta e o tom de voz do brand guide de forma reconhecível. Arquétipo Especialista/Criador aparece na copy (direta, baseada em sintomas e soluções, sem hype).

### Interface — achados da auditoria

**Tipografia (achado mais crítico).** Barlow Condensed ExtraBold uppercase é usado como H1 padrão em todas as páginas (Home, Soluções, Sobre, Contato). O brand guide reserva esse peso exclusivamente para "display/capas", justamente pela lógica de que "o impacto vem da raridade". Aplicado como H1 universal, o efeito se perde e a hierarquia tipográfica fica achatada.

**Cor — uma violação clara.** A seção "Já enviou sua demanda?" no Contato usa Safety Orange como background full-width de uma faixa inteira. O brand guide proíbe textualmente essa aplicação ("PROIBIDO: usar Safety Orange como background dominante de páginas ou grandes seções").

**Ritmo de seção.** Home e Soluções repetem a mesma cadência (eyebrow → título → parágrafo → cards) em toda seção, sem variação de peso — gera monotonia num scroll longo.

**Hero.** O módulo "Processos · Sistemas · Dados → RC2 → Operação integrada" é um pequeno diagrama esquemático, subdimensionado visualmente.

**Iconografia.** Praticamente ausente. A interface se apoia em tipografia, setas (→) e numerais como únicos marcadores visuais.

**Pontos bem resolvidos.** Cards (fundo branco, borda sutil), footer (consistente entre todas as páginas), formulário de contato (limpo, objetivo, multi-etapa), fotografia de blog (ambientes reais de trabalho, não stock genérico).

### Sistema
Padrões recorrentes identificados mesmo sem estarem formalizados: escala de card branco/borda/sombra sutil; numerais grandes outline (01–05) em "Como trabalhamos"; grid centralizado de 2 e 4 colunas para cards; footer com 4 colunas de link.

### Inventário completo de páginas (via sitemap.xml)

Além das páginas auditadas por screenshot (Home, Soluções, Sobre, Contato), o sitemap revela:

- **`/servicos`** e **`/solucoes-com-ia`** — páginas ativas, no design system atual, mas fora do menu principal. Cobrem território de conteúdo parecido com `/solucoes` por ângulos diferentes ("por serviço" vs. "por problema"). A sobreposição é uma questão de arquitetura de informação/produto — **fora do escopo da refatoração visual** — mas ambas herdam o sistema visual normalmente.
- **`/solucoes/processos-manuais`** e **`/solucoes/sistemas-desconectados`** — landing pages "por problema", com breadcrumb, FAQ e CTA intermediário.
- **`/avaliacoes`** — cases e reviews; o bloco de avaliações do Google carrega via JavaScript, não visível em fetch estático.
- **10 artigos de blog** publicados, todos no mesmo template de artigo individual.
- `/zapbox` (fora de escopo — produto próprio) e `/llms.txt`, `/llms-full.txt` (arquivos técnicos, não páginas visuais).

---

## 3. Preserve / Evolve / Remove

| Preservar | Evoluir | Remover |
|---|---|---|
| Proporção geral neutro/navy/orange (fora da faixa do Contato) | Barlow Condensed ExtraBold como H1 universal | Faixa de fundo 100% Safety Orange no Contato |
| Consistência de header/footer entre páginas | Ritmo de seção repetitivo, sem hierarquia de "momentos" | Módulo diagramático do hero (fluxograma/nós/setas) |
| Cards, formulário de contato, fotografia real de blog | Ausência de sistema de ícone | — |
| Numerais 01–05 como dispositivo de marca | Subdimensionamento da prova social numérica (case Uno Healthcare) | — |

---

## 4. Selected Creative Direction

### Território 2 — Sinal em Movimento

**Ideia central:** o Signal Interrupt deixa de ser só um símbolo estático e passa a viver no comportamento da interface — não como diagrama, mas como interrupção cinética real. É a tradução mais literal do conceito de marca ("ruptura = mudança de estado"), sem nunca recorrer a fluxograma.

**Personalidade:** Vivo · Cinético · Confiante · Preciso · Quente nos detalhes · Nunca espalhafatoso

**Referências conceituais:** Salt Productions (tipografia cinética + marquee), SquadEasy (contadores animados), Idle (composição viva sobre fundo escuro).

**Riscos:** motion mal implementado tecnicamente vira gimmick ou pesa performance; motion em excesso contradiz a própria regra do brand guide contra clichê visual de IA/startup — a disciplina de "só anima o que muda de estado" é o que sustenta a direção.

**Diferenciação:** dos três territórios avaliados, é o único que conecta a interface ao conceito de marca via comportamento (movimento), não via elemento gráfico ou fotografia.

---

## 5. Visual Principles

### Princípio Central
> **"O orange não decora — ele acontece. Marca o instante exato da mudança de estado; fora dele, a interface fica quase monocromática."**

### Os 7 princípios

**1. Interrupção pontual, não permanente** *(cor)*
- Regra: Safety Orange só aparece no instante em que algo muda de estado.
- Aplicar: palavra do headline no frame da troca; número ao completar contagem; estado ativo/hover/focus.
- Não aplicar: background permanente de seção; decoração de ícone estático.

**2. Tipografia como gesto, não como grito** *(tipografia)*
- Regra: Barlow Condensed ExtraBold reservado a 1–2 momentos por página.
- Aplicar: H1 padrão em Barlow Bold/SemiBold; condensed só no gesto de assinatura do hero.
- Não aplicar: título de card, seção ou blog em condensed extrabold.

**3. Movimento com função, nunca decorativo** *(motion)*
- Regra: todo elemento animado precisa estar contando algo que muda.
- Aplicar: contador sobe ao entrar na viewport; palavra do hero troca uma vez, com easing controlado.
- Não aplicar: parallax decorativo, ícone "respirando", gradiente em loop.

**4. Numeração como espinha dorsal** *(ritmo/composição)*
- Regra: numeral grande + rótulo curto é o dispositivo oficial de ritmo — pode aparecer em processo, estatística ou blocos de conteúdo.
- Aplicar: numerais outline, cor navy/muted — nunca orange sólido.
- Não aplicar: numeração decorativa sem sequência lógica real.

**5. Sem fluxograma, sem nó-e-seta** *(hero)*
- Regra: nenhuma caixa-seta-caixa, nó conectado ou mockup de dashboard, em nenhum lugar do site.
- Aplicar: hero comunica transformação por linguagem (palavra que troca).
- Não aplicar: qualquer variação do módulo diagramático atual.

**6. Ícone como acento fino, não enfeite** *(iconografia)*
- Regra: ícones só onde reforçam um rótulo — nunca substituem texto, nunca ficam soltos.
- Aplicar: ícone pequeno ao lado de rótulo de feature, badge ou estado.
- Não aplicar: ícone grande centralizado em card só para ocupar espaço.

**7. Profundidade por movimento, não por elevação** *(forma/superfície)*
- Regra: bordas finas, sombra quase imperceptível — camada vem da entrada em cena, não de sombra pesada.
- Aplicar: shadow discreta já existente; reveals de entrada em scroll, sutis e rápidos.
- Não aplicar: sombra profunda, blur de fundo, elevação dramática no hover.

---

## 6. Visual Language

### Tipografia

Família única: **Barlow**.

| Nível | Peso/Estilo | Tamanho (desktop / mobile) | Tracking | Cor | Uso |
|---|---|---|---|---|---|
| Display cinético | Condensed ExtraBold (800), uppercase | 64–88px / 36–44px | +0,02 a +0,04em | Graphite Navy (claro) / Branco (escuro) | Só a palavra que troca no hero + no máx. 1 outro momento por página |
| H1 | Bold (700) | 40–52px / 28–32px | −0,02em | Graphite Navy | Título principal |
| H2 | SemiBold (600) | 28–32px / 22–24px | −0,01em | Graphite Navy | Subtítulo de seção |
| H3 | Medium (500) | 18–20px | normal | Graphite Navy | Título de card |
| Body | Regular (400) | 16px / 15px mín. | normal | Body Slate | Corpo, line-height 1,7 |
| Label/Eyebrow | Condensed Medium, uppercase | 12–13px | +0,10em | Orange Text (claro) / Safety Orange (escuro) | Identificação permanente (ver nota) |
| Caption | Light (300) | 13–14px | normal | Muted Slate | Legendas, metadata |

> **Nota sobre eyebrow:** Orange Text `#C2410C` é a variante silenciosa e permanente do laranja — usada em labels/links/badges, sempre liberada. É diferente do Safety Orange `#FF5F1F`, reservado ao *momento de mudança de estado* (Princípio 1). Um eyebrow identifica, não interrompe.

### Cor — papéis

- **Safety Orange `#FF5F1F`** — só no instante de interrupção: palavra do hero no frame da troca, contador ao completar, estado ativo/hover/focus, CTA.
- **Orange Text `#C2410C`** — eyebrows, links, badges. Uso permanente, sempre liberado.
- **Navy (Core/Secondary/Elevated)** — superfície dominante das seções escuras.
- **Background claro** — ver atualização de token abaixo.
- **Graphite Navy / Body Slate / Muted Slate** — hierarquia de texto, sem mudança.
- **Semânticas (Success/Warning/Error)** — mantidas como no brand guide original.

### Atualização de token — background claro

Decisão aprovada: o fundo padrão sai do tom "creme" (`#F7F5F1`) para um tom quase-branco, mantendo a separação fundo/card por preenchimento (evita a estética clínica que o próprio brand guide pede para evitar).

```css
--color-background: #FBFAF8;       /* era #F7F5F1 — fundo padrão */
--color-background-alt: #F7F5F1;   /* era #FBFAF8 — inverte o papel, usado em seções de alternância/respiro */
--color-surface: #FFFFFF;          /* sem mudança — cards e superfícies elevadas */
```

### Espaçamento

Unidade base 4px. Correção deliberada ao ritmo monótono da auditoria: nem toda seção pesa igual.

| Escala | Valor | Uso |
|---|---|---|
| Micro | 4 / 8 / 12px | Ícone-texto, padding de badge |
| Componente | 16 / 24 / 32px | Padding interno de card, gap entre itens |
| Seção padrão | 64–80px desktop / 48px mobile | Maioria das seções de conteúdo |
| Seção de assinatura | 120–160px desktop / 72px mobile | Hero e blocos com prova social quantificada — reforça que são momentos, não rotina |

### Grid

- Largura máxima do conteúdo: ~1280px, container centralizado.
- Gutters: 24px mobile / 32–40px desktop.
- Colunas: 4 (mobile) / 12 (desktop).
- Full-bleed reservado a backgrounds de seção (navy, warm). Conteúdo sempre respeita o container. **Nunca full-bleed em Safety Orange.**

### Forma

- Radius: 8px em botões/inputs, 12–16px em cards.
- Borda: hairline 1px (`#DDE2E7` claro / `#294054` escuro).
- Sombra: mantém a sutileza atual (`0 4px 16px rgba(11,23,38,0.06)`) — elevação estática não aumenta.
- Sem pill/rounded-full, exceto indicador de nav ativo (já convencional).

### Imagens

- Fotografia real (fundador, operação, equipe) — sem stock genérico, sem overlay colorido.
- Proporções: 3:2 para fotos de destaque/feature, 4:3 para thumbnails de blog.
- Nos "momentos de assinatura", a foto ocupa o bloco inteiro — não reduzida a thumbnail pequeno.

### Iconografia

- Phosphor/Lucide, outline, traço 1,5px consistente.
- 16–20px inline com label; 24px em destaque de feature.
- Cor padrão Graphite Navy — Safety Orange só quando o ícone representa estado ativo/selecionado.
- **Ícone acompanhando título de card/lista (Sintomas, Competências, Sinais):** vive dentro de um pequeno container — fundo Accent Soft `#FFF0E9`, radius 8px, borda hairline (mesmo token de borda do sistema) — em vez de solto ao lado do texto. Container de tamanho fixo, ~32–36px. Ícone permanece Graphite Navy dentro do container; o container não muda de cor por estado, isso competiria com o Princípio 1. Objetivo: ler como indicador/instrumento, não como ícone solto de lista SaaS genérica.

### Foco visível

Requisito, não decoração — descoberto como bug real em QA, não uma preferência estética. Outline real (nunca `box-shadow`/utilities de `ring`), 2px sólido com 2px de offset. Implementado fora de qualquer camada de CSS que utilities possam sobrepor silenciosamente (ex.: `focus-visible:outline-none` de utility vencendo estilo de camada de componente — bug real já encontrado uma vez). A cor do anel deve ser resolvida por superfície, nunca herdar `currentColor` sem checar: em fundo escuro, o mesmo laranja que funciona em fundo claro pode cair abaixo de 3:1 de contraste. Verificar sempre com screenshot do elemento focado — leitura de `computed style` pode reportar o valor da propriedade sem refletir a cor efetivamente renderizada.

### Motion

| Elemento | Velocidade | Easing | Regra |
|---|---|---|---|
| Troca de palavra no hero | 400–600ms | ease-in-out | Uma vez, deliberada e legível |
| Contadores | conta até o valor real ao entrar na viewport | ease-out | Uma vez, sem loop |
| Hover/focus | 150–200ms | ease-out | Mudança sutil de cor/borda, sem scale exagerado |
| Scroll reveal | 200–300ms | ease-out | Fade + leve translateY (8–12px), nunca slide lateral grande |

**Nunca animar:** ícone "respirando", gradiente em loop, parallax de fundo, ou qualquer coisa que não marque uma mudança de estado real.

**Acessibilidade de motion (requisito, não opcional):** todo elemento com troca cinética (palavra do hero, contadores) precisa: (1) respeitar `prefers-reduced-motion` — sem JS ou com a preferência ativa, renderizar direto o estado final aprovado, nunca um estado intermediário/provisório; (2) no caso de contadores, expor o valor final via atributo de acessibilidade (ex. aria-label) durante a contagem, para leitor de tela não anunciar números intermediários sem sentido; (3) nunca duplicar a fonte do texto — o texto animado deve ser derivado do mesmo dado que o H1/conteúdo canônico, nunca uma cópia paralela que pode divergir.

---

## 7. Component Language

Todo componente herda os tokens da Seção 6. A regra geral de comportamento: um componente só recebe Safety Orange sólido, motion ou destaque visual elevado quando representa literalmente um estado mudando (clique, foco, conclusão, ativação). Fora disso, a linguagem por padrão é contida — navy/neutro, borda fina, sem sombra pesada.

---

## 8. Key Components

### Primitives

| Componente | Estados | Recomendação |
|---|---|---|
| Botão Primário | default / hover / active / focus | Mantém Safety Orange sólido — clicar é um gatilho de mudança de estado. Focus ring mais visível, hover com leve mudança de tom, sem scale. |
| Botão Secundário | default / hover / active | Sem mudança — já discreto por natureza. |
| Link com seta (→) | default / hover | Seta ganha micro-deslocamento de 2–3px no hover (150ms). |
| Badge/Eyebrow | estático | Cor Orange Text, não Safety Orange — identificação permanente. |
| Input / Textarea | default / focus / error / success | Mantém como está — focus com halo orange já é coerente. |
| Estrelas de avaliação | estático | Único uso "decorativo" fora do Princípio 1 — convenção universal, mantém. |
| Divisor | — | Sem mudança. |

### Composites

| Componente | Onde aparece | Recomendação |
|---|---|---|
| Card Sintoma/Competência | Sintomas, Competências | Adiciona ícone fino ao lado do título. |
| Card Produto | Zapbox, Agenda Confirmada | Sem mudança estrutural — herda nova tipografia. |
| Card Case/Cliente | Edenred, Uno Healthcare, Forta Tech | Mesma anatomia; espaçamento maior entre cards (seção de assinatura). |
| Card Testemunho | 4 reviews | Estrelas mantidas; nome/data em Caption. |
| Card Blog | Preview e índice | Thumbnail cresce de tamanho. |
| Numerado (01–05) | Hoje só em "Como trabalhamos" | Formaliza como componente reutilizável — pode aparecer em sintomas e competências também. Numeral navy/muted, nunca orange. |
| Stat/Counter *(novo)* | Hoje texto corrido no case Uno Healthcare | Promove a componente próprio, com contagem animada. Aplica Safety Orange no número ao completar a contagem. |
| Form Field + Stepper | Contato | Barra de progresso preenchendo recebe Safety Orange no segmento ativo + transição suave ao avançar etapa. O indicador de progresso deve expor semântica real (`role="progressbar"` com `aria-valuenow`/`aria-valuemax`) — não é só tratamento visual, é estado que precisa ser lido corretamente por tecnologia assistiva e, na prática, é fácil de implementar sem nunca de fato variar (largura fixa disfarçada de indicador). |
| Navigation item | Header | Indicador de estado ativo mantido — é um estado legítimo. Transição suave (150–200ms) na troca. |
| Breadcrumb *(novo)* | Landing pages por problema (`/solucoes/processos-manuais`) | Texto pequeno, Muted Slate, separador simples — nível de hierarquia mais baixo da página, nunca compete com o H1. |
| FAQ item *(novo)* | Landing pages por problema, artigo de blog | Pergunta em H3/peso médio, resposta em Body. Se for acordeão, o estado expandido é um dos poucos lugares fora do hero/stats onde uma micro-transição (150–200ms) é justificada — é literalmente um conteúdo mudando de estado. |
| CTA intermediário ("Atalho rápido") | Landing pages por problema | Reaproveita a anatomia do Card padrão — não é um componente novo, é uma variante de posicionamento (meio de página em vez de fim de seção). |
| Share row *(novo)* | Artigo de blog | **Exceção aprovada:** usa as cores oficiais de cada rede (LinkedIn, WhatsApp, X), não o ícone monocromático Graphite Navy do restante do sistema — reconhecimento de marca de terceiros tem prioridade sobre a consistência interna de ícone neste caso específico. Não estender essa exceção a outros ícones do site sem nova aprovação. |
| Author byline *(novo)* | Artigo de blog | Nome + link, tipografia Caption/Body — discreto, sem foto obrigatória por enquanto (o site usa "RC2 Soluções" como autor, não uma pessoa). |

### Sections

| Seção | Recomendação |
|---|---|
| Header | Sem mudança estrutural. |
| Hero | **Maior mudança do sistema.** Remove módulo diagramático. Headline ganha palavra cinética. CTAs mantidos. |
| Sintomas | Cards ganham ícone fino. Fundo/estrutura mantidos. |
| Competências | Mesma estrutura; H3 corrigido (sem condensed). |
| Produtos próprios | Sem mudança estrutural. |
| Prova social | Cases ganham componente Stat/Counter. Reviews mantidos. |
| Como trabalhamos | Referência visual do componente Numerado formal. |
| Blog preview | Thumbnail maior. |
| CTA band escura | Sem mudança — já alinhada. |
| **CTA band Contato** | **Correção obrigatória:** de fundo 100% orange para navy/neutro, com Safety Orange restrito aos botões. |
| Footer | Sem mudança — já consistente entre páginas. |

---

## 9. Representative Pages

### Home
Hero vira um único gesto (headline com palavra cinética + subtexto + CTAs), com respiro de "seção de assinatura". Primeiro pico real de peso visual da página, seguido de um vale deliberado nas seções seguintes. Números do case Uno Healthcare migram para o componente Stat/Counter — segundo momento de assinatura da página.

### Contato
Formulário mantém estrutura atual. A faixa "Já enviou sua demanda?" perde a competição visual com o formulário (hoje é 100% laranja) e passa a ter peso secundário, coerente com sua função de bifurcação de conveniência. Barra de progresso ganha transição suave. Correção da faixa full-orange é a aplicação mais direta do Princípio 5 e resolve a violação mais grave da auditoria.

### Soluções
Página mais longa e textual — testa se o componente Numerado aguenta repetição sem cansar. H1 corrigido (Bold, não condensed) faz os H2 de cada competência se destacarem mais, por não competirem mais com um H1 do mesmo peso. Blocos de lista ("Sinais na operação", "O que a RC2 faz") ganham ícones finos por item. Nenhum momento de interrupção cinética nesta página — proposital, é página de aprofundamento técnico, não de impacto emocional.

### Sobre
Herda o sistema sem tensão nova: H1 sai do condensed, fundo vai para `#FBFAF8`, bloco de citação do fundador ganha tratamento de pull quote, e os "01–05" da forma de trabalhar reaproveitam o mesmo componente Numerado da Home.

### Blog — Índice
Grid de Card Blog já definido (thumbnail maior, categoria, título, excerto, autor/data/tempo de leitura). Paginação segue o tratamento de botão secundário.

### Blog — Artigo individual
Objetivo muda de "converter/impressionar" para "ser lido confortavelmente". Coluna de leitura limitada (~680px), menor que o container padrão de 1280px. Título em H1 Bold — nem aqui o gesto cinético se aplica, é conteúdo, não um momento. Cabeçalho com eyebrow de categoria, título, metadata em Caption/Muted Slate. Citações em destaque reaproveitam o tratamento de borda-esquerda + itálico já usado em Sobre. Nenhum motion cinético ou contador — reforça que nem toda página precisa de um "momento".

Estrutura real confirmada (via leitura de conteúdo do artigo publicado): eyebrow de categoria → H1 → metadata (data/tempo de leitura) → corpo com H2/H3 → card de CTA a meio do artigo (reaproveita o Composite Card, não é um componente novo) → FAQ (ver componente FAQ item) → share row → posts relacionados (mesma anatomia do Card Blog) → author byline. Nenhum ponto dessa estrutura pede motion cinético — o único estado que muda nesta página é o FAQ, se for acordeão.

### Landing pages por problema *(nova entrada — mapeada via sitemap)*
Template usado em `/solucoes/processos-manuais` e `/solucoes/sistemas-desconectados`. Estrutura: breadcrumb → H1 → "Para quem é esta solução" (lista) → "Sinais do problema" (lista) → "Impacto no negócio" (lista com seta →) → CTA intermediário → "Causas comuns" → **"Caminho recomendado"**, que já usa o componente Numerado 1–5 — sinal de que o site tem, nesse ponto específico, o mesmo instinto de reuso que esta especificação está formalizando. Segue com "Serviços relacionados" (Card padrão) e FAQ. Herda o sistema normalmente; não introduz tensão nova além dos componentes já listados na Seção 8.

### `/servicos` e `/solucoes-com-ia` *(páginas órfãs — mapeadas via sitemap)*
Ambas ativas, indexadas e já no design system atual (mesmo nav, footer e cor das páginas auditadas), mas fora do menu principal. `/servicos` usa o mesmo padrão de bloco numerado 01/05–05/05 que "Landing pages por problema" usa 1–5 — mais um caso de reuso do componente Numerado. `/solucoes-com-ia` usa blocos com listas de seta (→), mesmo padrão de "Impacto no negócio". Visualmente, herdam o sistema sem ajuste adicional. A sobreposição de conteúdo com `/solucoes` (cobrir o mesmo território "por serviço" vs. "por problema") é uma questão de arquitetura de informação — **fora do escopo desta refatoração visual.**

### `/avaliacoes`
Página de cases e reviews. O bloco de avaliações do Google carrega via JavaScript e não é visível em leitura estática de conteúdo — precisa de checagem visual ao vivo (screenshot ou ambiente de dev) antes de especificar tratamento definitivo. O bloco "Cases de Sucesso" abaixo dele é texto simples, sem tensão nova.

---

## 10. Reference Library

| Referência | O que observar | Como adaptar | O que evitar copiar |
|---|---|---|---|
| **Salt Productions** (passthesalt.com) | Tipografia cinética no hero (palavras alternando), faixas de texto em movimento contínuo | Aplicar o mecanismo de troca de palavra no headline da Home, com o orange marcando o instante da troca | Linguagem "agência de eventos" espalhafatosa |
| **SquadEasy** (squadeasy.com) | Contadores animados, formas soltas decorando o hero, fotografia real de pessoas | Componente Stat/Counter contando ao entrar na viewport | Tom consumer/lifestyle, paleta vibrante de app de bem-estar |
| **Idle** (idle.space) | Troca cinética de palavra + fundo em vídeo escuro + composição assimétrica de elementos flutuantes | Sensação "futurista" via composição, não gradiente neon | Tom brincalhão/casual — não cabe no registro "especialista sóbrio" |
| **Michal Rome** (romemichal.pl) | Numeração de seção (01/02/03) como dispositivo de ritmo e navegação | Formalizar o componente Numerado em mais seções do site | — (baixo risco, é portfólio pessoal) |
| **Locatelli Advogados** (locatelliadv.com.br) | Autoridade B2B por prova concreta — fotografia real dos sócios, selos, tom sem alarmismo | Fotografia real do fundador/equipe em vez de ilustração ou stock | Estrutura burocrática de site de escritório tradicional |
| **Abel Fragrance** (abelfragrance.com) | Sofisticação por espaço, imagem grande e curadoria — não por enfeite | Uso generoso de espaço nos "momentos de assinatura" | Linguagem de carrinho/e-commerce |
| **VibeUI** (vibeui.org) | Comparação lado a lado como argumento visual direto | — (referência de estrutura, baixo uso direto) | Estética "ferramenta de IA" com badges genéricos |
| **Speedtask** (speedtask.com.br) | Ícone simples por benefício, prova social em parede de logos, estatística quantificada | Ícone fino por item de lista/feature | É concorrente direto de segmento — referência estrutural, nunca estética |
| **Toggl** (conhecimento geral) | Coragem de romper o template SaaS padrão | Lição de ousadia na execução do motion | Estilo maximalista/ilustrado não cabe no tom da RC2 |
| **MUI Store / 21st.dev** | Estrutura de grid limpa, componentes prontos | Referência de implementação de componentes (fora do escopo desta especificação visual) | — |

---

## 11. Do / Don't

| ✅ Fazer | ❌ Evitar |
|---|---|
| Safety Orange no instante em que algo muda de estado | Safety Orange como background permanente de seção |
| Barlow Condensed ExtraBold só no gesto cinético do hero | Condensed ExtraBold como H1 padrão de toda página |
| Motion que representa uma mudança real (contador, troca de palavra) | Motion decorativo (parallax, ícone "respirando", loop) |
| Numeral outline navy/muted como dispositivo de ritmo | Numeral em Safety Orange sólido |
| Ícone fino como acento de um rótulo | Ícone grande centralizado só para ocupar espaço |
| Fotografia real do fundador/equipe/operação | Stock genérico ou ilustração de robô/chip/cérebro digital |
| Hero comunicando transformação por linguagem | Fluxograma, nó-e-seta ou mockup de dashboard no hero |
| Sombra sutil + motion de entrada para sugerir camada | Sombra pesada, glow, blur de fundo, glassmorphism |

---

## 12. Implementation Handoff

Orientações visuais para quem for implementar — sem código.

### Prioridade de correção

1. **Faixa full-orange do Contato** — é a violação mais grave e mais visível encontrada na auditoria; menor esforço de implementação, maior impacto de conformidade com o brand guide.
2. **H1 condensado em todas as páginas** — afeta a leitura de toda a interface; trocar para Barlow Bold nos H1 de página é a correção tipográfica de maior alcance.
3. **Token de background** (`#F7F5F1` → `#FBFAF8` como padrão) — mudança de token único, propaga automaticamente se os componentes já referenciam a variável corretamente.
4. **Remoção do módulo diagramático do hero e implementação da palavra cinética** — maior esforço de desenvolvimento (requer decisão de copy e mecanismo de animação), mas é o elemento mais identitário da nova direção.
5. **Sistema de ícones** — introdução gradual, começando pelos cards de Sintomas e Competências.
6. **Componente Stat/Counter** — aplicar primeiro no case Uno Healthcare da Home, onde os números já existem no conteúdo atual.

### Decisões ainda em aberto para o time de implementação

- **Lista de palavras do headline cinético da Home.** A direção define o mecanismo ("Sua operação não precisa de mais [ferramentas/sistemas/planilhas]. Precisa funcionar melhor.") mas a lista final de palavras que alternam antes da interrupção precisa ser aprovada — é decisão de copy, fora do escopo desta refatoração visual.
- **Confirmação dos números de prova social** a serem usados no componente Stat/Counter (os já existentes no case Uno Healthcare — US$ 384 mil, 636 pedidos, 20+ anos — mas vale checar se há atualização antes de formalizar em componente reutilizável).
- **Estados de interação (hover/focus/active)** não puderam ser auditados nesta especificação — a auditoria partiu de screenshots estáticos. Recomenda-se revisão desses estados diretamente no ambiente de desenvolvimento antes do lançamento.
- **Widget de avaliações do Google em `/avaliacoes`** — carrega via JavaScript, não visível em leitura estática de conteúdo. Revisar com screenshot real ou ambiente de dev antes de especificar tratamento visual definitivo.
- **Decisão de produto sobre `/servicos` e `/solucoes-com-ia`** — ambas ativas e indexadas, mas fora do menu principal, cobrindo território parecido com `/solucoes`. Não é uma decisão visual, mas vale sinalizar ao time de produto antes da implementação, para não investir tempo de design em páginas que podem ser consolidadas ou descontinuadas.

### Fora do escopo desta especificação

Qualquer alteração de copy, arquitetura de informação, tecnologia, frameworks ou regras de negócio está fora do escopo de uma refatoração exclusivamente visual — registrado aqui apenas para clareza, não como recomendação pendente.

---

*RC2 Soluções · Refatoração Visual do Site · Creative Direction + UI System Specification · 2026*
