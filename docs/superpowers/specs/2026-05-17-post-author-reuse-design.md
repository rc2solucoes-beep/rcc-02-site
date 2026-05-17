# Design: reaproveitamento de autores na aba Autor de posts

## Objetivo
Permitir reaproveitar autores já cadastrados na aba Autor do formulário de posts, evitando redigitar nome, cargo, foto, bio e LinkedIn a cada novo artigo, sem remover os campos `author_*` do post e preservando o snapshot histórico do autor em cada artigo.

## Escopo
Incluído:
- criar uma tabela persistente `authors`
- carregar autores server-side no fluxo de criação/edição de posts
- permitir selecionar um autor existente e preencher o snapshot do post
- permitir criar novo autor por modal reutilizável
- permitir editar autor existente pelo mesmo modal
- manter `author_id` e `author_*` salvos diretamente no post
- permitir edição inline do snapshot do post após selecionar um autor
- controlar a sincronização global por checkbox/callout na aba Autor

Fora de escopo:
- remover os campos `author_*` do post
- criar uma área separada `/admin/autores`
- alterar o contrato da página pública do blog
- refatorar outras abas do formulário
- alterar a lógica de conteúdo, SEO, FAQ, CTA, publicação, imagem ou relacionados

## Estado atual
- `src/components/admin/PostFormRefactored.tsx` mantém um estado consolidado do formulário
- `src/components/admin/PostFormTabs/AuthorTab.tsx` é hoje uma aba puramente manual
- `src/app/admin/(protected)/posts/actions.ts` já recebe e salva `author_id` e os campos `author_*`
- os posts já funcionam como snapshot histórico do autor no artigo
- não existe hoje uma tabela persistente de autores para reaproveitamento

## Decisão de arquitetura
Criar uma tabela `authors` persistente e manter os posts salvando os campos `author_*` diretamente.

A tabela `authors` passa a ser a fonte de preenchimento e reaproveitamento. O post continua sendo a fonte de snapshot histórico do artigo publicado.

Isso implica o seguinte modelo:
- selecionar autor existente preenche os campos `author_*` do post a partir de `authors`
- criar autor novo grava em `authors` e atualiza o formulário com o novo `author_id`
- editar autor existente via modal grava em `authors` e atualiza o snapshot do post
- editar manualmente o snapshot após selecionar um autor existente não altera o cadastro global automaticamente
- a sincronização global é controlada por um checkbox/callout explícito na aba Autor, não por pergunta modal no submit

## Banco de dados
Criar migration SQL para tabela `authors` com a estrutura aprovada:

```sql
create table if not exists authors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text,
  photo_url text,
  bio text,
  linkedin_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists authors_name_idx on authors (name);
```

Restrições explícitas:
- não remover nem alterar os campos `author_*` já existentes em `posts`
- atualizar `updated_at` manualmente em `updateAuthor`

## Validação
Criar validação Zod específica para Author.

Regras mínimas:
- `name` obrigatório
- `bio` com máximo de 500 caracteres
- `photo_url` e `linkedin_url` devem aceitar string vazia na UI, mas ser normalizados para `null` antes da validação de URL

Essa validação deve ficar separada da validação de post para manter responsabilidades claras.

## Arquitetura de código
### Tipos e dados
Adicionar um tipo `Author` correspondente à tabela `authors`, separado do tipo `Post`.

Criar um módulo dedicado para lógica de autores, por exemplo `src/lib/authors.ts` ou `src/lib/authors/service.ts`, responsável por:
- listar autores
- criar autor
- atualizar autor
- mapear `Author` para os campos snapshot do post
- normalizar dados do cadastro global antes de persistir

Esse módulo existe para evitar inchar `src/app/admin/(protected)/posts/actions.ts`.

### Ações dedicadas
Criar ações específicas para:
- `createAuthor`
- `updateAuthor`

Essas ações devem usar o módulo dedicado de autores.

As actions de post continuam salvando o post, mas passam a consumir helpers centrais de autores quando necessário.

### Carregamento server-side
As páginas de novo/editar post devem carregar a lista de autores no servidor.

Fluxo aprovado:
- páginas server-side de novo/editar post carregam `authors`
- passam `authors` como prop para `PostFormRefactored`
- `PostFormRefactored` repassa `authors` para `AuthorTab`

Isso reduz dependência de carregamento client-side e mantém o formulário pronto ao renderizar.

### `PostFormRefactored`
Continua dono do estado consolidado do formulário. Deve passar para a aba Autor:
- `formData`
- `onChange`
- `authors`
- callbacks para seleção, criação e edição de autor
- estado de autor selecionado
- estado booleano `sync_author_global`
- estado que detecta se o snapshot foi alterado após seleção de autor existente

A mudança deve ser mínima e concentrada apenas no fluxo da aba Autor.

### `AuthorTab`
Passa a reunir quatro responsabilidades de interface:
- seleção de autor existente
- edição manual do snapshot do post
- abertura do modal reutilizável para criar/editar autor
- exibição do checkbox/callout de sincronização global quando aplicável

A aba deve continuar exibindo os campos `author_name`, `author_title`, `author_photo`, `author_bio` e `author_linkedin`, porque eles continuam sendo o snapshot salvo no post.

### Modal reutilizável de autor
Criar um componente de modal único para:
- criar novo autor
- editar autor existente

O modal trabalha apenas com o cadastro global `authors`, não com o submit do post.

Ao confirmar:
- em modo criar, cria um novo registro em `authors`
- em modo editar, atualiza o registro existente em `authors`
- em ambos os casos, retorna os dados normalizados para atualização do estado do formulário

## Fluxo de dados
### Carregamento
Ao abrir a tela de novo/editar post:
- carregar a lista de autores de `authors` no servidor
- inicializar `formData.author_*` com os dados do próprio post, como hoje
- se `post.author_id` existir, marcar esse autor como selecionado sem sobrescrever automaticamente o snapshot já salvo no post

### Selecionar autor existente
Quando o usuário seleciona um autor existente:
- preencher `author_id`
- preencher `author_name`
- preencher `author_title`
- preencher `author_photo`
- preencher `author_bio`
- preencher `author_linkedin`
- inicializar `sync_author_global` como `false`
- limpar o estado de “snapshot local alterado” naquele momento inicial

### Criar novo autor
Quando o usuário clica `Novo autor`:
- abrir modal em modo criação
- ao salvar, inserir em `authors`
- atualizar a lista local de autores
- selecionar automaticamente o novo autor
- preencher o snapshot `author_*` do post com os dados retornados
- manter `sync_author_global` como `false`, porque o snapshot já reflete o cadastro recém-criado

### Editar autor existente pelo modal
Quando o usuário escolhe editar o autor selecionado:
- abrir o mesmo modal em modo edição
- ao salvar, atualizar `authors`
- atualizar a lista local
- manter o autor selecionado
- atualizar o snapshot `author_*` do post com a versão nova
- limpar o estado de divergência local, porque o snapshot volta a refletir o cadastro global

### Editar snapshot manualmente
Depois de selecionar um autor existente, o usuário pode alterar manualmente os campos do post.

Essa alteração deve:
- manter o `author_id`
- alterar apenas o snapshot local do post
- marcar um estado de “autor selecionado teve snapshot modificado”
- exibir na aba Autor um checkbox/callout com o texto:
  `Também atualizar o cadastro global deste autor com estes dados.`

### Salvar o post
No submit do post:
- se não houver `author_id`, manter o fluxo atual: salvar apenas snapshot no post
- se houver `author_id` e não houver modificação local após seleção, salvar normalmente o snapshot no post
- se houver `author_id`, houver modificação local e `sync_author_global=false`, salvar apenas o snapshot no post
- se houver `author_id`, houver modificação local e `sync_author_global=true`, atualizar `authors` primeiro e depois salvar o post
- se a atualização global falhar, não salvar o post e retornar erro claro

## UX proposta
Fluxo padrão para post novo:
- foco principal em `Selecionar autor existente`
- ação secundária `Criar novo autor`

Regras de interface:
- o seletor de autor deve deixar claro quando nenhum autor está selecionado
- os campos do snapshot continuam visíveis e editáveis
- o botão de editar autor existente só aparece quando há um autor selecionado
- o modal reutilizável muda título e ação conforme `Criar` ou `Editar`
- o checkbox/callout de sincronização global só aparece quando há autor existente selecionado e divergência local posterior

## Erros e comportamento seguro
- se a listagem de autores falhar no carregamento server-side, a página continua funcional em modo manual, com `authors` vazio
- se criar ou editar autor no modal falhar, o modal mostra erro e o estado do formulário não é sobrescrito
- se o usuário preencher manualmente sem selecionar autor, `author_id` permanece vazio e o post continua válido
- nenhuma falha de `authors` deve apagar o snapshot já digitado nos campos do post
- se a sincronização global estiver marcada e falhar, o post não é salvo naquele submit

## Impacto em arquivos
Arquivos a criar ou alterar, em alto nível:
- migration SQL para `authors`
- tipo `Author`
- validação Zod específica para Author
- módulo de dados/serviço de autores
- helper central `Author -> author_* do post`
- ações dedicadas `createAuthor` e `updateAuthor`
- `src/components/admin/PostFormTabs/AuthorTab.tsx`
- `src/components/admin/PostFormRefactored.tsx`
- páginas server-side de novo/editar post para carregar `authors`
- `src/app/admin/(protected)/posts/actions.ts` apenas no necessário para consumir a lógica dedicada

Arquivos a preservar conceitualmente:
- contrato dos campos `author_*` no post
- validações e renderização pública do snapshot do autor
- demais abas e fluxos do formulário

## Testes e verificação
Verificações mínimas:
- migration cria `authors`
- criar autor novo pelo modal
- selecionar autor existente e preencher snapshot
- editar autor existente pelo modal
- editar snapshot local sem alterar cadastro global
- editar snapshot local com checkbox marcado e atualizar cadastro global no submit
- salvar post sem autor continua funcionando
- posts antigos continuam funcionando
- página pública continua igual

Verificações adicionais de base técnica:
- string vazia vira `null` antes da validação de `photo_url` e `linkedin_url`
- `bio` respeita limite de 500 caracteres
- `name` é obrigatório no cadastro global

## Critérios de aceitação
- autores podem ser reaproveitados sem redigitar todos os campos
- posts continuam salvando `author_id` e `author_*` diretamente
- seleção de autor existente preenche snapshot do post
- criação de autor novo acontece por modal reutilizável
- edição de autor existente também usa o mesmo modal
- edição local do snapshot pode ou não sincronizar com `authors` conforme o checkbox de sincronização global
- salvar post sem autor continua funcionando
- posts antigos continuam funcionando
- página pública continua igual
- a mudança é localizada e não exige uma nova área admin de autores
