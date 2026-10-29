import { NextResponse, type NextRequest } from "next/server";
import { raiseAlert, reportDispatchAlerts } from "@/lib/newsletter/alerts";
import { isDispatchAuthorized } from "@/lib/newsletter/internalAuth";
import { dispatchOnce } from "@/lib/newsletter/processor";
import { createProviderFromEnv } from "@/lib/newsletter/provider";
import { createSupabaseStore } from "@/lib/newsletter/store";
import { createServiceClient } from "@/lib/supabase/server";

// Processador do outbox da newsletter (SDD Newsletter §8.8). Chamado POR UM AGENDADOR EXTERNO ao
// site (pg_cron + pg_net, futura migration N2): NENHUM agendamento existe nesta entrega e as rotas
// públicas NÃO disparam o processamento.
//
//  * Autenticação: Authorization: Bearer <NEWSLETTER_DISPATCH_SECRET>, em tempo constante; segredo
//    ausente ou curto nega TODOS os acessos. Corpo ignorado.
//  * `unsubscribe_link` é sempre processado; `confirmation` só com
//    NEWSLETTER_CONFIRMATION_DISPATCH_ENABLED=true (desligada por padrão).
//  * Sem credencial do provedor (RESEND_API_KEY) responde 503 SEM reivindicar nada: itens não
//    morrem por falta de configuração.
//  * A resposta só tem contagens operacionais. Nunca registra segredo, e-mail nem token.

// Literal estático (o Next não aceita referência aqui). Deve ser igual a PROCESSOR_PARAMS.maxDurationSeconds (D = 120 s):
// um teste garante a igualdade.
export const maxDuration = 120;
export const dynamic = "force-dynamic";

const HEADERS = { "Cache-Control": "no-store" } as const;

export async function POST(req: NextRequest) {
  if (!isDispatchAuthorized(req.headers.get("authorization"))) {
    try {
      await raiseAlert(createServiceClient(), "unauthorized", 1);
    } catch {
      /* o registro nunca bloqueia a negativa */
    }
    return new NextResponse(null, { status: 401, headers: HEADERS });
  }

  const provider = createProviderFromEnv();
  if (!provider) {
    return NextResponse.json({ status: "not_configured" }, { status: 503, headers: HEADERS });
  }

  try {
    const client = createServiceClient();
    const summary = await dispatchOnce({
      store: createSupabaseStore(client),
      provider,
      confirmationEnabled: process.env.NEWSLETTER_CONFIRMATION_DISPATCH_ENABLED === "true",
    });
    try {
      await reportDispatchAlerts(client, summary);
    } catch {
      /* alerta é melhor esforço */
    }
    return NextResponse.json(summary, { status: summary.storeErrors > 0 ? 500 : 200, headers: HEADERS });
  } catch {
    console.error("[newsletter] dispatch: falha");
    return NextResponse.json({ status: "error" }, { status: 500, headers: HEADERS });
  }
}
