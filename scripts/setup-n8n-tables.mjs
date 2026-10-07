// Membuat Data Table "progress_log" di n8n untuk riwayat laporan progress dari dashboard.
// Pemakaian: N8N_BASE_URL=... N8N_API_KEY=... node scripts/setup-n8n-tables.mjs
// Setelah berhasil, isi N8N_TABLE_PROGRESS_LOG dengan ID yang dicetak.

const base = process.env.N8N_BASE_URL?.replace(/\/+$/, "");
const key = process.env.N8N_API_KEY;
if (!base || !key) {
  console.error("Isi N8N_BASE_URL dan N8N_API_KEY terlebih dahulu.");
  process.exit(1);
}

const headers = { "X-N8N-API-KEY": key, "Content-Type": "application/json", Accept: "application/json" };

const list = await fetch(`${base}/api/v1/data-tables?limit=250`, { headers });
if (!list.ok) {
  console.error(`Gagal membaca daftar Data Table: ${list.status} ${await list.text()}`);
  process.exit(1);
}
const existing = (await list.json()).data?.find((t) => t.name === "progress_log");
if (existing) {
  console.log(`Data Table "progress_log" sudah ada. N8N_TABLE_PROGRESS_LOG=${existing.id}`);
  process.exit(0);
}

const res = await fetch(`${base}/api/v1/data-tables`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    name: "progress_log",
    columns: [
      { name: "kode_induk", type: "string" },
      { name: "nama_proyek", type: "string" },
      { name: "progress", type: "string" },
      { name: "pelapor", type: "string" },
      { name: "nomor_pelapor", type: "string" },
      { name: "sumber", type: "string" },
      { name: "waktu", type: "string" },
    ],
  }),
});
if (!res.ok) {
  console.error(`Gagal membuat Data Table: ${res.status} ${await res.text()}`);
  process.exit(1);
}
const table = await res.json();
console.log(`Data Table "progress_log" dibuat. N8N_TABLE_PROGRESS_LOG=${table.id}`);
