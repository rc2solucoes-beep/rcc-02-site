import { createSessionClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createSessionClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      ok: false as const,
      status: 401,
      user: null,
      email: null,
      userId: null,
    };
  }

  const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("id,email")
    .eq("id", user.id)
    .maybeSingle();

  if (adminError || !adminUser) {
    return {
      ok: false as const,
      status: 403,
      user,
      email: user.email ?? null,
      userId: user.id,
    };
  }

  return {
    ok: true as const,
    status: 200,
    user,
    email: user.email ?? null,
    userId: user.id,
  };
}
