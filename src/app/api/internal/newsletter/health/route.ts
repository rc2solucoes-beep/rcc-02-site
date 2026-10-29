import { NextResponse, type NextRequest } from "next/server";
import { raiseAlert } from "@/lib/newsletter/alerts";
import { getQueueHealth } from "@/lib/newsletter/health";
import { isDispatchAuthorized } from "@/lib/newsletter/internalAuth";
import { createServiceClient } from "@/lib/supabase/server";

// Saúde da fila para a sonda externa (SDD Newsletter §8.6, DEP-04). Mesmo bearer do dispatch.
// Devolve só contagens e a idade do item mais antigo: sem PII, sem token, sem e-mail.

export const dynamic = "force-dynamic";

const HEADERS = { "Cache-Control": "no-store" } as const;

export async function GET(req: NextRequest) {
  if (!isDispatchAuthorized(req.headers.get("authorization"))) {
    try {
      await raiseAlert(createServiceClient(), "unauthorized", 1);
    } catch {
      /* o registro nunca bloqueia a negativa */
    }
    return new NextResponse(null, { status: 401, headers: HEADERS });
  }
  try {
    return NextResponse.json(await getQueueHealth(createServiceClient()), { headers: HEADERS });
  } catch {
    console.error("[newsletter] health: falha");
    return NextResponse.json({ status: "error" }, { status: 503, headers: HEADERS });
  }
}
