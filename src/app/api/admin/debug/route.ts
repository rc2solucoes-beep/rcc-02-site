import { createSessionClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/admin/debug
 * Debug endpoint to check current auth status and admin access
 */

export async function GET() {
  try {
    const sessionClient = await createSessionClient();

    // Get current session
    const { data: { session }, error: sessionError } = await sessionClient.auth.getSession();

    if (sessionError) {
      return NextResponse.json({
        status: "error",
        message: "Session error",
        error: sessionError.message,
      });
    }

    if (!session) {
      return NextResponse.json({
        status: "no-session",
        message: "No active session",
      });
    }

    // Get user info
    const user = session.user;

    // Check admin status
    const { data: adminData, error: adminError } = await sessionClient
      .from("admin_users")
      .select("id, email")
      .eq("id", user.id)
      .maybeSingle();

    if (adminError && adminError.code !== "PGRST116") {
      // PGRST116 is "not found"
      return NextResponse.json({
        status: "error",
        message: "Error checking admin status",
        error: adminError,
        user: {
          id: user.id,
          email: user.email,
        },
      });
    }

    // Get all admin users for debugging
    const { data: allAdmins, error: allError } = await sessionClient
      .from("admin_users")
      .select("id, email")
      .order("created_at", { ascending: false });

    return NextResponse.json({
      status: "ok",
      message: "Debug info",
      session: {
        userId: user.id,
        email: user.email,
        createdAt: user.created_at,
      },
      adminStatus: {
        isAdmin: !!adminData,
        adminRecord: adminData,
      },
      allAdmins: allAdmins || [],
      errors: {
        adminError: adminError?.message,
        allError: allError?.message,
      },
    });
  } catch (error) {
    return NextResponse.json({
      status: "error",
      message: "Unexpected error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
