import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { Resend } from "resend";
import { contactApiSchema } from "@/lib/validations/contact";
import { createServiceClient } from "@/lib/supabase/server";
import { getClientIp } from "@/lib/security/clientIp";
import { checkContactRateLimit } from "@/lib/security/rateLimit";
import { verifyTurnstile } from "@/lib/security/turnstile";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip + (process.env.IP_SALT ?? "rc2")).digest("hex").slice(0, 16);
}

// ─── Rate limit via Supabase (E0c) ────────────────────────────────────────────

// Contadores atômicos próprios (rate_limit_hit), independentes de `leads`. 3/h por e-mail e,
// quando há IP confiável, 3/h por IP; tentativas rejeitadas também contam. Qualquer falha
// (pepper ausente, erro do banco, resposta inesperada) FECHA: devolve true (429).
async function isRateLimited(email: string, ip: string | null): Promise<boolean> {
  try {
    const { allowed } = await checkContactRateLimit(createServiceClient(), { email, ip });
    return !allowed;
  } catch (err) {
    // Só o tipo do erro vai ao log: nunca e-mail, IP, chave, pepper ou mensagem do banco.
    console.error("[rate-limit] falha fechada:", err instanceof Error ? err.name : "erro desconhecido");
    return true;
  }
}

// ─── HTML escaping ────────────────────────────────────────────────────────────

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

// ─── Email notification ───────────────────────────────────────────────────────

async function sendLeadEmail(data: {
  name: string;
  company: string;
  email: string;
  whatsapp: string;
  segment: string;
  size: string;
  solution: string;
  message: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_NOTIFICATION_EMAIL ?? "contato@rc2solucoes.com.br";

  if (!apiKey || apiKey === "xxxx") return;

  const resend = new Resend(apiKey);

  const escaped = {
    name: escapeHtml(data.name),
    company: escapeHtml(data.company),
    email: escapeHtml(data.email),
    whatsapp: escapeHtml(data.whatsapp),
    segment: escapeHtml(data.segment),
    size: escapeHtml(data.size),
    solution: escapeHtml(data.solution),
    message: escapeHtml(data.message),
  };

  const whatsappNumbers = data.whatsapp.replace(/\D/g, "");

  await resend.emails.send({
    from: "RC2 Soluções <notificacoes@rc2solucoes.com.br>",
    to,
    subject: `Novo lead: ${escaped.name} — ${escaped.company}`,
    html: `
      <h2>Novo diagnóstico solicitado</h2>
      <table cellpadding="8" style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px;">
        <tr><td style="font-weight:bold;width:160px;">Nome</td><td>${escaped.name}</td></tr>
        <tr style="background:#F7F5F1"><td style="font-weight:bold;">Empresa</td><td>${escaped.company}</td></tr>
        <tr><td style="font-weight:bold;">E-mail</td><td><a href="mailto:${escaped.email}">${escaped.email}</a></td></tr>
        <tr style="background:#F7F5F1"><td style="font-weight:bold;">WhatsApp</td><td><a href="https://wa.me/${whatsappNumbers}">${escaped.whatsapp}</a></td></tr>
        <tr><td style="font-weight:bold;">Segmento</td><td>${escaped.segment}</td></tr>
        <tr style="background:#F7F5F1"><td style="font-weight:bold;">Porte</td><td>${escaped.size}</td></tr>
        <tr><td style="font-weight:bold;">Solução</td><td>${escaped.solution}</td></tr>
        <tr style="background:#F7F5F1"><td style="font-weight:bold;">Desafio</td><td>${escaped.message}</td></tr>
      </table>
      <p style="margin-top:24px;font-size:12px;color:#66717D;">Enviado via www.rc2solucoes.com.br</p>
    `,
  });
}

// ─── CSRF validation ──────────────────────────────────────────────────────────

function isValidOrigin(origin: string | null): boolean {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    const allowedProductionOrigin = (
      url.hostname === "rc2solucoes.com.br" ||
      url.hostname === "www.rc2solucoes.com.br" ||
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1"
    );
    if (allowedProductionOrigin) return true;

    if (process.env.VERCEL_ENV !== "preview" || !process.env.VERCEL_URL) return false;
    const previewHostname = new URL(`https://${process.env.VERCEL_URL}`).hostname;
    return url.hostname === previewHostname;
  } catch {
    return false;
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!isValidOrigin(origin)) {
    return NextResponse.json(
      { error: "Requisição rejeitada." },
      { status: 403 }
    );
  }

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  // 1. Zod validation
  const parsed = contactApiSchema.safeParse(body);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return NextResponse.json({ error: "Dados inválidos.", fields: errors }, { status: 400 });
  }

  const { name, company, email, whatsapp, segment, size, solution, message, website, turnstileToken } = parsed.data;

  // 2. Honeypot check
  if (website && website.length > 0) {
    // Return 200 to not reveal detection to bots
    return NextResponse.json({ success: true });
  }

  const ip = getClientIp(req.headers, { trustCloudflare: process.env.TRUST_CLOUDFLARE_PROXY === "true" });
  const ipHash = ip ? hashIp(ip) : null;

  // 3. Turnstile verification (negado em produção/preview sem segredo válido)
  const turnstile = await verifyTurnstile(turnstileToken, { ip });
  if (!turnstile.ok) {
    return NextResponse.json(
      { error: "Não foi possível validar a verificação de segurança. Recarregue a página e tente novamente ou fale pelo WhatsApp." },
      { status: 400 }
    );
  }

  // 4. Rate limit
  const limited = await isRateLimited(email, ip);
  if (limited) {
    return NextResponse.json(
      { error: "Muitas solicitações. Aguarde alguns minutos e tente novamente." },
      { status: 429 }
    );
  }

  // 5. Persist lead in Supabase
  try {
    const supabase = createServiceClient();
    const { error: dbError } = await supabase.from("leads").insert({
      name, company, email, whatsapp, segment, size, solution, message,
      source: "website",
      ip_hash: ipHash,
    });

    if (dbError) throw dbError;
  } catch (err) {
    console.error("[contact] Supabase insert error:", err);
    return NextResponse.json(
      { error: "Erro ao salvar sua solicitação. Por favor, tente novamente." },
      { status: 500 }
    );
  }

  // 6. Email notification (non-blocking — failure doesn't affect user)
  sendLeadEmail({ name, company, email, whatsapp, segment, size, solution, message }).catch((err) =>
    console.error("[contact] Email error:", err)
  );

  return NextResponse.json({ success: true });
}

