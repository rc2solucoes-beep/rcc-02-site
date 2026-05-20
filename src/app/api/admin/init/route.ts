import { requireAdmin } from "@/lib/admin/requireAdmin";
import { extractRequestContext, writeAdminAuditLog } from "@/lib/admin/auditLog";
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
  const requestContext = extractRequestContext(request);

  try {
    const admin = await requireAdmin();

    if (admin.ok) {
      await writeAdminAuditLog({
        event: "admin_init_check_allowed",
        severity: "info",
        actorUserId: admin.userId,
        actorEmail: admin.email,
        actorType: "admin",
        path: requestContext.path,
        method: requestContext.method,
        status: 200,
        ip: requestContext.ip,
        userAgent: requestContext.userAgent,
      });
      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (admin.status === 401 || !admin.userId) {
      console.warn("[/api/admin/init] Access denied: no active session");
      await writeAdminAuditLog({
        event: "admin_init_denied_no_session",
        severity: "warning",
        actorType: "unknown",
        path: requestContext.path,
        method: requestContext.method,
        status: 401,
        ip: requestContext.ip,
        userAgent: requestContext.userAgent,
      });
      return unauthorized();
    }

    const bootstrapToken = process.env.ADMIN_BOOTSTRAP_TOKEN;
    const requestToken = request.headers.get("x-admin-bootstrap-token");

    if (!bootstrapToken || !requestToken) {
      console.warn("[/api/admin/init] Bootstrap denied: missing token");
      await writeAdminAuditLog({
        event: "admin_bootstrap_denied_missing_token",
        severity: "warning",
        actorUserId: admin.userId,
        actorEmail: admin.email,
        actorType: "authenticated",
        path: requestContext.path,
        method: requestContext.method,
        status: 403,
        ip: requestContext.ip,
        userAgent: requestContext.userAgent,
      });
      return forbidden();
    }

    if (requestToken !== bootstrapToken) {
      console.warn("[/api/admin/init] Bootstrap denied: invalid token");
      await writeAdminAuditLog({
        event: "admin_bootstrap_denied_invalid_token",
        severity: "warning",
        actorUserId: admin.userId,
        actorEmail: admin.email,
        actorType: "authenticated",
        path: requestContext.path,
        method: requestContext.method,
        status: 403,
        ip: requestContext.ip,
        userAgent: requestContext.userAgent,
      });
      return forbidden();
    }

    if (!admin.email?.trim()) {
      console.warn("[/api/admin/init] Bootstrap denied: authenticated user missing email");
      await writeAdminAuditLog({
        event: "admin_bootstrap_denied_missing_email",
        severity: "warning",
        actorUserId: admin.userId,
        actorType: "authenticated",
        path: requestContext.path,
        method: requestContext.method,
        status: 403,
        ip: requestContext.ip,
        userAgent: requestContext.userAgent,
      });
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
      await writeAdminAuditLog({
        event: "admin_bootstrap_error",
        severity: "error",
        actorUserId: admin.userId,
        actorEmail: admin.email,
        actorType: "authenticated",
        path: requestContext.path,
        method: requestContext.method,
        status: 500,
        ip: requestContext.ip,
        userAgent: requestContext.userAgent,
      });
      return internalServerError();
    }

    if (!created) {
      console.warn("[/api/admin/init] Bootstrap denied: admin already exists");
      await writeAdminAuditLog({
        event: "admin_bootstrap_denied_admin_exists",
        severity: "warning",
        actorUserId: admin.userId,
        actorEmail: admin.email,
        actorType: "authenticated",
        path: requestContext.path,
        method: requestContext.method,
        status: 403,
        ip: requestContext.ip,
        userAgent: requestContext.userAgent,
      });
      return forbidden();
    }

    console.info("[/api/admin/init] First admin created");
    await writeAdminAuditLog({
      event: "admin_bootstrap_created_first_admin",
      severity: "critical",
      actorUserId: admin.userId,
      actorEmail: admin.email,
      actorType: "authenticated",
      path: requestContext.path,
      method: requestContext.method,
      status: 201,
      ip: requestContext.ip,
      userAgent: requestContext.userAgent,
      resourceType: "admin_user",
      resourceId: admin.userId,
    });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    logUnexpectedServerError();
    await writeAdminAuditLog({
      event: "admin_init_unexpected_error",
      severity: "error",
      actorType: "unknown",
      path: requestContext.path,
      method: requestContext.method,
      status: 500,
      ip: requestContext.ip,
      userAgent: requestContext.userAgent,
    });
    return internalServerError();
  }
}
