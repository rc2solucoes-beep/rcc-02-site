# Design: reaproveitamento de autores na aba Autor de posts

## Objetivo
Permitir reaproveitar autores já cadastrados na aba Autor do formulário de posts, evitando redigitar nome, cargo, foto, bio e LinkedIn a cada novo artigo, sem remover os campos `author_*` do post e preservando o snapshot histórico do autor em cada artigo.

## Escopo
Incluído:
- criar uma tabela persistente `authors`
- carregar autores existentes no fluxo de criação/edição de posts
- permitir selecionar um autor existente e preencher o snapshot do post
- permitir criar novo autor por modal reutilizável
- permitir editar autor existente pelo mesmo modal
- manter `author_id` e `author_*` salvos diretamente no post
- permitir edição inline do snapshot do post após selecionar um autor
- no submit do post, perguntar se alterações locais em autor existente também devem atualizar o cadastro global

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
- no submit do post, o sistema pergunta se a alteração local também deve atualizar o autor cadastrado

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

Observações:
- os nomes na tabela podem diferir ligeiramente dos campos do post, por exemplo `photo_url` versus `author_photo`
- o mapeamento entre cadastro global e snapshot do post deve ficar explícito em um helper central
- `updated_at` deve ser atualizado em alterações futuras do cadastro global

## Arquitetura de código
### Tipos e dados
Adicionar um tipo `Author` correspondente à tabela `authors`, separado do tipo `Post`.

Criar um módulo pequeno de dados, por exemplo `src/lib/authors.ts` ou `src/lib/authors/service.ts`, responsável por:
- listar autores
- buscar autor por id quando necessário
- criar autor
- atualizar autor
- mapear `Author` para os campos snapshot do post

Esse módulo existe para evitar inchar `src/app/admin/(protected)/posts/actions.ts` com toda a lógica de autores.

### `PostFormRefactored`
Continua dono do estado consolidado do formulário. Deve passar para a aba Autor:
- `formData`
- `onChange`
- lista de autores
- callbacks para seleção, criação e edição de autor
- flags de estado relacionadas a autor selecionado e snapshot alterado

A mudança deve ser mínima e concentrada apenas no fluxo da aba Autor.

### `AuthorTab`
Passa a reunir três responsabilidades de interface:
- seleção de autor existente
- edição manual do snapshot do post
- abertura do modal reutilizável para criar/editar autor

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
- carregar a lista de autores de `authors`
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
- limpar o estado de “snapshot local alterado” naquele momento inicial

### Criar novo autor
Quando o usuário clica `Novo autor`:
- abrir modal em modo criação
- ao salvar, inserir em `authors`
- atualizar a lista local de autores
- selecionar automaticamente o novo autor
- preencher o snapshot `author_*` do post com os dados retornados

### Editar autor existente pelo modal
Quando o usuário escolhe editar o autor selecionado:
- abrir o mesmo modal em modo edição
- ao salvar, atualizar `authors`
- atualizar a lista local
- manter o autor selecionado
- atualizar o snapshot `author_*` do post com a versão nova

### Editar snapshot manualmente
Depois de selecionar um autor existente, o usuário pode alterar manualmente os campos do post.

Essa alteração deve:
- manter o `author_id`
- alterar apenas o snapshot local do post
- marcar um estado de “autor selecionado teve snapshot modificado” para ser tratado no submit

### Salvar o post
No submit do post:
- se não houver `author_id`, manter o fluxo atual: salvar apenas snapshot no post
- se houver `author_id` e não houver modificação local após seleção, salvar normalmente o snapshot no post
- se houver `author_id` e o snapshot tiver sido modificado localmente, perguntar se também deve atualizar o cadastro global

Decisão no submit:
- se o usuário escolher atualizar o autor existente, atualizar `authors` primeiro e depois salvar o post
- se o usuário escolher não atualizar o autor existente, salvar apenas o snapshot no post
- se a atualização do autor falhar, o post não deve ser salvo naquele submit para evitar inconsistência com uma intenção explícita de sincronização global

## UX proposta
Fluxo padrão para post novo:
- foco principal em `Selecionar autor existente`
- ação secundária `Criar novo autor`

Regras de interface:
- o seletor de autor deve deixar claro quando nenhum autor está selecionado
- os campos do snapshot continuam visíveis e editáveis
- o botão de editar autor existente só aparece quando há um autor selecionado
- o modal reutilizável muda título e ação conforme `Criar` ou `Editar`
- a pergunta de sincronização global acontece apenas quando há um autor existente vinculado e edição inline posterior

## Erros e comportamento seguro
- se a listagem de autores falhar, a aba continua funcional em modo manual
- se criar ou editar autor no modal falhar, o modal mostra erro e o estado do formulário não é sobrescrito
- se o usuário preencher manualmente sem selecionar autor, `author_id` permanece vazio e o post continua válido
- nenhuma falha de `authors` deve apagar o snapshot já digitado nos campos do post

## Impacto em arquivos
Arquivos a criar ou alterar, em alto nível:
- migration SQL para `authors`
- tipo `Author`
- módulo de dados/serviço de autores
- componente de modal de autor
- `src/components/admin/PostFormTabs/AuthorTab.tsx`
- `src/components/admin/PostFormRefactored.tsx`
- `src/app/admin/(protected)/posts/actions.ts`

Arquivos a preservar conceitualmente:
- contrato dos campos `author_*` no post
- validações e renderização pública do snapshot do autor
- demais abas e fluxos do formulário

## Testes e verificação
Verificações mínimas:
- migration cria `authors`
- a lista de autores carrega na criação de post
- selecionar autor existente preenche snapshot no formulário
- criar novo autor via modal adiciona à lista e preenche o post
- editar autor existente via modal atualiza lista e snapshot
- editar snapshot manualmente após selecionar autor existente aciona a decisão no submit
- salvar com “atualizar autor existente” atualiza `authors` e salva snapshot no post
- salvar com “não atualizar autor existente” salva apenas snapshot
- fluxo manual sem `author_id` continua funcionando

## Critérios de aceitação
- autores podem ser reaproveitados sem redigitar todos os campos
- posts continuam salvando `author_id` e `author_*` diretamente
- seleção de autor existente preenche snapshot do post
- criação de autor novo acontece por modal reutilizável
- edição de autor existente também usa o mesmo modal
- edições inline posteriores no snapshot podem ou não sincronizar com `authors`, conforme decisão explícita do usuário no submit
- a mudança é localizada e não exige uma nova área admin de autores
