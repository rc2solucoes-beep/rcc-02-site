import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  if (!admin.ok) {
    if (admin.status === 401) {
      console.warn("[AdminLayout] Access denied: no active session");
    } else {
      console.warn("[AdminLayout] Access denied: user is not an admin");
    }

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
