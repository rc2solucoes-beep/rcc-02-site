# Tipografia e ritmo — design aprovado

## Objetivo

Corrigir tracking, recuperar a raridade do Barlow Condensed ExtraBold e criar contraste de ritmo vertical sem alterar copy nem estrutura de componentes.

## Tipografia

- `.rc2-h1` e `.rc2-display`: `letter-spacing: -0.02em`.
- `.rc2-h2`: `letter-spacing: -0.01em`.
- Tracking positivo permanece apenas em labels e textos uppercase pequenos.
- Barlow Condensed ExtraBold fica restrito ao H1 da página. As páginas 404 e de erro mantêm o display porque o numeral é o heading principal e único uso da página.
- CTAs, números de processo, nota de avaliações e o H2 “Diferencial” usam Barlow regular. CTAs e números usam peso 700; H2 usa peso 600.

## Ritmo vertical

As variantes modificam `.rc2-section` sem substituir seu comportamento padrão:

| Variante | Mobile | Desktop |
|---|---:|---:|
| `opening` | 80px topo / 64px base | 128px topo / 88px base |
| `argument` | 48px / 48px | 72px / 72px |
| `proof` | 32px / 32px | 48px / 48px |
| `closing` | 80px / 80px | 112px / 112px |

- `/sobre`: `opening` → `argument` → `closing`.
- `/servicos`: `opening` → `proof` → `closing`.
- A home não recebe variantes de ritmo nesta etapa.

## Evidência e aceite

- Capturas antes/depois do hero e “Diferencial” da home em 1440px.
- Capturas completas antes/depois de `/sobre` e `/servicos` em 1440px e 390px.
- Relatório da razão entre maior e menor tamanho de texto renderizado dentro de `main`.
- `npm run build`, `npx playwright test` e `npm run audit:brand` sem falhas bloqueantes.

