---
name: rc2-brand-system
description: Sistema visual da RC2 Soluções ("The High-End Tool 2.1") como regra operacional. Use SEMPRE que estiver criando ou alterando qualquer UI da RC2, revisando interface, mexendo em componentes visuais, escolhendo cores, tipografia ou espaçamento, aplicando tokens, avaliando aderência ao Brand Guide, ou executando QA visual e de acessibilidade. Também use ao escrever CSS, Tailwind, componentes React de UI, páginas, seções, cards, botões, formulários, ícones ou ao decidir fotografia e ilustração do site RC2. Cobre paleta Warm Base / Navy / Safety Orange, tokens --rc2-*, Barlow, contraste WCAG AA, proporção de cor, Lucide, e a lista de clichês visuais proibidos.
---

# RC2 Brand System — v2.1

Fonte de verdade: `documentos-base/RC2_Brand_Guide_v2.1.md`, seções 4 e 5.
Direção visual e antipadrões: `documentos-base/RC2_PROMPT_MESTRE_REFORMULACAO.txt`,
seções 7, 8 e 20.
Este arquivo **não substitui** essas fontes — traduz as duas em regras
acionáveis. Quando precisar de detalhe que não está aqui, leia a fonte.

**Precedência:** `AGENTS.md` e o Brand Guide vencem qualquer skill genérica de
design (`impeccable`, `frontend-design`, `tailwind-design-system`,
`ui-ux-pro-max`, `refactoring-ui` etc.). Use as genéricas para método; use esta
para os valores. Se uma skill genérica sugerir glow, glassmorphism, gradiente
colorido ou segunda família tipográfica, ignore essa parte.

## Conceito

**"The High-End Tool 2.1"** — estética de instrumentos de elite, painéis de
controle e ferramentas de alta performance. Referências: Braun/Dieter Rams,
sinalização industrial, interfaces de instrumentos profissionais, arquitetura
técnica.

**Conceito central: "Precisão em Estado Ativo."** A identidade vive da tensão
entre **profundidade** (Navy Core, Graphite Navy, Slate) e **energia** (Safety
Orange). O laranja é a assinatura operacional da RC2: indica ação, prioridade,
estado ativo e direção. Nunca é massa visual dominante.

A base clara usa neutros levemente **aquecidos** — evita a estética clínica. As
áreas escuras usam **navy profundo**, nunca preto absoluto nem verde estrutural,
e nunca o azul saturado típico de SaaS.

## Cor — use tokens, nunca hex literal

Todos os valores vivem em `src/app/globals.css` e no theme do Tailwind.
Componentes consomem `--rc2-*` ou utilitários derivados. **Nenhum hex literal em
componente.** Se falta um token para a cor que você quer, **pare e pergunte** —
não invente valor.

| Papel | Token | Valor |
|---|---|---|
| Fundo de página | `--rc2-bg` | `#F7F5F1` |
| Fundo alternativo | `--rc2-bg-alt` | `#FBFAF8` |
| Card / superfície | `--rc2-surface` | `#FFFFFF` |
| Superfície secundária | `--rc2-surface-2` | `#F2F3F4` |
| Títulos | `--rc2-heading` | `#0B1726` |
| Corpo de texto | `--rc2-text` | `#24313D` |
| Texto secundário | `--rc2-text-secondary` | `#66717D` |
| Texto muted | `--rc2-text-muted` | `#89939D` |
| Borda | `--rc2-border` | `#DDE2E7` |
| Borda suave | `--rc2-border-soft` | `#E8EAED` |
| Marca / CTA | `--rc2-brand` | `#FF5F1F` |
| Marca hover | `--rc2-brand-hover` | `#F04F14` |
| Marca active | `--rc2-brand-active` | `#DC4510` |
| Laranja para texto | `--rc2-brand-text` | `#C2410C` |
| Accent soft | `--rc2-accent-soft` | `#FFF0E9` |
| Footer | `--rc2-dark` | `#081827` |
| Seção escura | `--rc2-dark-2` | `#0C2032` |
| Superfície elevada | `--rc2-dark-elevated` | `#11283A` |
| Card escuro | `--rc2-dark-card` | `#132C40` |
| Borda escura | `--rc2-dark-border` | `#294054` |
| Texto em navy | `--rc2-dark-text` | `#FFFFFF` |
| Texto sec. em navy | `--rc2-dark-text-secondary` | `#C6CED6` |
| Success | `--rc2-success` | `#17835C` |
| Warning | `--rc2-warning` | `#A96000` |
| Error | `--rc2-error` | `#C43D3D` |

### Proporção obrigatória

**60–70% neutros claros · 20–30% Navy / Slate · até 10% Safety Orange.**

Safety Orange **abaixo de 10% da área visível** de qualquer página. Ele perde
força quando ocupa área grande — o papel dele é conduzir o olhar e marcar o
ponto de decisão. Nunca use laranja como background de página ou de seção
grande.

### Regras de contraste — WCAG 2.2 AA

1. **Botão laranja tem texto Graphite Navy `--rc2-heading` (`#0B1726`), nunca
   branco.** Branco sobre `#FF5F1F` dá 3.04:1 e reprova.
2. **Microcopy, link, eyebrow e label laranja em fundo claro usam Orange Text
   `--rc2-brand-text` (`#C2410C`).** `#FF5F1F` sobre `#F7F5F1` dá 2.79:1.
3. `#FF5F1F` continua obrigatório em **elementos gráficos**: ícones de ação,
   background de CTA, focus rings, indicadores, marcadores e linhas.
4. **Focus ring:** `#C2410C` em área clara, `#FF5F1F` em área navy. 2px de
   espessura, 2px de offset. Nunca `outline: none` sem substituto visível.
5. Estado (erro, sucesso, seleção) **nunca depende só de cor** — combine com
   ícone, texto, borda ou outro sinal.
6. `--rc2-text-muted` não carrega informação. Só placeholder e metadado
   descartável. Se o texto importa, use `--rc2-text-secondary`.
7. **Success e Warning só dentro de card branco** — sobre `#F7F5F1` caem para
   4.35:1 e 4.42:1.

### Superfícies

- **`#FFFFFF` é cor de card, não de página.** Fundo de página é `#F7F5F1`.
- **`#000000` não existe neste projeto.** O preto da marca é `#0B1726`.
- **Áreas escuras se separam por borda `#294054`**, não por diferença de tom:
  `#081827` e `#0C2032` diferem só 1.08:1 e leem como bloco único.
- Navy é para footer, CTA bands e seções de alto contraste — não para a página
  inteira.

### Verde

Verde **não é cor estrutural** da RC2. Só existe em dois casos: semântica de
Success e o verde próprio do WhatsApp em elementos diretamente ligados ao
serviço. O verde do WhatsApp nunca vira cor institucional, footer, card ou
seção.

## Tipografia — Barlow, família única

Pesos 300/400/500/600/700/800, `display: swap`. **Nunca adicionar segunda
família.** O mecanismo de carregamento depende desta versão do Next — consulte
`node_modules/next/dist/docs/` antes de implementar; não presuma
`next/font/google`.

| Uso | Especificação |
|---|---|
| Display / capa | Condensed ExtraBold 800 · uppercase · tracking +0.04em |
| H1 | Bold 700 · `tracking-[-0.02em]` · `--rc2-heading` |
| H2 | SemiBold 600 · `tracking-[-0.01em]` · `--rc2-heading` |
| H3 | Medium 500 · `--rc2-heading` |
| Body | Regular 400 · mínimo 16px · `leading-[1.7]` · `--rc2-text` |
| Eyebrow / label | uppercase · `tracking-[0.10em]` · `--rc2-brand-text` em área clara, `--rc2-brand` em navy |
| Caption | Light 300 · `--rc2-text-secondary` |

Regras:

- Condensed ExtraBold **apenas** em display e capa — o impacto vem da raridade.
- Headline com tracking negativo: aperta como tipo de instrumento de precisão.
- Nunca misture pesos adjacentes sem salto claro: Bold → Regular, não
  Bold → SemiBold.
- Itálico só para citação e referência técnica. Nunca decorativo.
- **Nunca tipografia serifada.**

## Ícones

**Lucide** (`lucide-react`), traço fino e geométrico, peso consistente ao longo
da tela. Cor `--rc2-heading` em contexto neutro, `--rc2-brand` apenas em ícones
de ação.

## Fotografia e ilustração

- **Fotografia operacional real:** ambientes de trabalho reais, telas de
  ferramentas em uso, pessoas em contexto operacional. Temperatura neutra a
  levemente quente. Sem overlay colorido, contraste controlado.
- **Evitar stock genérico** — nada de executivo de terno apontando para tela.
- **Diagramas e processos são linguagem visual da marca.** Fluxos, mapas de
  processo e elementos técnicos, em estilo plano ou isométrico discreto na
  paleta da marca. Gradiente só tonal e sutil dentro da família Navy/Neutral.

## Proibido

- Roxo, ciano, magenta, azul saturado e neon.
- **Gradientes coloridos** — sobretudo roxo+rosa ou azul+ciano de "startup de IA".
- Sombras coloridas.
- **Glow, glassmorphism genérico e efeitos sem função.**
- **Clichês visuais de IA:** robô, cérebro digital, chip, rede neural decorativa.
- Tipografia serifada.
- Layout sobrecarregado — o que a RC2 vende é clareza.

### Antipadrões de "site gerado por IA"

O resultado não pode parecer template automático. Evite também:

- blobs decorativos e background abstrato aleatório;
- **card para absolutamente tudo**;
- excesso de badges e pills decorativas;
- ícone genérico sem propósito;
- **dashboard fictício, métrica inventada, depoimento inventado, logo fictício**;
- elemento 3D sem justificativa;
- **grid previsível repetido em todas as seções**;
- imagem de banco genérica sem coerência;
- **seção existindo só para preencher a página**;
- excesso de animação;
- aparência de template SaaS quando não for apropriado.

**Cada elemento precisa de função clara dentro da narrativa da página.** Se você
não sabe dizer o que um bloco faz pela mensagem, ele não deveria estar ali.
- Verde escuro estrutural; reintrodução da paleta antiga.
- Inconsistência entre footers ou áreas dark de páginas diferentes.
- `transition-all` em novos elementos interativos.

### Valores legados — não podem existir em CSS ou componente

`#F5F0E8` · `#121212` · `#1E1610` · `#163020` · `#0D0D0F` · `#FFF` como fundo de
página · `#000` em qualquer contexto.

Exceção: os arquivos de imagem do logo em `public/images/` mantêm Ink Black
`#121212` por decisão de marca — só os arquivos de imagem. O logo Ink Black
nunca vai sobre navy (1.04:1); em footer e seção escura, use a versão clara.

## Premium não é efeito

**Visual premium não significa adicionar efeito.** A qualidade percebida da RC2
vem de:

1. **composição** — alinhamento, grid, relação entre blocos;
2. **whitespace** — respiro deliberado, não sobra;
3. **hierarquia** — o olho sabe onde ir primeiro;
4. **tipografia** — escala, peso e tracking corretos.

Nessa ordem. Antes de propor sombra, blur, gradiente ou animação, verifique se o
problema não é de espaçamento ou hierarquia. Quase sempre é.

Movimento serve para entrada, descoberta e orientação — nunca decoração. Só
`opacity` e `transform`; `will-change` apenas durante a animação;
`prefers-reduced-motion` deixa tudo visível e sem deslocamento.

## Checklist antes de entregar UI

- [ ] Zero hex literal no componente — só tokens `--rc2-*`.
- [ ] Botão primário com texto `--rc2-heading`.
- [ ] Laranja pequeno em fundo claro usando `--rc2-brand-text`.
- [ ] Focus ring visível, 2px, cor correta para o fundo.
- [ ] Laranja abaixo de 10% da área.
- [ ] Fundo de página `#F7F5F1`, branco só em card.
- [ ] Áreas dark separadas por borda `#294054`.
- [ ] Só Barlow.
- [ ] Ícones Lucide com peso consistente.
- [ ] Nenhum item da lista de proibidos.
- [ ] `npm run build` e `npm run audit:brand` passando.
- [ ] Screenshot antes/depois quando possível.
