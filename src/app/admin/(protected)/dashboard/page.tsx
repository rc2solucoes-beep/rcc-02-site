import Link from "next/link";
import { createSessionClient } from "@/lib/supabase/server";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileText, Users, TrendingUp } from "lucide-react";

export const dynamic = 'force-dynamic';

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
            <a key={key} href={href} className="bg-white border border-border rounded-lg p-6 shadow-sm hover:shadow-md hover:border-rc2-orange hover:-translate-y-1 transition-all group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
                  <p className="text-3xl font-bold text-rc2-ebony">{stats[key]}</p>
                </div>
                <Icon size={20} className="text-rc2-orange/60 group-hover:text-rc2-orange transition-colors" />
              </div>
            </a>
          ))}
        </div>

        <div className="mt-8 bg-white border border-border rounded-lg p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-rc2-ebony mb-3">Acesso rápido</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/posts/novo"
              className={cn(buttonVariants({ variant: "default" }), "bg-rc2-orange text-rc2-sand hover:bg-rc2-orange/90 px-4 h-9")}
            >
              + Novo post
            </Link>
            <Link
              href="/admin/leads"
              className={cn(buttonVariants({ variant: "outline" }), "px-4 h-9")}
            >
              Ver leads
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
