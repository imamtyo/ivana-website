// Kolom tanggal_update di Data Table disimpan sebagai serial Excel karena
// ditulis balik ke workbook GRB_Input. Semua perhitungan "hari ini" memakai WIB.

const DAY_MS = 86_400_000;
const WIB_OFFSET_MS = 7 * 3_600_000;
const EXCEL_EPOCH_MS = Date.UTC(1899, 11, 30);
export const TIMEZONE = "Asia/Jakarta";

/** Serial Excel untuk tanggal WIB saat ini (sama dengan rumus di Tool-UpdateProyek v2). */
export function todaySerialWIB(now: Date = new Date()): number {
  return Math.floor((now.getTime() + WIB_OFFSET_MS) / DAY_MS) + 25569;
}

/** Serial Excel hari Senin minggu berjalan (WIB). */
export function startOfWeekSerialWIB(now: Date = new Date()): number {
  const today = todaySerialWIB(now);
  const wibDay = new Date(now.getTime() + WIB_OFFSET_MS).getUTCDay(); // 0 = Minggu
  const sinceMonday = (wibDay + 6) % 7;
  return today - sinceMonday;
}

/** Serial yang dianggap valid (sekitar 1954–2119); di luar itu berarti kosong. */
export function isValidSerial(v: unknown): v is number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 20000 && n <= 80000;
}

export function serialToDate(serial: number): Date {
  return new Date(EXCEL_EPOCH_MS + serial * DAY_MS);
}

export function formatSerial(v: unknown): string {
  if (!isValidSerial(v)) return "-";
  return serialToDate(Number(v)).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatDateTimeWIB(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIMEZONE,
  });
}

/** Tanggal WIB (YYYY-MM-DD) dari sebuah instant. */
export function wibDateKey(d: Date): string {
  return new Date(d.getTime() + WIB_OFFSET_MS).toISOString().slice(0, 10);
}

/** Ubah input datetime-local ("2026-10-08T10:00") yang diisi dalam WIB menjadi ISO UTC. */
export function wibLocalToIso(local: string): string | null {
  const m = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})$/.exec(local.trim());
  if (!m) return null;
  const d = new Date(`${m[1]}T${m[2]}:00+07:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
