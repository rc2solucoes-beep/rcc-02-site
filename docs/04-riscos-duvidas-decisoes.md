# 04 — Riscos, Dúvidas e Decisões

> Registro de todos os riscos identificados, conflitos entre documentos,
> decisões pendentes e decisões já tomadas.

---

## 1. Conflitos entre documentos

| # | Conflito | Documentos em conflito | Status | Decisão proposta |
|---|---|---|---|---|
| C1 | Página "Soluções com IA" está explícita no menu e como rota no `Estrutura e copy - MVP`, mas não aparece na lista de páginas públicas do `Plano Consolidado` | Estrutura e copy vs Plano Consolidado | ✅ **Resolvido** | Incluir a página — confirmado pelo usuário em 2026-05-01 |
| C2 | 6 pacotes comerciais são detalhados no `Estrutura e copy - MVP`, mas o `Plano Consolidado` não prevê página ou seção de pacotes | Estrutura e copy vs Plano Consolidado | ✅ **Resolvido** | Pacotes incorporados dentro da página de Serviços — confirmado em 2026-05-01 |
| C3 | `Plano Consolidado` recomenda Plausible, mas usuário optou por Umami | Plano Consolidado vs Decisão do usuário | ✅ **Resolvido** | Usar Umami (https://umami.is/) — decisão do usuário prevalece em 2026-05-01 |

---

## 2. Decisões pendentes (bloqueadores)

| # | Decisão | Impacto | Urgência |
|---|---|---|---|
| D1 | **Logo final:** os arquivos `logo-base.png` e `logo-base-transparente.png` são o Signal Interrupt definitivo ou precisam de ajuste/substituição? | Bloqueia design system e qualquer implementação visual | 🔴 Alta |
| D2 | **WhatsApp:** qual é o número para o CTA "Falar pelo WhatsApp"? | Bloqueia publicação do formulário e CTAs secundários | 🔴 Alta |
| D3 | **Domínio:** `rc2solucoes.com.br` está registrado? Já apontado para Vercel ou será configurado na Fase 9? | Bloqueia deploy em produção com domínio final | 🟡 Média |
| D4 | **Analytics:** Plausible (pago após 30 dias de trial) ou alternativa gratuita (Umami auto-hospedado no Vercel)? | Bloqueia Fase de monitoramento | 🟡 Média |
| D5 | **Página "Soluções com IA":** incluir como rota e item de menu principal? | Define estrutura de navegação — precisa ser resolvido antes da Fase 2 | 🔴 Alta |
| D6 | **Pacotes comerciais:** exibir em página própria (`/pacotes`) ou como seção dentro de Serviços? | Define roteamento e estrutura de CMS | 🟡 Média |
| D7 | **Repositório GitHub:** criar novo com o nome `rc2-site`? Ou já existe algum repositório? Qual é a URL? | Bloqueia Fase 1 | 🔴 Alta |
| D8 | **Anti-spam:** Cloudflare Turnstile (requer conta Cloudflare, gratuito) ou hCaptcha (free tier, sem Cloudflare)? | Bloqueia implementação do formulário (Fase 4) | 🟡 Média |
| D9 | **E-mail de leads:** qual provedor SMTP para notificação ao receber lead? (Resend tem free tier, SendGrid também, ou usar Supabase Edge Function com SMTP próprio) | Bloqueia Fase 4 | 🟡 Média |
| D10 | **Preços dos pacotes:** serão exibidos no site? Se sim, precisam ser definidos antes de publicar | Bloqueia publicação do site | 🟡 Média |

---

## 3. Riscos técnicos identificados

| # | Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|---|
| R1 | Logo fornecido não é o Signal Interrupt final — gera retrabalho na Fase 2 | Média | Alto | Confirmar logo antes de iniciar design system |
| R2 | Plausible exige pagamento após trial — pode forçar troca tardia de ferramenta | Média | Médio | Decidir antes da Fase 9 — Umami é alternativa gratuita viável |
| R3 | Domínio não registrado ou sem acesso às DNS | Média | Alto | Verificar e resolver antes da Fase 9 |
| R4 | Supabase free tier tem limitações de storage e conexões simultâneas | Baixa | Médio | Monitorar uso; planejar upgrade se necessário |
| R5 | shadcn/ui pode ter tokens que conflitem com a paleta RC2 | Alta | Médio | Sobrescrever tokens no `tailwind.config.ts` na Fase 2 |
| R6 | Editor rico (TipTap) pode ter curva de integração com Supabase Storage | Média | Médio | Avaliar alternativas simples (Markdown + preview) se TipTap atrasar |
| R7 | Textos legais (Privacidade e Termos) não foram fornecidos | Alta | Médio | Usar templates legais temporários com aviso claro até texto final |
| R8 | Número de WhatsApp ausente — CTA secundário publicado sem link funcional | Alta | Médio | Não publicar o CTA "Falar pelo WhatsApp" até ter o número |
| R9 | MCPs com escopo amplo podem realizar ações não intencionais no banco ou repositório | Baixa | Alto | Usar tokens com menor escopo possível; revisar ações críticas manualmente |
| R10 | Semgrep/Snyk pode identificar vulnerabilidades que atrasem o deploy | Média | Médio | Rodar na Fase 8 com tempo suficiente para correções |
| R11 | Supabase Auth — perda de credenciais do admin único | Baixa | Alto | Documentar credenciais em gerenciador de senhas antes de qualquer deploy |

---

## 4. Riscos de projeto (não técnicos)

| # | Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|---|
| RP1 | Copy de Privacidade e Termos de Uso não fornecido — risco legal ao publicar sem | Alta | Alto | Não publicar sem esses textos; usar templates com revisão jurídica |
| RP2 | Preços dos pacotes indefinidos — site pode ficar incompleto do ponto de vista comercial | Média | Médio | Publicar sem preços com CTA de diagnóstico; adicionar preços depois |
| RP3 | Cases e mini cases ainda não existem — prova social ausente no lançamento | Alta | Médio | Lançar sem cases; adicionar conforme projetos forem concluídos |
| RP4 | Presença digital do fundador (LinkedIn) não criada ainda | Alta | Baixo | Criar perfis conforme Brand Guide antes do lançamento |

---

## 5. Decisões já tomadas (dos documentos-base)

> Estas decisões estão nos documentos e **não devem ser revertidas sem discussão**.

| Decisão | Fonte | Detalhe |
|---|---|---|
| Stack: Next.js + TypeScript | Plano Consolidado | Descartados: Astro, Markdown/SQLite, Payload, Strapi |
| UI: Tailwind + shadcn/ui | Plano Consolidado | Descartados: styled-components, Chakra UI |
| CMS: Admin próprio | Plano Consolidado | Descartados: WordPress, Payload, Sanity para MVP |
| Banco: Supabase Postgres | Plano Consolidado | Descartados: SQLite, MongoDB, PlanetScale |
| Auth: Supabase Auth | Plano Consolidado | Descartados: Auth.js, Clerk, Auth0 |
| Deploy: Vercel | Plano Consolidado | Descartados: Netlify, Cloudflare Pages |
| Testes E2E: Playwright | Plano Consolidado | Descartado: Puppeteer, Cypress |
| Analytics: Plausible + Search Console | Plano Consolidado | Descartados: GA4 (pós-MVP), PostHog, Umami (como padrão) |
| Monitoramento: Sentry | Plano Consolidado | — |
| Tipografia: Barlow (Google Fonts) | Brand Guide v2 | Única família tipográfica |
| Paleta: "The High-End Tool" | Brand Guide v2 | 5 cores definidas com proporções |
| Logo: Signal Interrupt | Brand Guide v2 | 3 barras horizontais com interrupção em Safety Orange |
| CTA único: "Solicitar diagnóstico" | Copy + Brand Guide | Consistente em todas as páginas |
| Sem WordPress | Plano Consolidado | Decisão explícita e definitiva |
| 1 administrador no MVP | Plano Consolidado | RBAC e múltiplos admins são evolução pós-MVP |
| Fundo nunca branco puro (#FFFFFF) | Brand Guide v2 | Base é sempre Areia Industrial (#F5F0E8) |

---

## 6. Perguntas obrigatórias antes da implementação

> Ver seção "Perguntas obrigatórias" na resposta principal.
> Cada resposta deve ser registrada aqui após o alinhamento com o usuário.

| # | Pergunta | Resposta | Data |
|---|---|---|---|
| P1 | O logo fornecido é o Signal Interrupt definitivo? | Tratar como **placeholder** — será substituído pelo logo final quando aprovado | 2026-05-01 |
| P2 | Qual é o número de WhatsApp para o CTA? | **11988028550** (link: `https://wa.me/5511988028550`) | 2026-05-01 |
| P3 | O domínio `rc2solucoes.com.br` está registrado? | **Sim, registrado.** Usuário controla o DNS. Apontar para Vercel na Fase 9 | 2026-05-01 |
| P4 | Plausible ou Umami (gratuito)? | **Umami** — usar https://umami.is/ (cloud ou self-hosted) | 2026-05-01 |
| P5 | Página "Soluções com IA" no menu? | **Sim** — incluir como item de menu e rota `/solucoes-com-ia` | 2026-05-01 |
| P6 | Pacotes em página própria ou dentro de Serviços? | **Incorporados dentro da página de Serviços** | 2026-05-01 |
| P7 | Repositório GitHub — criar novo ou usar existente? | **Existente:** https://github.com/rsazevedo82/rcc-02-site | 2026-05-01 |
| P8 | Anti-spam: Turnstile ou hCaptcha? | **Cloudflare Turnstile** | 2026-05-01 |
| P9 | Provedor de e-mail para notificação de leads? | **Resend** (resend.com — free tier até 3K e-mails/mês) | 2026-05-01 |
| P10 | Textos legais — você tem ou precisa que eu gere? | **Gerados pelo Claude Code** — salvos em `docs/06-politica-privacidade.md` e `docs/07-termos-de-uso.md` | 2026-05-01 |
