# Plano de Implementação — Fase 1: Visibilidade do Status do Sistema

Data: 2026-05-21
Spec base: `docs/superpowers/specs/2026-05-21-system-status-visibility-design.md`

## Objetivo
Aplicar melhorias incrementais de visibilidade de status em formulário, CTAs/WhatsApp, menu mobile, estado vazio do blog e estados explícitos no `GoogleReviews` (se necessário), sem redesign e sem refatoração ampla.

## Escopo
1. Formulário de diagnóstico (`ContactForm`).
2. CTAs e links WhatsApp (hero, contato, footer, CTA block, sucesso do form).
3. Menu mobile (`Header`).
4. Estado vazio do blog.
5. Estados `loading/error/empty/success` no `GoogleReviews` se faltarem claramente.

## Não-objetivos
- Sem mudanças de arquitetura.
- Sem banco/migrations.
- Sem dependências novas.
- Sem mudança de regra de negócio do formulário.
- Sem redesign visual.

## Tarefas

### Tarefa 1 — Diagnóstico do `GoogleReviews`
Arquivos:
- `src/components/GoogleReviews.tsx` (ou equivalente real)
- `src/app/(public)/avaliacoes/page.tsx`

Ações:
- Confirmar estados atuais existentes.
- Se faltar clareza em estado assíncrono, aplicar somente ajustes locais.
- Se exigir refatoração maior, registrar como recomendação futura e não incluir no PR.

Saída esperada:
- Decisão explícita: "corrigido incrementalmente" ou "fora por risco/escopo".

### Tarefa 2 — Feedback de validação na etapa 1 do formulário
Arquivo:
- `src/components/marketing/ContactForm.tsx`

Ações:
- Ao falhar `handleStep1Next`, exibir alerta geral acessível.
- Focar primeiro campo inválido.
- Manter erros por campo.
- Garantir feedback não dependente só de cor.

### Tarefa 3 — Progresso e copy de etapa
Arquivo:
- `src/components/marketing/ContactForm.tsx`

Ações:
- Atualizar textos para:
  - Etapa 1 de 2 — Informações iniciais
  - Etapa 2 de 2 — Dados da empresa
  - Tempo estimado: 1 minuto
- Revisar semântica do componente de progresso.

### Tarefa 4 — Botões e envio em andamento
Arquivo:
- `src/components/marketing/ContactForm.tsx`

Ações:
- Trocar botão para “Continuar para dados da empresa”.
- Em envio:
  - submit desabilitado
  - voltar desabilitado
  - texto “Enviando solicitação...”
  - mensagem auxiliar discreta
  - `aria-busy` apropriado

### Tarefa 5 — Sucesso e erro do formulário
Arquivo:
- `src/components/marketing/ContactForm.tsx`

Ações:
- Sucesso: reforçar próximos passos + alternativa WhatsApp.
- Erro: mensagens acionáveis por cenário (conexão, servidor, muitas tentativas quando possível).
- Garantir fallback WhatsApp em contexto de falha.

### Tarefa 6 — Consistência WhatsApp externo
Arquivos:
- `src/components/marketing/HeroActions.tsx`
- `src/app/(public)/contato/page.tsx`
- `src/components/layout/Footer.tsx`
- `src/components/marketing/CTABlock.tsx`

Ações:
- Padronizar microcopy dos links externos para WhatsApp.
- Confirmar `target="_blank"` + `rel="noopener noreferrer"`.
- Não quebrar tracking existente.

### Tarefa 7 — Status do menu mobile
Arquivo:
- `src/components/layout/Header.tsx`

Ações:
- Validar rótulo dinâmico abrir/fechar.
- Implementar fechamento por `Esc`.
- Preservar foco visível e fechamento ao navegar.

### Tarefa 8 — Estado vazio do blog
Arquivo:
- `src/app/(public)/blog/page.tsx`

Ações:
- Revisar/ajustar texto de vazio para orientação clara e acionável.
- Não ampliar copy além do necessário.

### Tarefa 9 — Validação técnica
Comandos:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

### Tarefa 10 — Validação manual guiada
Fluxos:
1. abrir menu mobile
2. fechar menu mobile
3. navegar menu mobile
4. tentar avançar formulário vazio
5. corrigir campos inválidos
6. avançar para etapa 2
7. voltar para etapa 1
8. enviar formulário válido
9. simular erro de envio (se possível)
10. clicar links de WhatsApp

Páginas:
- `/`
- `/contato`
- `/blog`
- `/servicos`
- `/solucoes`
- `/solucoes-com-ia`

## Riscos e mitigação
- Risco: `GoogleReviews` exigir refatoração.
  Mitigação: limitar a ajuste local; escalar como recomendação se extrapolar.
- Risco: regressão de tracking.
  Mitigação: manter handlers existentes e validar cliques críticos.
- Risco: ruído visual em mensagens.
  Mitigação: mensagens curtas, discretas e sem mudar identidade.

## Entrega esperada
- Lista de arquivos alterados.
- Melhorias implementadas por item.
- Itens fora de escopo (se houver).
- Riscos/dependências.
- Comandos executados e resultado objetivo.
