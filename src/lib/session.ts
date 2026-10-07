import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env } from "./env";
import type { SessionUser } from "./types";

export const SESSION_COOKIE = "ivana_session";
const SESSION_DAYS = 7;

function secretKey(): Uint8Array {
  let secret = env.sessionSecret;
  if (!secret) {
    if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET wajib diisi di produksi.");
    secret = "dev-only-secret-ganti-di-produksi-0123456789";
  }
  if (secret.length < 32) throw new Error("SESSION_SECRET minimal 32 karakter.");
  return new TextEncoder().encode(secret);
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.nomor)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86_400,
  });
}

export async function readSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    const { nomor, nama, panggilan, jabatan, role } = payload as unknown as SessionUser;
    if (!nomor || !nama || (role !== "admin" && role !== "pic")) return null;
    return { nomor, nama, panggilan, jabatan, role };
  } catch {
    return null;
  }
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}
