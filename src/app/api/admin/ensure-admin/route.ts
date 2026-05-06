import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/admin/ensure-admin
 * Add a specific user to admin_users table
 *
 * Body: { userId: string, email: string }
 *
 * Safety: Uses service role, intended for setup only
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email } = body;

    if (!userId || !email) {
      return NextResponse.json(
        { error: "Missing userId or email" },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    // Check if already exists
    const { data: existing } = await serviceClient
      .from("admin_users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          success: true,
          message: "User is already an admin",
          userId,
          email,
        },
        { status: 200 }
      );
    }

    // Insert user
    const { data, error } = await serviceClient
      .from("admin_users")
      .insert([{ id: userId, email }])
      .select();

    if (error) {
      console.error("[/api/admin/ensure-admin] Error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Admin user added successfully",
        userId,
        email,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[/api/admin/ensure-admin] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
