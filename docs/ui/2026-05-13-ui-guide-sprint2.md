# Guia Rápido de UI — Sprint 2 (RC2)

## Objetivo
Garantir consistência visual entre Home, Serviços e Sobre com tokens, componentes e ritmo vertical padronizados.

## Tokens oficiais

### Tipografia
- `rc2-h1`: títulos principais (hero)
- `rc2-h2`: títulos de seção
- `rc2-h3`: títulos de cards/blocos
- `rc2-body-lg`: texto de apoio de hero
- `rc2-body`: texto corrido
- `rc2-label`: labels/eyebrows

### Espaçamento
- Ritmo base: 8pt
- Seções: `rc2-section`
  - mobile: `--space-section-y-mobile: 4rem`
  - desktop: `--space-section-y-desktop: 6rem`

### Radius
- Base: `--radius: 0.5rem`
- Escala derivada: `--radius-sm` a `--radius-2xl`

### Sombra
- `--shadow-soft`: elevação padrão de card
- `--shadow-lift`: elevação de hover

### Superfícies
- `--surface-0` a `--surface-3`
- Cards em fundo claro: `--surface-1`

## Componentes padronizados
- Botões: `buttonVariants` + classes de contexto (`ui-focus-ring`, contraste RC2)
- Cards: `rc2-card` + `rc2-card-hover`
- Labels: `SectionLabel`/`rc2-label`
- Links de ação: `rc2-action-link`
- Blocos de seção: `rc2-section`

## Regras de uso
- Um único CTA primário por seção.
- Texto secundário sempre em contraste reduzido (`/70` ou token secundário).
- Evitar estilos ad-hoc de `py-*`, `rounded-*` e `shadow-*` fora dos tokens.
- Preferir classes utilitárias RC2 em vez de valores locais repetidos.

## Heurística (Sprint 2)
- Score estimado pós-ajustes: **8.4/10**
- Principais ganhos:
  - Hierarquia tipográfica mais previsível.
  - Ritmo vertical consistente entre páginas.
  - Componentes com estados e elevação padronizados.
- Próximo passo para >9.0:
  - Unificar totalmente cartões de avaliações Google no mesmo sistema de tokens.

## Evidências de validação (2026-05-13)
- Build de produção (`npm run build`): concluído com sucesso.
- Typecheck (`npm run typecheck`): concluído sem erros.
- Lint (`npm run lint`): concluído sem erros (apenas warnings não bloqueantes).
- Playwright navegação (`tests/e2e/navigation.spec.ts`): **8/8** testes passando.
- Lighthouse Home (Acessibilidade): **96/100**.
  - Relatório: `docs/ui/lighthouse-sprint2-home.json`
