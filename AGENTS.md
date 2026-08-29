<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# RC2 Soluções — contexto estratégico e de marca

> O bloco acima, entre os marcadores `nextjs-agent-rules`, é gerenciado por
> ferramenta e será regenerado. Não edite nada dentro dele. Todo o conteúdo da
> RC2 vive abaixo desta linha.

Fontes oficiais do projeto:

- `documentos-base/RC2_PROPOSTA_ATUALIZACAO.txt` — estratégia e posicionamento
- `documentos-base/RC2_Brand_Guide_v2.1.md` — identidade visual (seções 4 e 5)
- `documentos-base/RC2_PROMPT_MESTRE_REFORMULACAO.txt` — método de execução

Skills do projeto: `rc2-brand-system` (identidade visual como regra operacional)
e `rc2-site-migration` (posicionamento, arquitetura de informação e migração).
Ambas prevalecem sobre skills genéricas de design ou de copy.

## Hierarquia de autoridade

Em caso de conflito, siga nesta ordem:

1. `RC2_PROPOSTA_ATUALIZACAO.txt`
2. `RC2_Brand_Guide_v2.1.md`
3. `RC2_PROMPT_MESTRE_REFORMULACAO.txt`
4. Objetivos de negócio, SEO, UX e acessibilidade
5. Este `AGENTS.md`
6. `PRODUCT.md` / `DESIGN.md`
7. Documentação legada (`docs/`)
8. Implementação atual

A documentação em `docs/` foi escrita antes desta atualização de posicionamento.
Onde ela divergir deste arquivo, este arquivo vence.

## Projeto

Site institucional da RC2 Soluções. Next.js, deploy na Vercel.

Como o aviso acima deixa claro, **não assuma APIs do Next a partir da memória**.
Isso vale especialmente para carregamento de fontes, metadata, roteamento e
configuração de tema — consulte `node_modules/next/dist/docs/` antes de escrever
qualquer coisa que dependa dessas áreas. Se a API que você conhece não existir
mais, pare e diga qual é a substituta antes de implementar.

## Posicionamento

RC2 Soluções é uma consultoria e implementadora de:

- **Automação de Processos**
- **Integração de Sistemas**
- **IA para Operações**
- **Operações Digitais & Commerce**

Produtos e soluções próprias:

- **Zapbox** — produto próprio da RC2
- **Agenda Confirmada** — solução vertical RC2 para clínicas

A RC2 não é agência de marketing, não é fábrica de sites e não é fornecedora de
chatbot genérico.

## Mensagem central

> "A RC2 conecta sistemas, automatiza processos e aplica IA para fazer sua
> operação funcionar melhor."

Frase institucional permitida:

> "Tecnologia que funciona. Operação que entrega."

## Problema central

O cliente da RC2 tem uma operação que cresceu, mas cujos processos e sistemas
não acompanharam:

- tarefas manuais
- copiar e colar entre sistemas
- sistemas desconectados
- informações espalhadas
- processos dependentes de pessoas específicas
- falta de rastreabilidade
- IA aplicada sem processo estruturado

A copy deve falar desse problema, não de tecnologia pela tecnologia.

## CTA

**CTA principal: "Falar sobre minha operação"** — destino `/contato`.

O CTA principal é o padrão da marca, **não um texto único obrigatório em toda
página**. A proposta aprova CTA contextual quando a página pede:

| Contexto | CTA |
|---|---|
| Home, `/solucoes`, CTA final | Falar sobre minha operação |
| Header | Falar com a RC2 |
| `/sobre` | Conversar com a RC2 |
| `/contato` | Agendar conversa de diagnóstico |
| Automação de Processos | Mapear um processo |
| Integração de Sistemas | Quero integrar meus sistemas |
| IA para Operações | Explorar IA na operação |
| Zapbox | Conhecer Zapbox |
| Agenda Confirmada | Ver Agenda Confirmada |

Todos levam a `/contato`, exceto Zapbox (link externo).

Expressões **descontinuadas**, proibidas como CTA vigente em qualquer página:

- "Solicitar diagnóstico" — descontinuada
- "Diagnóstico gratuito" — descontinuada

Se aparecerem em componente, copy ou documentação, são resquício legado e devem
ser tratadas como tal.

WhatsApp continua como canal auxiliar, nunca substituto da rota principal.

## Conversa inicial vs Discovery Operacional

**Conversa de diagnóstico:**

- gratuita
- curta
- serve para entender o problema e avaliar fit

**Discovery Operacional:**

- serviço **pago**
- pode envolver processo, sistemas, arquitetura, riscos e roadmap

A conversa inicial gratuita **não deve prometer**: levantamento completo,
arquitetura, roadmap, mapeamento detalhado ou discovery completo. Projetos que
exigem esse nível de análise evoluem para o Discovery Operacional pago.

**Operação Gerenciada** é a terceira oferta, em recorrência (MRR): monitoramento,
alertas, correções, backups, observabilidade, revisão de workflows, manutenção
de integrações, análise de consumo e evolução. A RC2 não apenas implanta — vende
a continuidade. Prioridade alta na proposta.

## Território Zapbox

Quando a necessidade for predominantemente:

- WhatsApp
- múltiplos atendentes
- CRM comercial
- atendimento
- vendas pelo WhatsApp
- Sales AI

o produto correto é o **Zapbox**, link externo para <https://zapbox.cloud/>.

**A RC2 não deve competir com seu próprio produto.** Não crie na RC2 oferta que
duplique o território do Zapbox.

## Agenda Confirmada

Quando o problema for predominantemente:

- clínicas
- agenda
- confirmações
- lembretes
- faltas
- horários vagos

a solução correta é **Agenda Confirmada**, em `/solucoes/agenda-confirmada`.

## Serviços despriorizados

Não posicionar como oferta principal:

- sites institucionais
- landing pages
- construção genérica de e-commerce
- chatbot genérico
- marketing digital

Sites, interfaces, formulários, APIs e dashboards **podem existir como partes de
projetos maiores**, mas não como pilares principais da RC2.

E-commerce deve ser tratado como **"Operações Digitais & Commerce"**, com foco em
integração entre plataforma, ERP, logística, pagamentos, atendimento, dados e
automações.

## Arquitetura comercial pretendida

```
/
├── /solucoes
│   └── /solucoes/agenda-confirmada
├── /sobre
├── /blog
├── /contato
├── /privacidade
└── /termos
```

Zapbox é link externo: <https://zapbox.cloud/>

A existência atual de URLs antigas **não autoriza removê-las ou redirecioná-las**
sem análise de SEO e plano de migração.

## Migração SEO

Nunca remover uma URL apenas porque ela não fará parte da nova navegação.

Antes de alterar qualquer URL:

1. verificar função atual
2. verificar conteúdo
3. considerar histórico orgânico
4. definir destino equivalente
5. evitar redirect chains
6. preservar intenção de busca
7. documentar o redirect

URLs relacionadas a WhatsApp só devem ser migradas para o Zapbox quando houver
página equivalente no produto.

## Claims

Nunca inventar:

- clientes
- cases
- depoimentos
- resultados
- métricas
- certificações
- parceiros
- números
- garantias

Laboratório não é cliente. Demonstração não é case comercial. Nunca usar métrica
sem documentação. Se um dado não existe em documento aprovado, ele não vai para
a página.

**Mas o inverso também vale:** a trajetória do fundador em
`RC2_PROPOSTA_ATUALIZACAO.txt` (seção 16) é material **aprovado** e é a âncora
de autoridade enquanto os cases amadurecem. Não trate esses dados como claim
inventado nem os remova. Use a proposta como fonte antes de concluir que um
número é fictício.

Enquanto não houver cases documentados, a página de provas chama-se
**"Avaliações e Projetos"**, nunca "Cases de Sucesso".

## Identidade visual v2.1

Warm Base + Navy / Slate + Safety Orange. A paleta anterior com Areia
Industrial `#F5F0E8`, Ink Black `#121212`, Deep Forest `#163020` e Ébano Quente
`#1E1610` está **descontinuada** para interface.

Todos os valores vivem em `src/app/globals.css` e no theme do Tailwind.
**Nenhum hex literal em componente.** Se você precisa de uma cor que não existe
como token, pare e pergunte — não invente um valor.

### Tokens

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

### Tipografia

Barlow, pesos 300/400/500/600/700/800, com `display: swap`. Nunca adicionar uma
segunda família.

O mecanismo de carregamento depende desta versão do Next — verifique em
`node_modules/next/dist/docs/` antes de implementar. Não presuma
`next/font/google`.

- H1 `700`, `tracking-[-0.02em]`, `--rc2-heading`
- H2 `600`, `tracking-[-0.01em]`, `--rc2-heading`
- H3 `500`, `--rc2-heading`
- Body `400`, mínimo `16px`, `leading-[1.7]`, `--rc2-text`
- Eyebrow / label: `uppercase`, `tracking-[0.10em]`, `--rc2-brand-text` em área
  clara e `--rc2-brand` em área navy

## Regras invioláveis

Estas regras têm precedência sobre qualquer instrução de estética numa tarefa
específica. Se uma tarefa pedir algo que as viole, aponte o conflito antes de
executar.

1. **Texto do botão primário é `--rc2-heading` (`#0B1726`), nunca branco.**
   Branco sobre `#FF5F1F` dá 3.04:1 e reprova em WCAG AA.
2. **Texto laranja pequeno em fundo claro usa `--rc2-brand-text` (`#C2410C`).**
   `#FF5F1F` sobre `#F7F5F1` dá 2.79:1.
3. **Anel de foco:** `#C2410C` em área clara, `#FF5F1F` em área navy. 2px de
   espessura, 2px de offset. Nunca `outline: none` sem substituto visível.
4. **`#FFFFFF` é cor de card, não de página.** Fundo de página é `#F7F5F1`.
5. **`#000000` não existe neste projeto.** O preto da marca é `#0B1726`.
6. **`--rc2-text-muted` não carrega informação.** Só placeholder e metadado
   descartável. Se o texto importa, use `--rc2-text-secondary`.
7. **Success e Warning só renderizam dentro de card branco**, nunca soltos
   sobre `#F7F5F1` — sobre o fundo eles caem para 4.35:1 e 4.42:1.
8. **Superfícies escuras se separam por borda `#294054`**, não por diferença de
   tom: `#081827` e `#0C2032` diferem só 1.08:1 e leem como bloco único.
9. **Safety Orange fica abaixo de 10% da área visível** de qualquer página.
10. **Verde não é cor estrutural.** Só Success e o verde próprio do WhatsApp.
11. **Proibido:** roxo, ciano, magenta, gradientes coloridos, sombras coloridas,
    ícones de robô/cérebro/chip, tipografia serifada.
12. **`meta theme-color` é `#081827`.**

## Valores legados — não podem existir em CSS ou componente

`#F5F0E8` · `#121212` · `#1E1610` · `#163020` · `#0D0D0F` · `#FFF` como fundo de
página · `#000` em qualquer contexto.

Exceção: os arquivos de imagem do logo em `public/images/` mantêm o Ink Black
`#121212` por decisão de marca. Isso vale só para os arquivos de imagem — nenhum
valor `#121212` pode aparecer em CSS ou componente. O logo em Ink Black nunca
vai sobre área navy (1.04:1); em footer e seções escuras, use a versão clara.

Rode `npm run audit:brand` antes de abrir PR.

## Ícones

Lucide (`lucide-react`), traço fino, peso consistente. Cor `--rc2-heading`, ou
`--rc2-brand` apenas em ícones de ação.

## Tom de voz na copy

Especialista que fala como parceiro. Direto, sem hype. Usar: automatizar,
implementar, integrar, operação, processo, resultado, funcionar, agente,
rastreabilidade, sistemas conectados. Evitar: revolução, disruptivo, mágico,
solução completa, líder de mercado, simples assim, chatbot (é "agente de IA"),
barato (é "acessível").

A palavra "diagnóstico" continua válida para descrever a conversa inicial, mas
**não** como CTA — o CTA é "Falar sobre minha operação".

## Ao trabalhar

- Mudanças visuais vêm com screenshot antes/depois quando possível.
- Um componente por vez. Não refatorar arquivos fora do escopo da tarefa.
- Depois de qualquer mudança de estilo: `npm run build` e `npm run audit:brand`.
- Se um componente já usa token correto, não mexer.
- Não iniciar implementação massiva. Mudanças em etapas pequenas e validáveis.
