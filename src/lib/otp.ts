import { createHash, randomInt, timingSafeEqual } from "node:crypto";

// Penyimpanan OTP di memori proses. Cukup untuk satu instance (deploy Coolify satu container);
// OTP yang sedang menunggu akan hilang jika container restart, user cukup minta kode baru.

export const OTP_TTL_MS = 5 * 60_000;
export const OTP_RESEND_COOLDOWN_MS = 60_000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_MAX_SENDS_PER_HOUR = 5;

interface Entry {
  hash: Buffer;
  expiresAt: number;
  attempts: number;
}

interface Store {
  pending: Map<string, Entry>;
  sends: Map<string, number[]>;
}

const g = globalThis as unknown as { __ivanaOtp?: Store };
const store = (): Store => (g.__ivanaOtp ??= { pending: new Map(), sends: new Map() });

const digest = (nomor: string, code: string) => createHash("sha256").update(`${nomor}:${code}`).digest();

export type IssueResult = { ok: true; code: string } | { ok: false; reason: "cooldown" | "limit"; retryInSec: number };

/** Buat OTP baru untuk nomor; menolak jika terlalu sering diminta. */
export function issueOtp(nomor: string, now = Date.now()): IssueResult {
  const s = store();
  const recent = (s.sends.get(nomor) ?? []).filter((t) => now - t < 3_600_000);
  const last = recent[recent.length - 1];
  if (last !== undefined && now - last < OTP_RESEND_COOLDOWN_MS) {
    return { ok: false, reason: "cooldown", retryInSec: Math.ceil((OTP_RESEND_COOLDOWN_MS - (now - last)) / 1000) };
  }
  if (recent.length >= OTP_MAX_SENDS_PER_HOUR) {
    return { ok: false, reason: "limit", retryInSec: Math.ceil((3_600_000 - (now - recent[0])) / 1000) };
  }
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  s.pending.set(nomor, { hash: digest(nomor, code), expiresAt: now + OTP_TTL_MS, attempts: 0 });
  s.sends.set(nomor, [...recent, now]);
  return { ok: true, code };
}

/** Batalkan OTP (misalnya jika pengiriman WA gagal). */
export function revokeOtp(nomor: string) {
  store().pending.delete(nomor);
}

export type VerifyResult = "ok" | "invalid" | "expired" | "too_many";

export function verifyOtp(nomor: string, code: string, now = Date.now()): VerifyResult {
  const s = store();
  const e = s.pending.get(nomor);
  if (!e || now > e.expiresAt) {
    s.pending.delete(nomor);
    return "expired";
  }
  e.attempts++;
  const match = /^\d{6}$/.test(code) && timingSafeEqual(e.hash, digest(nomor, code));
  if (match) {
    s.pending.delete(nomor);
    return "ok";
  }
  if (e.attempts >= OTP_MAX_ATTEMPTS) {
    s.pending.delete(nomor);
    return "too_many";
  }
  return "invalid";
}

/** Hanya untuk test. */
export function __resetOtpStore() {
  delete g.__ivanaOtp;
}
