"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { LayoutDashboard, FileText, Users, Settings, Shield, LogOut, Menu, X } from "lucide-react";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard",  icon: LayoutDashboard },
  { href: "/admin/posts",     label: "Posts",       icon: FileText },
  { href: "/admin/leads",     label: "Leads",       icon: Users },
  { href: "/admin/security",  label: "Segurança",   icon: Shield },
  { href: "/admin/settings",  label: "Configurações", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin");
    router.refresh();
  };

  const handleNavClick = () => {
    setOpen(false);
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 rounded bg-rc2-ink text-rc2-sand hover:bg-rc2-ink/90 transition-colors"
        aria-label="Menu"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "bg-rc2-ink text-rc2-sand flex flex-col transition-all z-40",
        "fixed md:relative md:z-auto w-56 h-screen md:h-auto shrink-0",
        open ? "left-0" : "-left-56 md:left-0"
      )}>
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
              onClick={handleNavClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors",
                active
                  ? "bg-rc2-orange text-rc2-heading"
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
    </>
  );
}
