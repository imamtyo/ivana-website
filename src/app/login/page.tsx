import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Masuk" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-brand-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-3">
          <Logo className="h-11 w-11" />
          <span className="text-left leading-tight">
            <span className="block text-xl font-extrabold tracking-tight text-slate-900">IVANA</span>
            <span className="block text-xs text-slate-500">Indonesiapower Virtual Assistant</span>
          </span>
        </Link>
        <div className="card p-6 sm:p-8">
          <h1 className="text-lg font-bold text-slate-900">Masuk ke Dashboard</h1>
          <p className="mb-6 mt-1 text-sm text-slate-500">Kode masuk dikirim oleh IVANA ke WhatsApp Anda.</p>
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-slate-500">
          <Link href="/" className="hover:text-slate-800">
            ← Kembali ke beranda
          </Link>
        </p>
      </div>
    </main>
  );
}
