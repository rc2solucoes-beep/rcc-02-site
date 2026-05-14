import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const supabase = await createSessionClient();
    const { data } = await supabase
      .from("admin_users")
      .select("id")
      .eq("id", userId)
      .single();
    return !!data;
  } catch (error) {
    console.error("[AdminLayout] Error checking admin status:", error);
    return false;
  }
}

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSessionClient();
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("[AdminLayout] Session error:", sessionError);
    redirect("/admin");
  }

  if (!session) {
    redirect("/admin");
  }

  const isAdmin = await isUserAdmin(session.user.id);
  if (!isAdmin) {
    console.warn(`[AdminLayout] User ${session.user.email} is not an admin`);
    redirect("/admin");
  }

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <AdminSidebar />
      <main className="flex-1 flex flex-col min-w-0">
        {children}
      </main>
    </div>
  );
}
