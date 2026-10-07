"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "./Logo";
import { NavLinks, type NavItem } from "./NavLinks";

export function Shell({
  items,
  user,
  logout,
  children,
}: {
  items: NavItem[];
  user: { nama: string; jabatan: string; role: string };
  logout: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const sidebar = (
    <div className="flex h-full flex-col bg-ink px-4 py-5">
      <Link href="/dashboard" className="mb-8 flex items-center gap-3 px-2">
        <Logo className="h-9 w-9" />
        <span className="leading-tight">
          <span className="block text-lg font-extrabold tracking-tight text-white">IVANA</span>
          <span className="block text-[11px] text-slate-400">Dashboard GRB</span>
        </span>
      </Link>
      <nav aria-label="Menu dashboard" className="flex-1">
        <NavLinks items={items} onNavigate={() => setOpen(false)} />
      </nav>
      <div className="mt-6 border-t border-white/10 px-2 pt-4">
        <p className="truncate text-sm font-semibold text-white">{user.nama}</p>
        <p className="truncate text-xs text-slate-400">
          {user.jabatan || "-"} · {user.role === "admin" ? "Admin" : "PIC"}
        </p>
        <div className="mt-3">{logout}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      <div className="hidden bg-ink lg:block">
        <aside className="sticky top-0 h-screen">{sidebar}</aside>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button aria-label="Tutup menu" className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-64">{sidebar}</aside>
        </div>
      )}

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <button className="btn btn-secondary px-3" aria-label="Buka menu" onClick={() => setOpen(true)}>
            ☰
          </button>
          <span className="font-bold">IVANA</span>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
