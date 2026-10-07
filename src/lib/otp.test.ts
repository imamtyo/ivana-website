import { beforeEach, describe, expect, it } from "vitest";
import { __resetOtpStore, issueOtp, OTP_MAX_ATTEMPTS, OTP_TTL_MS, verifyOtp } from "./otp";

describe("OTP", () => {
  beforeEach(() => __resetOtpStore());

  it("kode benar berhasil sekali saja", () => {
    const r = issueOtp("628111", 0);
    if (!r.ok) throw new Error("harus ok");
    expect(r.code).toMatch(/^\d{6}$/);
    expect(verifyOtp("628111", r.code, 1000)).toBe("ok");
    expect(verifyOtp("628111", r.code, 2000)).toBe("expired");
  });

  it("kedaluwarsa setelah TTL", () => {
    const r = issueOtp("628111", 0);
    if (!r.ok) throw new Error("harus ok");
    expect(verifyOtp("628111", r.code, OTP_TTL_MS + 1)).toBe("expired");
  });

  it("dikunci setelah terlalu banyak percobaan salah", () => {
    const r = issueOtp("628111", 0);
    if (!r.ok) throw new Error("harus ok");
    const wrong = r.code === "000000" ? "111111" : "000000";
    for (let i = 1; i < OTP_MAX_ATTEMPTS; i++) expect(verifyOtp("628111", wrong, 10)).toBe("invalid");
    expect(verifyOtp("628111", wrong, 10)).toBe("too_many");
    expect(verifyOtp("628111", r.code, 10)).toBe("expired");
  });

  it("membatasi permintaan ulang", () => {
    expect(issueOtp("628111", 0).ok).toBe(true);
    expect(issueOtp("628111", 30_000)).toMatchObject({ ok: false, reason: "cooldown" });
    let t = 0;
    for (let i = 1; i < 5; i++) expect(issueOtp("628111", (t += 61_000)).ok).toBe(true);
    expect(issueOtp("628111", (t += 61_000))).toMatchObject({ ok: false, reason: "limit" });
  });
});
