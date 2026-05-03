"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { LayoutDashboard, FileText, Users, Settings, LogOut } from "lucide-react";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard",  icon: LayoutDashboard },
  { href: "/admin/posts",     label: "Posts",       icon: FileText },
  { href: "/admin/leads",     label: "Leads",       icon: Users },
  { href: "/admin/settings",  label: "Configurações", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin");
    router.refresh();
  };

  return (
    <aside className="w-56 shrink-0 bg-rc2-ink text-rc2-sand flex flex-col">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/10">
        <span className="text-xs font-semibold uppercase tracking-widest text-rc2-orange">RC2 Admin</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-0.5 px-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors",
                active
                  ? "bg-rc2-orange text-rc2-sand"
                  : "text-rc2-sand/70 hover:text-rc2-sand hover:bg-white/5"
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded text-sm font-medium text-rc2-sand/70 hover:text-rc2-sand hover:bg-white/5 transition-colors"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  );
}
