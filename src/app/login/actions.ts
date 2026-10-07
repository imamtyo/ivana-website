"use server";

import { redirect } from "next/navigation";
import { findKontakByNomor, toSessionUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { issueOtp, revokeOtp, verifyOtp } from "@/lib/otp";
import { normalizePhone } from "@/lib/phone";
import { createSession, destroySession } from "@/lib/session";
import { sendWhatsAppText } from "@/lib/wa";

export type LoginState =
  | { step: "nomor"; error?: string; nomor?: string }
  | { step: "kode"; nomor: string; info?: string; error?: string; devCode?: string };

const GENERIC_SENT = "Jika nomor terdaftar di IVANA, kode masuk sudah dikirim lewat WhatsApp.";

async function requestOtpAction(_prev: LoginState, form: FormData): Promise<LoginState> {
  const raw = String(form.get("nomor") ?? "");
  const nomor = normalizePhone(raw);
  if (!nomor) return { step: "nomor", nomor: raw, error: "Format nomor WhatsApp tidak valid. Contoh: 0812xxxxxxx." };

  let kontak;
  try {
    kontak = await findKontakByNomor(nomor);
  } catch (e) {
    console.error("[login] gagal membaca kontak", e);
    return { step: "nomor", nomor: raw, error: "Data kontak tidak dapat dibaca. Coba lagi beberapa saat." };
  }

  // Nomor tidak terdaftar tetap mendapat pesan yang sama, supaya daftar nomor tidak bisa ditebak.
  if (!kontak) return { step: "kode", nomor, info: GENERIC_SENT };

  const issued = issueOtp(nomor);
  if (!issued.ok) {
    const menit = Math.ceil(issued.retryInSec / 60);
    return issued.reason === "cooldown"
      ? { step: "kode", nomor, error: `Kode baru bisa diminta lagi dalam ${issued.retryInSec} detik.` }
      : { step: "nomor", nomor: raw, error: `Terlalu banyak permintaan kode. Coba lagi dalam ${menit} menit.` };
  }

  if (env.otpDevMode) {
    console.info(`[login] OTP dev untuk ${nomor}: ${issued.code}`);
    return { step: "kode", nomor, info: GENERIC_SENT, devCode: issued.code };
  }

  try {
    await sendWhatsAppText(
      nomor,
      `Kode masuk Dashboard IVANA: *${issued.code}*\n\nBerlaku 5 menit. Jangan bagikan kode ini kepada siapa pun, termasuk yang mengaku dari IVANA.`,
    );
  } catch (e) {
    console.error("[login] gagal kirim OTP", e);
    revokeOtp(nomor);
    return { step: "nomor", nomor: raw, error: "Kode gagal dikirim lewat WhatsApp. Coba lagi beberapa saat atau hubungi admin." };
  }
  return { step: "kode", nomor, info: GENERIC_SENT };
}

async function verifyOtpAction(_prev: LoginState, form: FormData): Promise<LoginState> {
  const nomor = normalizePhone(form.get("nomor"));
  const kode = String(form.get("kode") ?? "").replace(/\D/g, "");
  if (!nomor) return { step: "nomor", error: "Sesi login tidak valid, masukkan nomor lagi." };

  const result = verifyOtp(nomor, kode);
  if (result === "invalid") return { step: "kode", nomor, error: "Kode salah. Periksa kembali pesan WhatsApp Anda." };
  if (result === "too_many") return { step: "nomor", error: "Terlalu banyak percobaan. Minta kode baru." };
  if (result === "expired") return { step: "kode", nomor, error: "Kode tidak valid atau sudah kedaluwarsa. Minta kode baru." };

  const kontak = await findKontakByNomor(nomor);
  if (!kontak) return { step: "nomor", error: "Nomor tidak lagi terdaftar." };
  await createSession(toSessionUser(kontak, nomor));
  redirect("/dashboard");
}

/** Satu action untuk kedua langkah supaya state form selalu satu sumber. */
export async function loginAction(prev: LoginState, form: FormData): Promise<LoginState> {
  return form.get("intent") === "verify" ? verifyOtpAction(prev, form) : requestOtpAction(prev, form);
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
