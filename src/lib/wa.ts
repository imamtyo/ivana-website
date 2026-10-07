import "server-only";
import { env } from "./env";

/** Kirim pesan teks WhatsApp lewat OpenWA (instance yang sama dengan bot IVANA). */
export async function sendWhatsAppText(nomor: string, text: string): Promise<void> {
  const { baseUrl, apiKey, sessionId } = env.openwa;
  if (!baseUrl || !apiKey || !sessionId) {
    throw new Error("OpenWA belum dikonfigurasi (OPENWA_BASE_URL, OPENWA_API_KEY, OPENWA_SESSION_ID).");
  }
  const res = await fetch(`${baseUrl}/api/sessions/${encodeURIComponent(sessionId)}/messages/send-text`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
    body: JSON.stringify({ chatId: `${nomor}@c.us`, text }),
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`OpenWA send-text gagal: ${res.status} ${body.slice(0, 200)}`);
  }
}
