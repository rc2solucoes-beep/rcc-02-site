import { NextResponse, type NextRequest } from "next/server";
import { hashToken, isWellFormedToken } from "@/lib/newsletter/tokens";
import { recordInvalidTokenAttempt } from "@/lib/newsletter/rateLimit";
import { unsubscribeByToken } from "@/lib/newsletter/service";
import { getClientIp } from "@/lib/security/clientIp";
import { createServiceClient } from "@/lib/supabase/server";

// Descadastro one-click, RFC 8058 (RF-NL-05; SDD §7.5). ENDPOINT DE MANUTENÇÃO: não depende de
// NEWSLETTER_SIGNUP_ENABLED e permanece ativo com a newsletter desligada (§18.5).
//
// O cliente de e-mail dispara este POST: sem verificação de origem, sem Turnstile, sem cookies e
// sem redirecionamento. Token válido NUNCA é limitado por IP (o IP é do provedor de e-mail, compartilhado
// por muitos titulares). Só tentativas com corpo/token malformado ou token NÃO encontrado contam em
// `nl:tok:ip`. O token (query) jamais é registrado em log.

const MAX_BODY_BYTES = 1024;
const HEADERS = { "Cache-Control": "no-store" } as const;

const text = (status: number, body = "") => new NextResponse(body, { status, headers: HEADERS });

async function readBody(req: NextRequest): Promise<string | undefined> {
  const declared = Number(req.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return undefined;
  try {
    const body = await req.text();
    return body.length > MAX_BODY_BYTES ? undefined : body;
  } catch {
    return undefined;
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers, { trustCloudflare: process.env.TRUST_CLOUDFLARE_PROXY === "true" });

  try {
    const client = createServiceClient();

    /** Conta a tentativa inválida; acima do limite devolve 429, senão o status pedido. */
    const reject = async (status: number): Promise<NextResponse> => {
      const decision = await recordInvalidTokenAttempt(client, ip);
      return decision && !decision.allowed ? text(429) : text(status);
    };

    const body = await readBody(req);
    const oneClick = body !== undefined && new URLSearchParams(body).get("List-Unsubscribe") === "One-Click";
    if (!oneClick) return await reject(400);

    const token = req.nextUrl.searchParams.get("t");
    if (!isWellFormedToken(token)) return await reject(400);

    const result = await unsubscribeByToken(client, hashToken(token), "one_click");
    // Não encontrado (nunca existiu, removido ou assinante excluído): 200 neutro e idêntico ao
    // sucesso, mas conta no bucket (§7.5).
    if (result === "not_found") return await reject(200);

    return text(200);
  } catch {
    // Falha do banco: 503, nunca 429, para o provedor de e-mail poder repetir depois.
    console.error("[newsletter] unsubscribe one-click: falha");
    return text(503);
  }
}

// GET nunca altera estado (scanners seguem links): leva à página interativa.
export function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("t");
  const target = isWellFormedToken(token) ? `/newsletter/descadastro#t=${token}` : "/newsletter/descadastro";
  return NextResponse.redirect(new URL(target, req.url), { status: 303, headers: HEADERS });
}
