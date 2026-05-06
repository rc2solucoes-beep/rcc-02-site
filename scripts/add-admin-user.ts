/**
 * Script to add a user as an admin
 * Usage: npx ts-node scripts/add-admin-user.ts <email>
 *
 * Requires environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";

const email = process.argv[2];

if (!email) {
  console.error("Usage: npx ts-node scripts/add-admin-user.ts <email>");
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

async function addAdminUser() {
  const supabase = createClient(supabaseUrl as string, serviceRoleKey as string);

  try {
    // 1. Find user by email
    console.log(`\n📍 Looking for user with email: ${email}`);
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
      console.error("❌ Error fetching users:", userError.message);
      process.exit(1);
    }

    const user = userData.users.find((u) => u.email === email);

    if (!user) {
      console.error(`❌ User with email ${email} not found. Please sign up first.`);
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.id}`);

    // 2. Check if already admin
    console.log("\n📍 Checking if user is already admin...");
    const { data: adminData, error: checkError } = await supabase
      .from("admin_users")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (checkError) {
      console.error("❌ Error checking admin status:", checkError.message);
      process.exit(1);
    }

    if (adminData) {
      console.log("ℹ️  User is already an admin");
      process.exit(0);
    }

    // 3. Add user to admin_users
    console.log("\n📍 Adding user as admin...");
    const { data: insertData, error: insertError } = await supabase
      .from("admin_users")
      .insert([{ id: user.id, email: user.email }]);

    if (insertError) {
      console.error("❌ Error adding admin user:", insertError.message);
      process.exit(1);
    }

    console.log("✅ User added as admin successfully!");
    console.log("\n🎉 Admin setup complete. You can now log in at /admin");
    process.exit(0);
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    process.exit(1);
  }
}

addAdminUser();
