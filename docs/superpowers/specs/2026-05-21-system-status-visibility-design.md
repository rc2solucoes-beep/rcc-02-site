# Fase 1 — Visibilidade do Status do Sistema (Nielsen)

Data: 2026-05-21
Status: Design aprovado em brainstorming
Escopo: incremental, sem redesign, sem refatoração ampla

## Objetivo
Melhorar a visibilidade do status do sistema em pontos críticos da jornada pública, com foco em formulário, CTAs/WhatsApp, menu mobile e estados assíncronos relevantes.

## Diretriz principal
Aplicar mudanças pequenas, rastreáveis e de baixo risco, reutilizando os padrões visuais e técnicos existentes da RC2.

## Escopo aprovado
1. Formulário de diagnóstico (`ContactForm`).
2. CTAs e links de WhatsApp.
3. Menu mobile (`Header`).
4. Estado vazio do blog.
5. Estados de carregamento/erro/vazio/sucesso no `GoogleReviews`, se faltarem claramente e sem refatoração ampla.

## Fora de escopo
- Redesign visual.
- Mudança de paleta/tipografia.
- Alterações em banco, migrations ou regras de negócio.
- Nova camada de dados.
- Ampliação para outros componentes assíncronos além de `GoogleReviews` (salvo bug evidente e ajuste simples).

## Arquivos-alvo
- `src/components/marketing/ContactForm.tsx`
- `src/app/(public)/contato/page.tsx`
- `src/components/marketing/HeroActions.tsx`
- `src/components/layout/Header.tsx`
- `src/components/layout/Footer.tsx`
- `src/components/marketing/CTABlock.tsx`
- `src/components/GoogleReviews.tsx` (ou equivalente real)
- `src/app/(public)/blog/page.tsx`
- `src/app/globals.css` (somente se necessário para acessibilidade/estado)
- `src/lib/tracking.ts` (somente para verificar não regressão)

## Design funcional

### 1) Formulário de diagnóstico

#### Etapa 1 — validação ao avançar
- Ao clicar no botão de avanço com campos inválidos:
  - mostrar mensagem geral visível e acessível: “Revise os campos destacados antes de continuar.”
  - manter erros por campo já existentes.
  - mover foco para o primeiro campo inválido da etapa.

#### Indicador de progresso
- Tornar explícito:
  - “Etapa 1 de 2 — Informações iniciais”
  - “Etapa 2 de 2 — Dados da empresa”
  - “Tempo estimado: 1 minuto”

#### Botão de avanço
- Trocar “Próximo” por “Continuar para dados da empresa”.

#### Envio (etapa 2)
- Durante envio:
  - `submit` desabilitado (já existente, manter).
  - `voltar` desabilitado (já existente, manter consistente).
  - texto do botão: “Enviando solicitação...”.
  - texto auxiliar discreto: “Estamos registrando seu diagnóstico. Não feche esta página.”
  - aplicar `aria-busy` no formulário (ou container equivalente).

#### Sucesso
- Manter confirmação e incluir orientação de próximo passo com fallback WhatsApp.

#### Erro
- Mensagens claras e acionáveis por cenário:
  - conexão
  - falha de servidor
  - muitas tentativas (quando identificável)
- oferecer fallback WhatsApp em contexto de erro.

### 2) CTAs e links WhatsApp
- Padronizar microcopy para deixar claro que é ação externa para WhatsApp.
- Confirmar `target="_blank"` + `rel="noopener noreferrer"` nos links externos.
- Não alterar tracking e não introduzir latência de clique.

### 3) Menu mobile
- Manter `aria-expanded`.
- Garantir rótulo dinâmico “Abrir menu” / “Fechar menu”.
- Incluir fechamento por tecla `Esc` com implementação simples.
- Preservar foco visível nos elementos interativos.

### 4) Blog — estado vazio
- Revisar mensagem de estado vazio para ação clara (serviços/contato), sem ampliar escopo de copy.

### 5) GoogleReviews — estados explícitos
- Verificar implementação atual.
- Se faltarem estados explícitos, adicionar de forma local e incremental:
  - carregando
  - erro
  - vazio
  - sucesso
- Se a mudança exigir refatoração maior, não forçar nesta fase; documentar recomendação futura.

## Acessibilidade
- Mensagens críticas com semântica de alerta (`role="alert"` / `aria-live` apropriado).
- Foco programático no primeiro erro quando bloqueia avanço.
- Não depender apenas de cor para feedback de erro/status.

## Risco e mitigação
- Risco: aumento de complexidade do formulário.
  Mitigação: alterar apenas pontos de feedback e foco, sem mexer na regra de negócio.
- Risco: regressão em tracking.
  Mitigação: manter handlers existentes e validar cliques críticos manualmente.
- Risco: `GoogleReviews` exigir refatoração ampla.
  Mitigação: aplicar somente ajuste mínimo local ou documentar como follow-up.

## Critérios de aceite desta fase
- Formulário comunica etapa, bloqueio, envio, sucesso e erro com clareza.
- Links WhatsApp deixam claro que abrem fora do site.
- Menu mobile com estado compreensível e fechamento por teclado.
- Blog/GoogleReviews sem estado silencioso quebrado.
- Sem regressão visual relevante.
- Sem quebra de typecheck/lint/test/build.

## Validação obrigatória
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## Validação manual obrigatória
- Páginas: `/`, `/contato`, `/blog`, `/servicos`, `/solucoes`, `/solucoes-com-ia`
- Fluxos:
  1. abrir/fechar menu mobile
  2. navegar pelo menu mobile
  3. tentar avançar formulário vazio
  4. corrigir campos inválidos
  5. avançar para etapa 2
  6. voltar para etapa 1
  7. enviar formulário válido
  8. simular erro de envio (quando possível)
  9. clicar links de WhatsApp
