import { requireAdmin } from "@/lib/admin/requireAdmin";
import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

function internalServerError() {
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

function logUnexpectedServerError() {
  console.error("[/api/admin/init] Unexpected server error");
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();

    if (admin.ok) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (admin.status === 401 || !admin.userId) {
      console.warn("[/api/admin/init] Access denied: no active session");
      return unauthorized();
    }

    const bootstrapToken = process.env.ADMIN_BOOTSTRAP_TOKEN;
    const requestToken = request.headers.get("x-admin-bootstrap-token");

    if (!bootstrapToken || !requestToken) {
      console.warn("[/api/admin/init] Bootstrap denied: missing token");
      return forbidden();
    }

    if (requestToken !== bootstrapToken) {
      console.warn("[/api/admin/init] Bootstrap denied: invalid token");
      return forbidden();
    }

    if (!admin.email?.trim()) {
      console.warn("[/api/admin/init] Bootstrap denied: authenticated user missing email");
      return forbidden();
    }

    const serviceClient = createServiceClient();
    const { data: created, error: rpcError } = await serviceClient.rpc(
      "bootstrap_first_admin",
      {
        bootstrap_user_id: admin.userId,
        bootstrap_email: admin.email,
      }
    );

    if (rpcError) {
      logUnexpectedServerError();
      return internalServerError();
    }

    if (!created) {
      console.warn("[/api/admin/init] Bootstrap denied: admin already exists");
      return forbidden();
    }

    console.info("[/api/admin/init] First admin created");
    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    logUnexpectedServerError();
    return internalServerError();
  }
}
