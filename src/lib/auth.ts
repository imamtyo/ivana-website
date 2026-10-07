import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getStore } from "./data";
import { env } from "./env";
import { normalizePhone } from "./phone";
import { readSession } from "./session";
import type { Kontak, SessionUser } from "./types";

export function roleFor(k: Pick<Kontak, "Jabatan">, nomor: string): SessionUser["role"] {
  const jabatan = String(k.Jabatan ?? "").trim().toLowerCase();
  if (env.adminJabatan.includes(jabatan) || env.adminNumbers.includes(nomor)) return "admin";
  return "pic";
}

export async function findKontakByNomor(nomor: string): Promise<Kontak | undefined> {
  const kontak = await getStore().listKontak();
  return kontak.find((k) => normalizePhone(k.Nomor) === nomor);
}

export function toSessionUser(k: Kontak, nomor: string): SessionUser {
  return {
    nomor,
    nama: k.Kontak.trim(),
    panggilan: (k.Panggilan || k.Kontak).trim(),
    jabatan: (k.Jabatan ?? "").trim(),
    role: roleFor(k, nomor),
  };
}

/**
 * User yang sedang login. Kontak dicek ulang setiap request (data kontak di-cache 30 detik),
 * jadi orang yang dihapus dari tabel Kontak langsung kehilangan akses dan perubahan jabatan
 * langsung berlaku.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const s = await readSession();
  if (!s) return null;
  const k = await findKontakByNomor(s.nomor);
  return k ? toSessionUser(k, s.nomor) : null;
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/dashboard");
  return user;
}
