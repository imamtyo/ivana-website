/** Normalisasi nomor WA Indonesia ke format 62xxxxxxxxxx; null jika tidak valid. */
export function normalizePhone(input: unknown): string | null {
  let n = String(input ?? "").replace(/\D/g, "");
  if (n.startsWith("0")) n = "62" + n.slice(1);
  else if (n.startsWith("8")) n = "62" + n;
  return /^62\d{8,13}$/.test(n) ? n : null;
}

export function maskPhone(nomor: string): string {
  if (nomor.length < 8) return nomor;
  return nomor.slice(0, 4) + "•".repeat(nomor.length - 7) + nomor.slice(-3);
}
