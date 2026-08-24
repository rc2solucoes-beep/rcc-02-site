# RC2 Soluções — Design Direction

## Fonte de verdade

- Guia de marca: `documentos-base/RC2_Brand_Guide_v2.1.md`
- Tokens implementados: `src/app/globals.css`
- Contexto operacional: `AGENTS.md`

## Direção visual

Madura, profissional e específica para consultoria operacional: off-white como base, navy para autoridade, Safety Orange como acento de decisão. A interface deve parecer sistema de gestão e operação, não landing page genérica de startup.

## Tokens e cor

- Componentes devem consumir tokens `--rc2-*` ou utilitários Tailwind derivados deles.
- O laranja é acento e CTA; não deve ocupar grandes áreas.
- Texto pequeno laranja usa `--rc2-brand-text`.
- Texto de botão primário usa `--rc2-heading`.
- Branco é superfície/card, não fundo de página.
- Verde só é permitido para WhatsApp e estados de sucesso.

## Tipografia

Barlow é a única família. Títulos usam presença editorial e line-height curto; textos longos mantêm leitura confortável. Eyebrows usam uppercase com tracking consistente e régua/acento quando isso ajuda a estrutura.

## Superfícies

Cards devem usar bordas, raio e sombra leve com tokens existentes. Evitar padrões repetitivos de “aba lateral” ou stripe decorativo em excesso. Citações usam card próprio com acento superior discreto.

## Movimento

Movimento serve para entrada, descoberta e orientação, não decoração. Usar CSS e IntersectionObserver para reveals. Propriedades permitidas: `opacity` e `transform`; `will-change` só durante animação. `prefers-reduced-motion` deve deixar tudo visível e sem deslocamento.

## Páginas internas

As páginas internas devem manter a mesma qualidade percebida da home: hero compartilhado com entrada sutil, conteúdo abaixo com reveal variado e cards/listas com ritmo. Evitar que páginas de detalhe pareçam documento estático.

## Não fazer

- Gradientes coloridos fora da paleta.
- Sombras coloridas.
- Robôs, cérebros, chips ou clichês visuais de IA.
- Hex literal em componente.
- `transition-all` em novos elementos interativos.
- Animações que dependem de JS para manter conteúdo visível.
