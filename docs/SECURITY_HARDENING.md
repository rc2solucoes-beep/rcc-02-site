# Security Hardening — Cabeçalhos HTTP e Cookies

> Registro das análises e decisões de endurecimento (hardening) de segurança do
> site público. Baseado no diagnóstico de pentest recebido em **2026-08-06**.

## Contexto

Um teste de pentest apontou achados de baixo risco relacionados a cabeçalhos
HTTP e cookies. A investigação (leitura de código + inspeção dos cabeçalhos reais
de produção) mostrou que **o domínio canônico `www.rc2solucoes.com.br` já está em
conformidade**; os achados se concentravam no **redirect do domínio apex** e em
um cabeçalho cosmético.

## Onde os cabeçalhos de segurança são definidos

- Arquivo: [`next.config.ts`](../next.config.ts) → `securityHeaders` + `async headers()`.
- Aplicados a `source: "/(.*)"`, ou seja, a todas as respostas servidas pelo app
  Next.js (inclui `www` e `/admin`).
- Incluem: HSTS (`max-age=31536000; includeSubDomains; preload`), `X-Content-Type-Options: nosniff`,
  CSP, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`.

## Achados e tratamento

| Achado do pentest | Situação real | Tratamento |
|---|---|---|
| HSTS sem `includeSubDomains` | Apenas na resposta do **redirect do apex**, servida pela borda da Vercel (`max-age=63072000`, sem `includeSubDomains`). O `www` já envia `includeSubDomains; preload`. | Ver "Pendência: apex" abaixo |
| `X-Powered-By` presente | `X-Powered-By: Next.js` era enviado nas respostas do app. | ✅ **Corrigido** — `poweredByHeader: false` em `next.config.ts` |
| Falta `X-Content-Type-Options` | Ausente apenas na resposta do redirect do apex (borda da Vercel). Presente (`nosniff`) no `www`. | Ver "Pendência: apex" abaixo |
| Tokens no armazenamento | Nenhum token em `localStorage`/`sessionStorage`. | ✅ Já em conformidade |
| Cookie sem `HttpOnly` | Cookies presentes: `_ga`, `_ga_*`, `_gcl_au` — todos do Google (Analytics/Ads), setados via JavaScript pelo GTM. | ⚠️ **Risco aceito** (ver abaixo) |

## Risco aceito — cookies de analytics sem `HttpOnly`

Os únicos cookies sem `HttpOnly` são de terceiros (Google Analytics/Ads),
injetados no navegador via JavaScript pelo Google Tag Manager (`GTM-MQF4K77`).
Por definição **não podem** ser `HttpOnly`, pois o próprio script do Google
precisa lê-los no cliente. Não contêm dados sensíveis da aplicação.

O cookie de sessão da aplicação (`sb-*`, Supabase Auth) **é `HttpOnly`**
(setado no servidor via `@supabase/ssr`) e, por isso, não é visível ao
JavaScript — confirmado por inspeção (`document.cookie` não expõe cookie de auth).

**Decisão:** aceitar como risco residual. Nenhuma ação de código necessária.

## Decisão: cabeçalhos do redirect do apex — risco aceito (2026-08-06)

**Decisão do usuário (2026-08-06):** manter como está. O risco é residual — o
usuário é redirecionado imediatamente ao `www`, que está totalmente conforme.
A pendência abaixo fica registrada caso, no futuro, se queira submeter o domínio
ao HSTS preload (o que exigiria uma ação no painel da Vercel).

## Detalhe técnico: por que o apex não recebe os cabeçalhos

O redirect `rc2solucoes.com.br` → `www.rc2solucoes.com.br` é servido pela
**borda da Vercel** (`Server: Vercel`, `X-Vercel-Id`, `Content-Type: text/plain`),
**antes** do app Next.js rodar. Por isso os cabeçalhos definidos em
`next.config.ts` **não alcançam** essa resposta, e o `proxy.ts` (middleware) também
não é executado para o apex.

Consequência prática: baixa (o usuário é redirecionado imediatamente ao `www`,
que está correto). O ponto relevante é a **elegibilidade ao HSTS preload**, que
exige que o domínio-base (apex) envie `includeSubDomains; preload`.

Opções para resolver (exigem ação no painel da Vercel — não é alteração de código):

- **Opção B (recomendada):** ajustar o redirect/HSTS do apex nas configurações de
  domínio da Vercel.
- **Opção A:** remover o redirect automático do apex na Vercel e fazer o apex
  servir o app; então tratar o redirect apex→www no `proxy.ts` anexando o conjunto
  completo de cabeçalhos. Requer ampliar o `matcher` do `proxy.ts` (passa a rodar
  em todas as rotas) e a alteração no painel — sem a alteração no painel, o código
  fica inerte.

> Enquanto essa pendência não for tratada, a regra de redirect apex→www em
> `next.config.ts` (`redirects()`) permanece redundante — nunca é alcançada,
> pois a Vercel intercepta o apex na borda.
