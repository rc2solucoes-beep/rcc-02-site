# Migração visual v2 → v3 · roteiro para o Codex CLI

Ordem importa. Cada fase depende da anterior. Não pule para a fase 3 antes dos
tokens existirem — o agente vai inventar hex literais.

## Preparação

```bash
cd seu-repo
git checkout -b feat/identidade-visual-v3

mkdir -p docs/brand styles scripts
# AGENTS.md: MESCLE com o existente, nao sobrescreva
# o bloco nextjs-agent-rules e gerenciado por ferramenta
cp ~/Downloads/AGENTS.md .
cp ~/Downloads/MIGRACAO.md docs/brand/
cp ~/Downloads/rc2-tokens-v3.css styles/rc2-tokens.css
cp ~/Downloads/audit-brand.sh scripts/
cp ~/Downloads/RC2_Brand_Guide_v3.md docs/brand/
chmod +x scripts/audit-brand.sh

git add -A && git commit -m "chore: tokens e contexto de marca v3"
```

Adicione ao `package.json`:

```json
"scripts": {
  "audit:brand": "bash scripts/audit-brand.sh"
}
```

---

## Fase 0 — Levantamento

Rode primeiro para saber o tamanho do problema:

```bash
npm run audit:brand
```

Depois, com o Codex em modo somente leitura:

```bash
codex --sandbox read-only
```

> Mapeie como as cores são definidas hoje neste projeto. Quero saber: se existe
> tailwind.config, se há CSS variables já definidas, quantos hex literais estão
> espalhados em componentes e em quais arquivos, se há dark mode implementado, e
> se o CTA "Solicitar diagnóstico" é um componente compartilhado ou está
> duplicado. Não altere nada — só me devolva o mapa e uma ordem de ataque.

Leia a resposta antes de seguir. Se ele disser que o CTA está duplicado em N
lugares, isso muda a fase 3.

---

## Fase 1 — Fundação dos tokens

```bash
codex
```

> Antes de qualquer coisa, leia node_modules/next/dist/docs/ para confirmar
> como esta versão do Next trata layout raiz, metadata e carregamento de fontes
> — não use APIs de memória. Depois integre `styles/rc2-tokens.css` ao projeto e
> espelhe os valores no theme do Tailwind, seguindo a tabela do AGENTS.md.
> Carregue Barlow nos pesos 300 a 800 com display swap pelo mecanismo que a
> documentação dessa versão indicar, e aplique como família padrão. Atualize o meta theme-color para #081827. Não
> altere nenhum componente ainda — só a fundação. Ao terminar, rode npm run
> build e me mostre o diff.

Aceite só se: o build passar, os tokens estiverem acessíveis, e nenhum
componente tiver sido tocado.

---

## Fase 2 — Primitivos

> Migre os componentes primitivos para os tokens v3: botão, link, card, input,
> badge e o estado de foco global. Regras críticas do AGENTS.md que se aplicam
> aqui: o botão primário tem fundo --rc2-brand e texto --rc2-heading, nunca
> branco; o anel de foco é --rc2-focus-ring em área clara e
> --rc2-focus-ring-dark em área navy, 2px com 2px de offset. Card é
> --rc2-surface com borda --rc2-border-soft. Nenhum hex literal. Me mostre cada
> componente antes de passar para o próximo.

Esta fase carrega quase todo o risco. Revise botão e foco com atenção — é o que
se propaga para o site inteiro.

---

## Fase 3 — Layout global

> Migre header, footer e o wrapper de página. Fundo de página é --rc2-bg. O
> footer é --rc2-dark com borda superior --rc2-dark-border de 1px. O logo no
> header e no footer precisa da versão correta para cada fundo. Links do footer
> usam --rc2-dark-text-secondary com hover em --rc2-brand.

---

## Fase 4 — Home, seção por seção

Não peça a home inteira de uma vez. Uma seção por prompt:

> Migre o hero da home para os tokens v3. Fundo --rc2-bg, headline
> --rc2-heading, subtítulo --rc2-text, eyebrow em --rc2-brand-text uppercase com
> tracking 0.10em. O CTA primário "Solicitar diagnóstico" segue a regra do botão
> primário. O botão de WhatsApp fica secundário, com o verde próprio do WhatsApp
> permitido apenas no ícone.

Depois, na mesma ordem do site: "Para quem é" → "Escolha pela sua dor" → "O que
entregamos" → "Diferencial" → "Avaliações" → CTA final.

Para a seção Diferencial, que é a área escura da home:

> Migre a seção Diferencial para --rc2-dark-2 como fundo, com borda
> --rc2-dark-border separando-a das seções vizinhas. Títulos em --rc2-dark-text,
> corpo em --rc2-dark-text-secondary. Se houver cards, use --rc2-dark-card.
> Atenção: essa seção e o footer têm tons muito próximos — a separação visual
> precisa vir da borda, não do tom.

---

## Fase 5 — Páginas internas

As rotas conhecidas do sitemap:

```
/servicos  /servicos/automacoes-com-ia  /servicos/agentes-de-ia
/servicos/automacao-de-processos  /servicos/e-commerce
/servicos/sites-e-landing-pages
/solucoes  /solucoes/atendimento-lento  /solucoes/leads-sem-resposta
/solucoes/processos-manuais  /solucoes/sistemas-desconectados
/solucoes-com-ia  /sobre  /blog  /contato  /avaliacoes
/privacidade  /termos
```

Em lote, por família:

> Migre as cinco páginas de /servicos para os tokens v3. Elas provavelmente
> compartilham um template — se compartilharem, migre o template e valide numa
> página. Se não, migre uma por uma e me avise da duplicação.

Depois `/solucoes`, depois as páginas avulsas. Deixe `/contato` para o fim: é
onde está o formulário, e formulário tem estados de erro, foco e disabled que
merecem atenção isolada.

---

## Fase 6 — Verificação

> Rode npm run audit:brand e corrija tudo que aparecer. Depois verifique o
> contraste de todo texto contra seu fundo real usando a tabela da seção 4B do
> brand guide, e me liste qualquer par que fique abaixo de 4.5:1 para texto
> normal ou 3:1 para elemento gráfico.

Manualmente, sem o agente:

- Navegue o site inteiro só com Tab. Todo elemento interativo tem foco visível?
- Lighthouse → acessibilidade deve dar 100.
- Abra a home no celular com brilho baixo: footer e seção Diferencial se
  distinguem?
- Meça o laranja: ele ocupa menos de 10% de cada tela?

---

## Fase 7 — Ativos

Fora do código, mas parte da migração:

- Logo Signal Interrupt rebriefado com âncora `#0B1726` (seção 5 do RC2_Brand_Guide_v3.md)
- `og_image_home.png` e demais OG images na paleta v3
- Favicon a partir do símbolo isolado, legível em 16px
- Capas de LinkedIn e Instagram

---

## Se o agente sair do trilho

Sintomas comuns e o que dizer:

| Sintoma | Correção |
|---|---|
| Inventou um hex que não está nos tokens | "Esse valor não existe no AGENTS.md. Use o token mais próximo ou me pergunte." |
| Botão primário com texto branco | "Regra 1 do AGENTS.md. Texto do botão primário é --rc2-heading." |
| Removeu outline de foco | "Regra 3. Reverta e implemente o anel de 2px." |
| Refatorou arquivos fora do escopo | "Reverta o que está fora da tarefa e refaça só o pedido." |
| Aplicou fundo branco na página | "Regra 4. Branco é card, página é --rc2-bg." |

Commit por fase. Se uma fase sair torta, `git reset --hard` custa menos que
desfazer no braço.
