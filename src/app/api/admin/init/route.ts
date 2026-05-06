import { createServiceClient, createSessionClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/admin/init
 * Initialize or verify admin user from the current authenticated session
 *
 * Returns:
 * - 200: User is already an admin
 * - 201: User was just promoted to admin (first user)
 * - 401: Not authenticated
 * - 403: Admin users exist but current user is not admin
 */

export async function POST() {
  try {
    // 1. Get current session
    const sessionClient = await createSessionClient();
    const {
      data: { session },
      error: sessionError,
    } = await sessionClient.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Not authenticated. Please log in first." },
        { status: 401 }
      );
    }

    const serviceClient = createServiceClient();

    // 2. Check if current user is already admin
    const { data: existingAdmin } = await serviceClient
      .from("admin_users")
      .select("id")
      .eq("id", session.user.id)
      .maybeSingle();

    if (existingAdmin) {
      // User is already admin
      return NextResponse.json(
        {
          success: true,
          message: "User is already an admin",
          email: session.user.email,
        },
        { status: 200 }
      );
    }

    // 3. Check if any admin users exist
    const { count } = await serviceClient
      .from("admin_users")
      .select("id", { count: "exact", head: true });

    if ((count ?? 0) > 0) {
      // Admin users exist but current user is not one
      return NextResponse.json(
        {
          error: "Admin users already exist. Ask an existing admin to add you.",
          email: session.user.email,
        },
        { status: 403 }
      );
    }

    // 4. No admin users exist, promote current user
    const { error: insertError } = await serviceClient
      .from("admin_users")
      .insert([{ id: session.user.id, email: session.user.email }]);

    if (insertError) {
      console.error("[/api/admin/init] Insert error:", insertError);
      return NextResponse.json(
        { error: `Failed to create admin user: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "First admin user created successfully",
        email: session.user.email,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[/api/admin/init] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
