# Admin Security Hardening Design

## Objective

Corrigir a Prioridade 1 de seguranca do painel administrativo removendo endpoints inseguros de setup/debug, centralizando a autorizacao administrativa server-side e restringindo o bootstrap do primeiro admin a um fluxo tecnico explicito com sessao valida e token de bootstrap.

## Scope

Incluido neste trabalho:

- Deletar `src/app/api/admin/ensure-admin/route.ts`
- Deletar `src/app/api/admin/debug/route.ts`
- Deletar `src/app/admin/status/page.tsx`
- Criar `src/lib/admin/requireAdmin.ts`
- Endurecer `src/app/api/admin/init/route.ts`
- Atualizar `src/app/api/upload/route.ts` para usar `requireAdmin()`
- Simplificar `src/app/admin/page.tsx` para fluxo login-only
- Corrigir `src/proxy.ts` para nao redirecionar automaticamente qualquer usuario autenticado de `/admin` para `/admin/dashboard`
- Ajustar proxy ou matcher de `/api/admin/:path*` apenas como camada adicional, se existir ponto apropriado no projeto

Fora de escopo:

- Alteracoes no layout publico
- Mudancas de conteudo do site
- Criacao de novo fluxo visual de bootstrap
- Script local de bootstrap administrativo

## Security Goals

- Nenhuma rota HTTP pode promover um usuario a admin sem sessao valida.
- Nenhuma rota HTTP pode promover um usuario a admin sem token explicito de bootstrap.
- Nenhum endpoint de debug administrativo pode expor sessao, e-mail, `userId` ou lista de admins em producao.
- `createServiceClient()` nao pode permanecer acessivel em endpoints publicos fora de um bloco de bootstrap fortemente condicionado.
- A autorizacao real de admin deve acontecer dentro de cada handler sensivel, nao apenas em proxy ou matcher.

## Current Risks

### `src/app/api/admin/ensure-admin/route.ts`

O endpoint aceita `userId` e `email` do corpo da requisicao e insere diretamente em `admin_users` com `createServiceClient()`, sem exigir sessao valida, permissao administrativa ou token de bootstrap.

### `src/app/api/admin/debug/route.ts`

O endpoint expoe status de sessao, dados do usuario autenticado e relacao de admins. Isso amplia a superficie de enumeracao e revela detalhes operacionais desnecessarios.

### `src/app/api/admin/init/route.ts`

O endpoint promove automaticamente o primeiro usuario autenticado quando `admin_users` esta vazia. Isso permite bootstrap acidental ou malicioso pela interface.

### `src/app/admin/page.tsx`

A pagina atual trata `201` de `/api/admin/init` como fluxo de setup bem-sucedido e possui estados visuais de criacao de admin, o que conflita com a postura de login-only.

### `src/proxy.ts`

O proxy atual redireciona qualquer usuario com sessao em `/admin` diretamente para `/admin/dashboard`, antes que a pagina de login possa consultar `/api/admin/init`. Isso cria redirecionamento incorreto para usuarios autenticados sem permissao admin e pode gerar loop ou UX inconsistente.

### `src/app/api/upload/route.ts`

A rota implementa verificacao administrativa localmente, duplicando logica de autorizacao e dificultando consistencia futura.

## Proposed Design

### 1. Remove insecure HTTP surface

Apagar permanentemente:

- `src/app/api/admin/ensure-admin/route.ts`
- `src/app/api/admin/debug/route.ts`
- `src/app/admin/status/page.tsx`

Nao havera versao alternativa via rota HTTP para desenvolvimento local. Qualquer necessidade futura de bootstrap manual deve ocorrer por script local controlado ou diretamente no ambiente Supabase.

### 2. Add central admin authorization helper

Criar `src/lib/admin/requireAdmin.ts` com funcao server-side baseada em `createSessionClient()`.

Contrato:

- Sem sessao ou com erro de sessao: retorna `{ ok: false, status: 401, user: null, email: null, userId: null }`
- Sessao valida sem registro em `admin_users`: retorna `{ ok: false, status: 403, user, email, userId }`
- Sessao valida com registro em `admin_users`: retorna `{ ok: true, status: 200, user, email, userId }`

Responsabilidades:

- Ler a sessao autenticada do Supabase no contexto server-side
- Consultar `admin_users` via cliente com contexto de sessao
- Padronizar o comportamento de autorizacao para APIs e outros pontos server-side

O helper nao promove usuarios, nao usa `createServiceClient()` e nao aplica logica de bootstrap.

### 3. Harden `src/app/api/admin/init/route.ts`

`/api/admin/init` permanece como unico endpoint tecnico relacionado a bootstrap administrativo.

Fluxo de verificacao normal:

- Obter sessao do usuario autenticado
- Se nao houver sessao, retornar `401`
- Verificar se o usuario atual ja esta em `admin_users`
- Se estiver, retornar `200`
- Se houver admins existentes e o usuario nao for admin, retornar `403`

Fluxo de bootstrap:

- Executar apenas se o usuario autenticado nao for admin
- Confirmar que `ADMIN_BOOTSTRAP_TOKEN` existe no ambiente
- Confirmar que o header `x-admin-bootstrap-token` foi enviado
- Confirmar que o valor do header corresponde ao token configurado
- So entao entrar no branch de bootstrap com `createServiceClient()`
- Dentro desse branch, executar uma operacao atomica no banco para verificar se `admin_users` esta vazia e inserir o primeiro admin sem race condition

Restricoes obrigatorias:

- `createServiceClient()` fica restrito exclusivamente ao branch de bootstrap, depois de sessao valida e token valido
- A criacao do primeiro admin deve ser atomica no banco; nao usar `count` seguido de `insert` em duas etapas independentes
- Sem token, token invalido ou token ausente no ambiente: retornar `403`
- O token nunca aparece em logs
- O token nunca aparece em respostas JSON
- Respostas nao devem expor detalhes sensiveis sobre configuracao interna

Respostas esperadas:

- `200`: usuario autenticado ja e admin
- `201`: primeiro admin criado com bootstrap valido
- `401`: sem sessao autenticada
- `403`: autenticado sem permissao, token ausente, token invalido, ou bootstrap nao permitido
- `500`: falha inesperada no servidor

### 4. Make `/admin` login-only

Simplificar `src/app/admin/page.tsx` para dois estados efetivos de interface:

- `checking`
- `login`

Comportamento:

- Ao carregar, a pagina pode chamar `POST /api/admin/init` apenas para verificar permissao
- Se a resposta for `200`, redirecionar para `/admin/dashboard`
- Se a resposta for `401`, mostrar a tela de login
- Se a resposta for `403`, manter a tela de login e exibir erro de permissao
- `201` nao faz parte do fluxo normal da interface e nao deve produzir qualquer UX de setup

Remocoes obrigatorias:

- `PageMode` relacionado a setup
- estado `setup-success`
- `setupEmail`
- `showSetupCheck`
- `handleSetupSubmit`
- qualquer mensagem ou componente visual de criacao de admin

O resultado final e que navegar pela interface nunca promove um usuario a admin por si so.

### 5. Reuse `requireAdmin()` in sensitive handlers

Atualizar `src/app/api/upload/route.ts` para usar `requireAdmin()` em vez de uma verificacao local ad hoc.

Comportamento esperado:

- `401` quando nao houver sessao
- `403` quando houver sessao sem privilegio admin
- seguir com upload apenas quando `requireAdmin()` retornar `ok: true`
- ao tocar na rota, manter ou endurecer as invariantes de seguranca do upload; nao permitir ampliacao acidental do allowlist de arquivos aceitos nem composicao insegura de `blobPath`

Diretriz futura:

- Qualquer nova rota em `src/app/api/admin/**` deve usar `requireAdmin()` para verificacao normal de admin
- Outros pontos server-side que alterem dados administrativos devem reutilizar o helper quando aplicavel

### 6. Proxy or matcher as secondary barrier

Se houver middleware, proxy ou matcher apropriado, ele pode incluir `/api/admin/:path*` como camada defensiva adicional. Isso nao substitui verificacao no handler.

Regra de arquitetura:

- proxy ou matcher filtra precocemente quando possivel
- handlers continuam sendo a fonte primaria de autorizacao

Correcao obrigatoria em `src/proxy.ts`:

- manter redirecionamento de rotas protegidas como `/admin/dashboard` e `/admin/:path+` para `/admin` quando nao houver sessao
- permitir que `/admin` carregue mesmo quando ja existir sessao
- nao redirecionar automaticamente qualquer usuario autenticado de `/admin` para `/admin/dashboard`
- deixar a decisao de redirecionar para `src/app/admin/page.tsx`, apos chamada a `/api/admin/init`
- evitar loop para usuario autenticado sem permissao admin

## Logging

Adicionar logs server-side minimos e sem dados sensiveis:

- `console.warn` para tentativa de bootstrap sem token enviado
- `console.warn` para token de bootstrap invalido
- `console.warn` para acesso sem sessao em rotas administrativas sensiveis
- `console.warn` para acesso com sessao sem permissao administrativa
- `console.info` ou `console.warn` para criacao bem-sucedida do primeiro admin, sem imprimir e-mail, token, chaves ou payloads sensiveis
- `console.error` para falhas inesperadas de servidor

Nao registrar:

- token de bootstrap
- service role key
- cookies
- senha
- corpo completo de requisicoes sensiveis

## Data Flow

### Admin verification

1. Request chega ao handler server-side
2. Handler chama `requireAdmin()`
3. `requireAdmin()` valida sessao com `createSessionClient()`
4. `requireAdmin()` consulta `admin_users`
5. Handler responde `401`, `403` ou continua a operacao

### First admin bootstrap

1. Usuario faz login normalmente e estabelece sessao
2. Chamada manual faz `POST /api/admin/init` com header `x-admin-bootstrap-token`
3. Handler valida sessao
4. Handler verifica se usuario ja e admin
5. Handler verifica se `admin_users` esta vazia
6. Handler valida `ADMIN_BOOTSTRAP_TOKEN` do ambiente e header recebido
7. Handler usa `createServiceClient()` apenas para inserir o primeiro admin
8. Chamadas futuras de usuarios nao-admin sem token valido recebem `403`

## Error Handling

- Respostas para cliente devem ser curtas e genericas
- `401` indica ausencia de sessao
- `403` indica falta de permissao ou bootstrap nao autorizado
- `500` indica erro inesperado
- Nenhuma resposta deve incluir segredo, stack trace ou detalhes internos de configuracao

## Testing Strategy

Validacoes minimas esperadas:

- `POST /api/admin/init` retorna `401` sem sessao
- `POST /api/admin/init` retorna `200` para admin existente autenticado
- `POST /api/admin/init` retorna `403` para usuario autenticado nao-admin quando ja existe admin
- `POST /api/admin/init` retorna `403` quando `admin_users` esta vazia mas o header de token nao foi enviado
- `POST /api/admin/init` retorna `403` quando o token enviado e invalido
- `POST /api/admin/init` retorna `201` apenas quando `admin_users` esta vazia e o token valido foi enviado
- `/api/upload` retorna `401` sem sessao
- `/api/upload` retorna `403` para usuario autenticado sem admin
- `/api/upload` permite operacao apenas para admin autenticado
- `src/app/admin/page.tsx` nao exibe mais fluxo de setup
- `src/proxy.ts` permite carregar `/admin` com sessao existente sem redirecionar automaticamente para `/admin/dashboard`
- As rotas e paginas deletadas deixam de existir

## Implementation Notes

- Ler o guia relevante de `node_modules/next/dist/docs/` antes de editar codigo do App Router, conforme `AGENTS.md`
- Preservar o layout publico e o comportamento de areas nao relacionadas
- Evitar criar novos contratos de resposta diferentes entre handlers administrativos sem necessidade

## Acceptance Criteria

- `src/app/api/admin/ensure-admin/route.ts` nao existe mais
- `src/app/api/admin/debug/route.ts` nao existe mais
- `src/app/admin/status/page.tsx` nao existe mais
- `/admin` funciona apenas como login e verificacao de permissao
- `src/proxy.ts` nao redireciona automaticamente qualquer sessao autenticada de `/admin` para `/admin/dashboard`
- Nenhum usuario vira admin apenas navegando pela interface
- `requireAdmin()` existe e centraliza verificacao administrativa server-side
- `/api/upload` usa `requireAdmin()`
- `/api/admin/init` usa `createServiceClient()` apenas dentro do bootstrap final protegido por token
- Nenhuma rota HTTP promove admin sem sessao valida e token explicito de bootstrap
