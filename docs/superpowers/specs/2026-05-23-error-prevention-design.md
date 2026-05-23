# Fase 5 — Prevenção de Erros (Nielsen)

Data: 2026-05-23
Status: Aprovado para implementação
Escopo: Cirúrgico focado + pontos essenciais de configuração

## 1. Objetivo

Prevenir erros antes do envio no fluxo público de diagnóstico, com foco em validação, anti-spam, prevenção de duplicidade e previsibilidade de destinos/ações.

## 2. Escopo aprovado

### Em escopo

1. Enforce estrito de Turnstile no backend em produção quando houver secret real.
2. Envio de token real no frontend (não enviar string vazia fixa).
3. Reforço leve de prevenção no formulário (autocomplete, inputMode e trims seguros).
4. Revisão pontual de links/CTAs críticos, sem alterar arquitetura.
5. Manter honeypot e rate limit ativos como camadas complementares.
6. Atualização mínima de configuração/documentação apenas se houver lacuna crítica.

### Fora de escopo

1. Criação de helper central novo (`contactSafety.ts`).
2. Refatoração estrutural do formulário ou API.
3. Mudança de backend comercial, schema, migrations ou banco.
4. Redesign visual ou alteração de fluxo comercial.
5. Troca de biblioteca (React Hook Form/Zod/Turnstile provider).

## 3. Regras de ambiente aprovadas (Turnstile)

1. `NODE_ENV === "production"`:
   - Se `TURNSTILE_SECRET_KEY` estiver configurada e não for placeholder (`xxxx`), aplicar enforcement estrito.
   - Token ausente, vazio ou inválido bloqueia envio.
2. `development` ou `test`:
   - Bypass só quando `TURNSTILE_SECRET_KEY` estiver ausente ou placeholder (`xxxx`).
   - Com secret real, validação normal.
3. Secret real em qualquer ambiente ativa validação.
4. Não registrar token em logs.
5. Não expor secret no frontend.
6. Mensagem de falha de verificação:
   - “Não foi possível validar a verificação de segurança. Recarregue a página e tente novamente ou fale pelo WhatsApp.”

## 4. Inventário de riscos encontrados

### 4.1 Erros de anti-spam

1. Backend permite fallback permissivo para token vazio em cenário que deveria validar.
2. Frontend envia `turnstileToken: ""`, inviabilizando validação real.

### 4.2 Erros de preenchimento

1. Falta de `autocomplete` consistente em campos críticos.
2. Falta de trims leves em alguns campos textuais pode causar falha evitável por espaços.

### 4.3 Erros de envio

1. Prevenção de envio duplicado já existe, mas depende de manter estado e bloqueio durante `isSubmitting` sem regressão.

### 4.4 Erros de links/CTAs

1. Necessidade de checagem factual de destinos principais e links WhatsApp para evitar rota inválida ou formato incorreto.

## 5. Arquivos afetados

1. `src/app/api/contact/route.ts`
2. `src/components/marketing/ContactForm.tsx`
3. `src/lib/validations/contact.ts`
4. `.env.example` (apenas comentário/clareza, se necessário)

## 6. Design técnico das mudanças

### 6.1 Backend (`route.ts`)

1. Refatorar `verifyTurnstile` para comportamento condicional por ambiente e presença de secret real.
2. Em contexto que exige validação, ausência de token deve retornar falha.
3. Remover fallback permissivo para token vazio em cenários de enforcement.
4. Manter honeypot como early return silencioso (`success: true`) para bots.
5. Manter rate limit como camada adicional após verificação de segurança.
6. Substituir mensagem de erro de verificação pela mensagem aprovada.
7. Não logar token ou secret.

### 6.2 Frontend (`ContactForm.tsx`)

1. Integrar token real do Turnstile usando dependência já existente no projeto.
2. Enviar token real no payload para `/api/contact`.
3. Se token obrigatório estiver ausente no momento do submit, bloquear envio com feedback claro.
4. Preservar fluxo atual:
   - validação por etapa,
   - foco no primeiro erro,
   - mensagem geral de bloqueio da etapa 1,
   - desabilitação de botões em envio,
   - fallback WhatsApp em erro.
5. Aplicar atributos preventivos sem alterar UX:
   - `autocomplete` para nome, e-mail, telefone e empresa,
   - `inputMode` em telefone.

### 6.3 Validação (`contact.ts`)

1. Aplicar `trim()` em campos textuais apropriados (`name`, `email`, `message`, `company`, `segment`).
2. Manter regras de tamanho mínimo existentes e sem aumento de fricção.
3. Preservar schema único para API com `turnstileToken` opcional (sem quebrar contrato), com enforcement real no backend.

### 6.4 Configuração (`.env.example`)

1. Confirmar presença das variáveis Turnstile já exigidas.
2. Se necessário, ajustar comentários para explicitar regra de placeholder/local bypass e produção estrita.

## 7. Critérios de aceite

1. Produção não aceita envio sem token válido quando a secret real estiver configurada.
2. Desenvolvimento/teste seguem viáveis sem Turnstile real quando secret ausente/placeholder.
3. Secret real em qualquer ambiente ativa validação.
4. Honeypot e rate limit permanecem ativos.
5. Formulário mantém prevenção de envio duplicado.
6. Campos críticos possuem orientação técnica preventiva (`autocomplete`/`inputMode`).
7. Links WhatsApp e CTAs críticos seguem válidos e rastreáveis.
8. Sem exposição de secret ou log de token.

## 8. Plano de validação

### 8.1 Comandos

1. `npm run typecheck`
2. `npm run lint`
3. `npm run test`
4. `npm run build`

### 8.2 Revisão manual

1. `/contato`:
   - bloqueio da etapa 1 com campos inválidos,
   - foco no primeiro inválido,
   - submit sem duplicidade,
   - mensagem de erro segura + fallback WhatsApp,
   - sucesso sem reenvio acidental.
2. `/`, `/servicos`, `/solucoes`, `/solucoes-com-ia`, `/blog`, `/avaliacoes`:
   - validar CTAs críticos e links para `/contato` e WhatsApp.

## 9. Riscos residuais

1. Usuário legítimo com bloqueio de scripts pode não completar Turnstile em produção.
   - Mitigação nesta fase: mensagem clara + alternativa WhatsApp.
2. Diferença de ambiente mal configurado (`NODE_ENV` incorreto) pode causar comportamento inesperado.
   - Mitigação: regra explícita + documentação mínima.

## 10. Recomendação futura (fora desta fase)

1. Avaliar extração futura de regras de prevenção para módulo dedicado quando houver múltiplos formulários públicos.
2. Adicionar testes específicos de contrato para cenários Turnstile por ambiente.