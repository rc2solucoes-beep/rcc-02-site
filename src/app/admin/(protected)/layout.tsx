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
  } catch {
    return false;
  }
}

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSessionClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect("/admin");

  const isAdmin = await isUserAdmin(session.user.id);
  if (!isAdmin) redirect("/admin");

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <AdminSidebar />
      <main className="flex-1 flex flex-col min-w-0">
        {children}
      </main>
    </div>
  );
}
