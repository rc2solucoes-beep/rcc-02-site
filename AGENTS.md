<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# RC2 Soluções — contexto de marca

> O bloco acima, entre os marcadores `nextjs-agent-rules`, é gerenciado por
> ferramenta e será regenerado. Não edite nada dentro dele. Todo o conteúdo da
> RC2 vive abaixo desta linha.

Fonte de verdade visual: `docs/brand/RC2_Brand_Guide_v3.md`, seções 4, 4B e 8.

## Projeto

Site institucional da RC2 Soluções — consultoria em IA, automações e operações
digitais para PMEs. Next.js, deploy na Vercel. O CTA único e consistente de
todas as páginas é "Solicitar diagnóstico", que leva para `/contato`.

Como o aviso acima deixa claro, **não assuma APIs do Next a partir da memória**.
Isso vale especialmente para carregamento de fontes, metadata, roteamento e
configuração de tema — consulte `node_modules/next/dist/docs/` antes de escrever
qualquer coisa que dependa dessas áreas. Se a API que você conhece não existir
mais, pare e diga qual é a substituta antes de implementar.

## Identidade visual v3

Off-white + Navy + Safety Orange. A paleta anterior ("High-End Tool": Areia
Industrial, Ink Black, Deep Forest) está **descontinuada**.

Todos os valores vivem em `styles/rc2-tokens.css` e no theme do Tailwind.
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

## Valores legados — não podem existir no repositório

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
implementar, integrar, operação, processo, resultado, diagnóstico, funcionar,
agente. Evitar: revolução, disruptivo, mágico, solução completa, líder de
mercado, simples assim, chatbot (é "agente de IA"), barato (é "acessível").

## Ao trabalhar

- Mudanças visuais vêm com screenshot antes/depois quando possível.
- Um componente por vez. Não refatorar arquivos fora do escopo da tarefa.
- Depois de qualquer mudança de estilo: `npm run build` e `npm run audit:brand`.
- Se um componente já usa token correto, não mexer.