# Design: modo HTML no editor de posts

## Objetivo
Adicionar ao campo `Conteúdo do Artigo` do admin um modo alternável entre edição visual com TipTap e edição de HTML cru, sem alterar persistência, schema, actions do servidor ou renderização pública.

## Escopo
Incluído:
- Substituir o bloco atual do `RichEditor` em `src/components/admin/PostFormRefactored.tsx` por um wrapper pequeno dedicado ao campo `content`
- Oferecer toggle local `Visual | HTML`
- Manter `formData.content` como fonte única da verdade
- Exibir orientação explícita no modo HTML

Fora de escopo:
- Alterações em Supabase, schema, migrations ou colunas
- Alterações em `src/app/admin/(protected)/posts/actions.ts`
- Alterações na página pública do blog
- Preview de HTML no admin
- Uso de `dangerouslySetInnerHTML` no admin
- Refatorações nas demais abas do formulário
- Substituição ou refatoração funcional do TipTap

## Estado atual
- `src/components/admin/PostFormRefactored.tsx` renderiza diretamente `RichEditor` para o campo `content`
- O valor de `content` já é armazenado como string HTML em `formData.content`
- O submit já envia `content` como string para as server actions existentes
- A validação atual exige apenas string com tamanho mínimo
- A página pública já sanitiza o HTML na renderização

## Abordagem escolhida
Criar um componente novo, pequeno e isolado, por exemplo `PostContentEditor`, responsável apenas por:
- manter o estado local do modo atual: `visual` ou `html`
- renderizar `RichEditor` no modo visual
- renderizar `textarea` no modo HTML
- exibir um aviso de UX no modo HTML
- propagar toda mudança por `onChange`

`PostFormRefactored` continuará responsável apenas pelo estado do formulário e passará a importar esse wrapper no lugar do bloco atual do editor.

## Arquitetura
### `PostFormRefactored`
Mudança mínima:
- remover o bloco inline que hoje usa `RichEditor`
- importar `PostContentEditor`
- passar `content={formData.content}`
- passar `onChange={(html) => handleFieldChange("content", html)}`
- passar `error={state.errors?.content?.[0]}` ou equivalente

Nenhuma outra aba ou regra do formulário deve ser alterada.

### `PostContentEditor`
Responsabilidades:
- controlar localmente o modo ativo
- renderizar label, toggle, editor e orientação do campo
- não conhecer persistência, actions, tabs, SEO ou FAQ

Props:
- `content: string`
- `onChange: (value: string) => void`
- `error?: string`

Estrutura esperada:
- cabeçalho do campo com label `Conteúdo do Artigo`
- controle simples de alternância `Visual | HTML`
- corpo do campo com `RichEditor` ou `textarea`
- orientação visível somente no modo HTML
- mensagem de erro opcional abaixo do campo

## Fluxo de dados
Fonte única:
- `formData.content` continua sendo a única fonte de verdade

Modo visual:
- `RichEditor` recebe `content`
- `RichEditor` chama `onChange` com `editor.getHTML()`
- `PostFormRefactored` atualiza `formData.content`

Modo HTML:
- `textarea` recebe `value={content}`
- `textarea` chama `onChange(e.target.value)`
- `PostFormRefactored` atualiza `formData.content`

Alternância:
- ao trocar de `visual` para `html`, o `textarea` mostra exatamente a string HTML atual
- ao trocar de `html` para `visual`, o `RichEditor` recebe a string HTML atual por props e reutiliza a sincronização já existente
- pequenas normalizações do TipTap ao reidratar HTML são aceitáveis e fazem parte da decisão de produto aprovada

## UX e conteúdo da orientação
No modo HTML, mostrar um aviso curto e explícito, por exemplo:
- este modo aceita HTML cru do corpo do artigo
- use apenas marcação do conteúdo do post
- scripts, markup inválido ou estruturas fora do editor visual não são suportados
- a renderização pública continuará sujeita à sanitização existente

O texto final pode ser ajustado durante a implementação, desde que preserve essa orientação.

## Erros e comportamento seguro
- O componente não deve validar HTML no cliente além do que já existe hoje
- O componente não deve tentar fazer preview, parsing customizado ou sanitização no admin
- Em caso de HTML malformado, o valor segue para o fluxo atual e qualquer normalização futura continua sendo responsabilidade do editor visual e da renderização pública existente
- O erro de validação do campo `content` continua vindo do fluxo atual do formulário

## Impacto em arquivos
Arquivos a criar:
- `src/components/admin/PostContentEditor.tsx`

Arquivos a alterar:
- `src/components/admin/PostFormRefactored.tsx`

Arquivos a preservar sem mudanças planejadas:
- `src/components/admin/RichEditor.tsx`
- `src/app/admin/(protected)/posts/actions.ts`
- `src/lib/validations/post.ts`
- páginas públicas do blog

## Testes e verificação
Verificações mínimas:
- criar post novo usando modo visual
- criar post novo usando modo HTML
- alternar de visual para HTML e confirmar persistência do conteúdo atual
- alternar de HTML para visual e confirmar recarga do conteúdo no TipTap
- editar post existente com HTML salvo e abrir nos dois modos
- confirmar que erro de validação de `content` continua aparecendo no formulário
- confirmar que nenhuma outra aba do formulário foi afetada

## Critérios de aceitação
- O admin exibe um toggle local `Visual | HTML` no campo `Conteúdo do Artigo`
- O modo visual continua usando `RichEditor`
- O modo HTML usa `textarea` ligado ao mesmo `content`
- `formData.content` permanece como fonte única da verdade
- Não há preview HTML no admin
- Não há uso de `dangerouslySetInnerHTML` no admin
- Não há mudanças em banco, schema, server actions ou página pública
- A mudança fica restrita a um wrapper pequeno e ao ponto de uso no formulário
