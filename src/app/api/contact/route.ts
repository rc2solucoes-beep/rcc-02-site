import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { Resend } from "resend";
import { contactSchema } from "@/lib/validations/contact";
import { createServiceClient } from "@/lib/supabase/server";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip + (process.env.IP_SALT ?? "rc2")).digest("hex").slice(0, 16);
}

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

// ─── Turnstile verification ───────────────────────────────────────────────────

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  // Skip in dev/test if no secret configured
  if (!secret || secret === "xxxx") return true;

  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, response: token, remoteip: ip }),
    }
  );

  const data = (await res.json()) as { success: boolean };
  return data.success;
}

// ─── Rate limit via Supabase ──────────────────────────────────────────────────

async function isRateLimited(email: string, ipHash: string): Promise<boolean> {
  try {
    const supabase = createServiceClient();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { count } = await supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .or(`email.eq.${email},ip_hash.eq.${ipHash}`)
      .gte("created_at", oneHourAgo);

    return (count ?? 0) >= 3;
  } catch {
    // If Supabase is not configured, skip rate limiting
    return false;
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
        <tr style="background:#f5f5f5"><td style="font-weight:bold;">Empresa</td><td>${escaped.company}</td></tr>
        <tr><td style="font-weight:bold;">E-mail</td><td><a href="mailto:${escaped.email}">${escaped.email}</a></td></tr>
        <tr style="background:#f5f5f5"><td style="font-weight:bold;">WhatsApp</td><td><a href="https://wa.me/${whatsappNumbers}">${escaped.whatsapp}</a></td></tr>
        <tr><td style="font-weight:bold;">Segmento</td><td>${escaped.segment}</td></tr>
        <tr style="background:#f5f5f5"><td style="font-weight:bold;">Porte</td><td>${escaped.size}</td></tr>
        <tr><td style="font-weight:bold;">Solução</td><td>${escaped.solution}</td></tr>
        <tr style="background:#f5f5f5"><td style="font-weight:bold;">Desafio</td><td>${escaped.message}</td></tr>
      </table>
      <p style="margin-top:24px;font-size:12px;color:#888;">Enviado via rc2solucoes.com.br</p>
    `,
  });
}

// ─── CSRF validation ──────────────────────────────────────────────────────────

function isValidOrigin(origin: string | null): boolean {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    return (
      url.hostname === "rc2solucoes.com.br" ||
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1"
    );
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
  const parsed = contactSchema.safeParse(body);
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

  const ip = getIp(req);
  const ipHash = hashIp(ip);

  // 3. Turnstile verification (always required)
  const valid = await verifyTurnstile(turnstileToken, ip);
  if (!valid) {
    return NextResponse.json(
      { error: "Verificação de segurança falhou. Recarregue a página e tente novamente." },
      { status: 400 }
    );
  }

  // 4. Rate limit
  const limited = await isRateLimited(email, ipHash);
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
