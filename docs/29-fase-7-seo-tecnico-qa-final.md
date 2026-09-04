# Fase 7 — SEO técnico e QA final

Fontes: `RC2_Correcoes_Recomendadas_Site.md` §21 (canonical, redirects, status
HTTP) e `RC2_Direcao_de_Arte_e_Sistema_Visual.md` §12 (pendências de QA visual).

---

## 1. Redirects — a cadeia de barra final foi eliminada

Todas as 19 regras testadas em runtime contra `next start`, seguindo cada
`Location` até o status final.

**Estado inicial:** 17 de 19 limpas em um salto. Duas com cadeia — `/about/` e
`/services/`, exatamente a pendência registrada em `docs/24` §5.1: o Next
normaliza a barra final **antes** de avaliar `redirects()`, então
`/about/` → `/about` → `/sobre`.

O §21 pede explicitamente `A → C` no lugar de `A → B → C`, o que reabriu a
decisão que a Fase 3 tinha adiado.

**Correção**, em `next.config.ts`:

1. `skipTrailingSlashRedirect: true` — desliga a normalização automática;
2. as consolidações passam a viver num array `MIGRACOES`, e cada entrada gera
   **duas regras** — `/x` e `/x/` — ambas apontando ao destino final;
3. um catch-all `/:path+/` → `/:path+` **no fim da lista** normaliza o resto do
   site. A ordem importa: viesse antes, capturaria `/servicos/` e recriaria a
   cadeia.

**Resultado medido — 49 URLs** (17 legadas + 17 com barra + 8 vivas + 7 vivas
com barra): **zero cadeias, todas em no máximo 1 salto, todas terminando em
200.**

Três contratos novos protegem isso: o pareamento com/sem barra, a posição do
catch-all, e a contagem de regras para `/zapbox`.

## 2. Canonical e meta descriptions

Doze rotas auditadas no HTML servido.

| Verificação | Resultado |
|---|---|
| Canonical presente e correto | 12/12 |
| Canonical duplicado entre rotas | nenhum |
| `description` duplicada entre rotas | nenhuma |
| `robots` coerente | `/privacidade` e `/termos` em `noindex`, e **ausentes do sitemap** — sem contradição |

**Nota sobre o §19:** ele recomenda `/privacidade` e `/termos` no sitemap. Elas
são `noindex`; incluí-las contradiria o próprio `robots`. Mantidas fora.

**Observação sem correção aplicada:** duas descriptions passam do que o Google
exibe (~155 caracteres) — `/zapbox` com 203 e `/solucoes` com 181. E cinco
títulos passam de 60 caracteres contando o sufixo `— RC2 Soluções`. Nada disso
quebra indexação; afeta o quanto aparece no resultado de busca. **Não alterei**:
é copy aprovada, e reescrever para caber é decisão editorial, não correção
técnica.

## 3. QA visual — o que a §12 não pôde auditar

### 3.1. Hover e focus

Auditados na rodada anterior (`docs/26` §9.1), onde apareceu o achado principal:
o anel de foco era `color-mix(#c2410c 20%, transparent)` a ~1,5px — invisível.
Corrigido lá. Reverificado aqui: hover e focus presentes e visíveis em todos os
componentes interativos das oito rotas públicas.

### 3.2. Active — cobertura incompleta, registrada

| Componente | `active` |
|---|---|
| Botão do formulário | sim |
| CTA primário do hero e da banda | sim |
| Link do footer | sim |
| CTA do header | não detectado |
| **Card de blog** | **não** |

O card não dá retorno nenhum ao clique. **Duas tentativas de corrigir
falharam** e foram revertidas:

- `active:translate-y-px` no `div` interno — `:active` se aplica ao elemento
  pressionado e a seus **ancestrais**; o `div` é descendente do `<a>`, então
  nunca recebe;
- `group-active:translate-y-px` — também não pegou na medição.

Preferi **reverter a deixar a classe no código**: classe morta parece
resolvido e é pior que ausência declarada. Fica como pendência com o motivo
registrado no próprio componente.

O "não detectado" do CTA do header é provavelmente limitação da medição — a
variante `brand` tem `active:` na cva — mas não confirmei, e não vou afirmar o
que não medi.

### 3.3. Widget de avaliações do Google (`/avaliacoes`)

O widget carrega via JavaScript a partir de `/api/google/places`.

**Ambiente local:** a rota responde **500** porque `GOOGLE_PLACES_API_KEY` e
`GOOGLE_PLACE_ID` não estão no `.env.local`. **Isso não é defeito de produção** —
é ausência de credencial local. Não dá para concluir daqui se o widget carrega
em produção; precisa ser verificado no ambiente com a chave.

**O que a falha revelou, e é defeito real:** o estado de erro renderiza
corretamente (mensagem + link para o Google Maps), mas usava **cinzas crus do
Tailwind fora do sistema de tokens** — `text-gray-600`, `text-gray-500`,
`bg-gray-200`, `bg-white`. Os três estados do componente foram migrados para os
tokens RC2:

| Antes | Depois |
|---|---|
| `bg-white` | `bg-rc2-surface` |
| `border-border` | `border-rc2-card-border` |
| `bg-gray-200` (skeleton) | `bg-rc2-surface-2` |
| `text-gray-600` | `text-rc2-text` |
| `text-gray-500` | `text-rc2-text-secondary` |

É exatamente o tipo de achado que a §12 previa: estados que só aparecem quando
algo falha nunca entram numa screenshot estática.

**Nota de método:** meu primeiro probe reportou "widget não renderiza nada" —
falso. A regex procurava `erro|falha|indisponível` e a mensagem real é "Não
conseguimos carregar as avaliações no momento". O fallback sempre esteve lá.

## 4. Validação

`npm run typecheck` · `npm run lint` (0 erros) · `npm run test` (**445**, com 5
contratos novos) · `npm run build` · `npm run audit:brand` ·
`npx playwright test`: 68 passando, 2 falhas pré-existentes
(`admin.spec.ts:44`, `home-motion.spec.ts:4`).

Runtime: 49 URLs de redirect, 12 rotas de metadata, 8 rotas de QA de estados.
