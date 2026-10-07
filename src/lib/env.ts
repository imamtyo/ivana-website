import "server-only";

function read(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

export const env = {
  /** "n8n" (produksi, baca/tulis Data Table n8n) atau "mock" (data contoh fiktif). */
  dataSource: (read("DATA_SOURCE") ?? "mock") as "n8n" | "mock",
  n8n: {
    baseUrl: read("N8N_BASE_URL")?.replace(/\/+$/, ""),
    apiKey: read("N8N_API_KEY"),
    tables: {
      proyek: read("N8N_TABLE_PROYEK"),
      kontak: read("N8N_TABLE_KONTAK"),
      agenda: read("N8N_TABLE_AGENDA"),
      knowledge: read("N8N_TABLE_KNOWLEDGE"),
      progressLog: read("N8N_TABLE_PROGRESS_LOG"),
    },
  },
  openwa: {
    baseUrl: read("OPENWA_BASE_URL")?.replace(/\/+$/, ""),
    apiKey: read("OPENWA_API_KEY"),
    sessionId: read("OPENWA_SESSION_ID"),
  },
  sessionSecret: read("SESSION_SECRET"),
  /** Jabatan di tabel Kontak yang otomatis mendapat peran admin. */
  adminJabatan: (read("ADMIN_JABATAN") ?? "Admin,PMO").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
  /** Nomor WA tambahan yang mendapat peran admin (dipisah koma). */
  adminNumbers: (read("ADMIN_NUMBERS") ?? "").split(",").map((s) => s.replace(/\D/g, "")).filter(Boolean),
  /** chat_id yang dicatat untuk agenda dari dashboard. */
  agendaChatId: read("AGENDA_CHAT_ID") ?? "dashboard",
  /** Tampilkan kode OTP di layar (hanya untuk pengembangan lokal). */
  otpDevMode: read("OTP_DEV_MODE") === "true" && process.env.NODE_ENV !== "production",
};
