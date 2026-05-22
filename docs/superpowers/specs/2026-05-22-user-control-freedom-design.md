# Fase 3 — Controle e Liberdade do Usuário (Nielsen)

Data: 2026-05-22
Status: Aprovado para implementação
Escopo: Ajuste cirúrgico, incremental e de baixo risco

## 1. Objetivo

Melhorar a sensação de controle do usuário na navegação pública, garantindo que ele consiga abrir, fechar, voltar, corrigir e escolher caminhos alternativos sem ficar preso no fluxo.

## 2. Escopo aprovado

### Em escopo

1. Menu mobile com fechamento previsível e retorno de foco no fechamento por teclado.
2. Formulário de diagnóstico com microcopy explícita de liberdade para voltar sem perder dados.
3. Estado de sucesso do formulário com um caminho secundário de continuidade interna.
4. Padronização pontual de rótulos de links de WhatsApp para previsibilidade de ação.

### Fora de escopo

1. Redesign visual.
2. Refatoração de arquitetura de navegação.
3. Mudança de regras de negócio do formulário.
4. Backend, banco, migrations ou APIs.
5. Novas dependências.
6. Click-outside para fechar menu, link “voltar ao topo” ou novos componentes complexos.

## 3. Arquitetura de mudanças

### 3.1 Header / menu mobile

Arquivo: `src/components/layout/Header.tsx`

Mudanças:

1. Adicionar `ref` no botão que abre/fecha o menu mobile.
2. No fechamento por `Esc`, manter o fechamento atual e devolver foco ao botão do menu.
3. Preservar `aria-label` dinâmico, `aria-expanded`, fechamento por clique em links internos e comportamento atual de navegação.

Resultado esperado:

1. Usuário de teclado não perde contexto ao fechar o menu.
2. Não há alteração de layout ou de tracking.

### 3.2 Formulário / liberdade para voltar

Arquivo: `src/components/marketing/ContactForm.tsx`

Mudanças:

1. Inserir microcopy discreta na etapa 2:
   - “Você pode voltar sem perder as informações preenchidas.”
2. Manter botão `Voltar` e persistência dos dados já preenchidos (comportamento atual).

Resultado esperado:

1. O usuário entende explicitamente que pode corrigir a etapa anterior sem perda de progresso.

### 3.3 Formulário / sucesso com saída secundária

Arquivo: `src/components/marketing/ContactForm.tsx`

Mudanças:

1. Manter confirmação de sucesso e CTA de WhatsApp já existente.
2. Adicionar 1 link secundário interno e discreto para continuidade de navegação:
   - recomendado: `/servicos` com texto “Ver serviços”.

Resultado esperado:

1. O usuário não fica em estado terminal sem próximo passo dentro do site.

### 3.4 Padronização de rótulos WhatsApp

Arquivos candidatos:

1. `src/components/marketing/ContactForm.tsx`
2. `src/app/(public)/contato/page.tsx`
3. `src/components/layout/Footer.tsx`

Mudanças:

1. Padronizar rótulos visíveis em pontos alterados para evitar ambiguidade, priorizando “Abrir WhatsApp” ou “Falar pelo WhatsApp”.
2. Não alterar destinos, `target`, `rel` ou payload de tracking.

Resultado esperado:

1. Ação externa fica previsível e consistente.

## 4. Regras de segurança da implementação

1. Não alterar eventos de tracking existentes.
2. Não alterar payloads de eventos.
3. Não alterar validação de formulário, schema ou actions.
4. Não introduzir bloqueios novos de navegação.

## 5. Critérios de aceite

1. Menu mobile abre/fecha por botão como hoje.
2. Menu mobile fecha por `Esc` e devolve foco ao botão.
3. Menu mobile fecha ao clicar em link interno.
4. Formulário etapa 2 mostra que é possível voltar sem perder dados.
5. Botão `Voltar` continua preservando dados da etapa 1.
6. Erros continuam permitindo nova tentativa e alternativa via WhatsApp.
7. Sucesso mostra confirmação + WhatsApp + 1 saída interna secundária.
8. Rótulos de WhatsApp nos pontos alterados ficam consistentes.
9. Sem regressão visual relevante.
10. Sem quebra de tracking.

## 6. Plano de validação

### Comandos

1. `npm run typecheck`
2. `npm run lint`
3. `npm run test`
4. `npm run build`

### Revisão manual

1. `/`:
   - abrir menu mobile, fechar por botão e por `Esc`.
2. `/contato`:
   - avançar para etapa 2, voltar para etapa 1 e confirmar preservação de dados;
   - validar microcopy de liberdade;
   - validar erro e fallback WhatsApp;
   - validar sucesso com saída secundária.
3. `/servicos` e `/servicos/[slug]`:
   - confirmar que navegação e CTAs seguem previsíveis.
4. `/solucoes/[slug]`:
   - confirmar retornos para hub e links relacionados.

## 7. Riscos e mitigação

1. Risco: foco não retornar corretamente em alguns navegadores no fechamento por `Esc`.
   - Mitigação: usar `ref` estável no botão e aplicar foco imediatamente após `setOpen(false)` no handler de teclado.
2. Risco: excesso de CTA no estado de sucesso.
   - Mitigação: manter apenas um caminho secundário interno além do WhatsApp.

## 8. Decisões explícitas de não implementação

1. Não implementar fechamento por clique fora do menu nesta fase (escopo ampliaria comportamento e risco de regressão).
2. Não adicionar “Voltar ao topo” nesta fase (não obrigatório para ajuste cirúrgico).
3. Não criar novos componentes para controle de estado (uso de ajustes locais).