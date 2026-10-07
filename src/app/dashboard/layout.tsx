import { Shell } from "@/components/Shell";
import type { NavItem } from "@/components/NavLinks";
import { requireUser } from "@/lib/auth";
import { logoutAction } from "../login/actions";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const items: NavItem[] = [
    { href: "/dashboard", label: "Ringkasan", icon: "◎" },
    { href: "/dashboard/proyek", label: "Proyek", icon: "⚡" },
    { href: "/dashboard/belum-lapor", label: "Status Lapor", icon: "✓" },
    { href: "/dashboard/agenda", label: "Agenda", icon: "▦" },
    { href: "/dashboard/knowledge", label: "Knowledge", icon: "✎" },
    ...(user.role === "admin" ? [{ href: "/dashboard/kontak", label: "Kontak", icon: "☎" }] : []),
  ];
  return (
    <Shell
      items={items}
      user={user}
      logout={
        <form action={logoutAction}>
          <button className="text-xs font-medium text-slate-300 hover:text-white">Keluar →</button>
        </form>
      }
    >
      {children}
    </Shell>
  );
}
