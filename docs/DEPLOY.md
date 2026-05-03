# Deploy — RC2 Soluções

## Pré-requisitos

- Conta Vercel conectada ao repositório GitHub
- Projeto Supabase em produção com as migrations aplicadas
- Domínio `rc2solucoes.com.br` apontando para Vercel
- Variáveis de ambiente configuradas no Vercel (ver seção abaixo)

---

## 1. Variáveis de ambiente no Vercel

No painel Vercel → Project → Settings → Environment Variables, configure todas as variáveis para o ambiente **Production**:

| Variável | Onde obter |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare → Turnstile → Sites |
| `TURNSTILE_SECRET_KEY` | Cloudflare → Turnstile → Sites |
| `RESEND_API_KEY` | resend.com → API Keys |
| `LEAD_NOTIFICATION_EMAIL` | E-mail para receber notificações de leads |
| `IP_SALT` | Gere com: `openssl rand -hex 16` |
| `SENTRY_DSN` | Sentry → Project → Settings → Client Keys |
| `NEXT_PUBLIC_SENTRY_DSN` | Mesmo valor do SENTRY_DSN |
| `NEXT_PUBLIC_SITE_URL` | `https://rc2solucoes.com.br` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `5511988028550` |

> **Nunca** configure `SUPABASE_SERVICE_ROLE_KEY` como variável pública (`NEXT_PUBLIC_*`).

---

## 2. Migrations do Supabase

Execute as migrations na ordem no Supabase SQL Editor (ou via Supabase CLI):

```bash
# Via Supabase CLI (recomendado)
supabase db push

# Ou manualmente no SQL Editor:
# 1. supabase/migrations/001_leads.sql
# 2. supabase/migrations/002_posts_settings.sql
```

---

## 3. Criar usuário administrador

No Supabase → Authentication → Users → **"Add user"**:

- E-mail: `admin@rc2solucoes.com.br` (ou o e-mail desejado)
- Senha: mínimo 12 caracteres, com letras, números e símbolos
- Marque **"Auto Confirm User"**

---

## 4. Configurar domínio no Vercel

1. Vercel → Project → Settings → Domains
2. Adicione `rc2solucoes.com.br` e `www.rc2solucoes.com.br`
3. No painel DNS do seu provedor, configure:
   - Registro `A`: `76.76.21.21` (IP do Vercel)
   - Ou registro `CNAME`: `cname.vercel-dns.com`
4. Aguarde propagação DNS (até 48h, geralmente menos de 1h)

---

## 5. Deploy

```bash
# Instalar Vercel CLI (uma vez)
npm i -g vercel

# Login
vercel login

# Deploy de produção (a partir da branch main)
vercel --prod
```

Ou simplesmente faça push para a branch `main` — o Vercel detecta automaticamente e dispara o deploy.

---

## 6. Checklist pós-deploy

- [ ] Site acessível em `https://rc2solucoes.com.br`
- [ ] Redirect de `www` funcionando
- [ ] HTTPS ativo (certificado automático do Vercel)
- [ ] Formulário de contato envia e-mail de notificação
- [ ] Login admin funciona em `/admin`
- [ ] Post de teste visível em `/blog`
- [ ] `/sitemap.xml` acessível e com URLs corretas
- [ ] `/robots.txt` bloqueando `/admin`
- [ ] Headers de segurança validados em [securityheaders.com](https://securityheaders.com)
- [ ] Google Search Console: adicionar propriedade e submeter sitemap

---

## Rollback

### Opção 1 — Via Vercel Dashboard (recomendado)

1. Vercel → Project → Deployments
2. Localize o deploy anterior (estável)
3. Clique nos três pontos `...` → **"Promote to Production"**
4. Confirme — o rollback leva menos de 30 segundos

### Opção 2 — Via Vercel CLI

```bash
# Listar deployments recentes
vercel ls

# Promover um deployment específico para produção
vercel promote <deployment-url>
```

### Opção 3 — Via Git (revert + push)

```bash
# Reverter o último commit
git revert HEAD

# Push para main dispara novo deploy automático
git push origin main
```

> Para rollback de banco de dados (Supabase), não há mecanismo automático no plano Free. Mantenha backups manuais via Supabase → Database → Backups antes de migrations críticas.

---

## Atualizações de conteúdo (sem deploy)

Alterações via admin (posts, configurações) têm efeito em até **60 segundos** por ISR — não requerem novo deploy.

Alterações no código (layout, copy das páginas institucionais, lógica) requerem push para `main` → deploy automático.
