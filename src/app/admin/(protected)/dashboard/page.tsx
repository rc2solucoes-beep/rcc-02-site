import { createSessionClient } from "@/lib/supabase/server";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { FileText, Users, TrendingUp } from "lucide-react";

async function getStats() {
  try {
    const supabase = await createSessionClient();
    const [{ count: postsTotal }, { count: leadsTotal }, { count: leadsWeek }] = await Promise.all([
      supabase.from("posts").select("id", { count: "exact", head: true }),
      supabase.from("leads").select("id", { count: "exact", head: true }),
      supabase.from("leads")
        .select("id", { count: "exact", head: true })
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    ]);
    return { postsTotal: postsTotal ?? 0, leadsTotal: leadsTotal ?? 0, leadsWeek: leadsWeek ?? 0 };
  } catch {
    return { postsTotal: 0, leadsTotal: 0, leadsWeek: 0 };
  }
}

const cards = [
  { label: "Posts publicados", key: "postsTotal" as const, icon: FileText, href: "/admin/posts" },
  { label: "Leads totais",     key: "leadsTotal" as const, icon: Users,    href: "/admin/leads" },
  { label: "Leads esta semana", key: "leadsWeek" as const, icon: TrendingUp, href: "/admin/leads" },
];

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <>
      <AdminHeader title="Dashboard" description="Visão geral do site" />
      <div className="p-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {cards.map(({ label, key, icon: Icon, href }) => (
            <a key={key} href={href} className="bg-white border border-border p-6 hover:border-rc2-orange transition-colors group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-rc2-ebony/50 uppercase tracking-wider mb-1">{label}</p>
                  <p className="text-3xl font-bold text-rc2-ebony">{stats[key]}</p>
                </div>
                <Icon size={20} className="text-rc2-orange/60 group-hover:text-rc2-orange transition-colors" />
              </div>
            </a>
          ))}
        </div>

        <div className="mt-8 bg-white border border-border p-6">
          <h2 className="text-sm font-semibold text-rc2-ebony mb-3">Acesso rápido</h2>
          <div className="flex flex-wrap gap-3">
            <a href="/admin/posts/novo" className="px-4 py-2 bg-rc2-orange text-white text-sm font-medium hover:bg-rc2-orange/90 transition-colors">
              + Novo post
            </a>
            <a href="/admin/leads" className="px-4 py-2 border border-border text-sm font-medium text-rc2-ebony hover:border-rc2-orange transition-colors">
              Ver leads
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
