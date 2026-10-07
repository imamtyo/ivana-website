# IVANA Website & Dashboard

Repo ini berisi dua bagian:

1. **Landing page** publik IVANA (`/`) dan halaman GRB Apps (`/grb-apps`), berupa HTML statis di `public/`.
2. **Dashboard IVANA** (`/login`, `/dashboard/*`), sebuah aplikasi Next.js untuk tim GRB:
   - **Ringkasan**: jumlah proyek, total MW, PIC yang belum lapor, agenda hari ini, update terbaru.
   - **Proyek**: pencarian (logika yang sama dengan tool *Search* di bot), filter, dan detail proyek.
   - **Lapor progress**: format `[Update] / [Inprogress] / [Selesai]`, sama dengan laporan via WhatsApp.
   - **Status Lapor**: PIC yang belum melaporkan progress minggu ini.
   - **Agenda**: lihat, catat, dan hapus agenda tim.
   - **Knowledge**: cari, tambah, dan edit knowledge base GRB.
   - **Kontak**: khusus admin, daftar kontak dan hak aksesnya.

Ini adalah **tahap 1** migrasi IVANA dari n8n ke web app. Dashboard membaca dan menulis **Data Table n8n
yang sama** dengan bot IVANA, sehingga:

- Progress yang dilaporkan lewat dashboard langsung terlihat oleh bot WhatsApp, dan sebaliknya.
- Baris yang diubah ditandai `dirty=1`, sehingga ikut ditulis balik ke Excel `GRB_Input` oleh workflow
  **Sync-Excel-DataTable-2Arah**, persis seperti laporan dari bot.
- Workflow n8n yang sudah ada tidak perlu diubah.

## Login

Login memakai **nomor WhatsApp + kode OTP** yang dikirim lewat OpenWA (instance yang sama dengan bot):

- Hanya nomor yang terdaftar di Data Table **Kontak** yang bisa masuk.
- Peran **admin** diberikan kepada kontak dengan jabatan di `ADMIN_JABATAN` (default `Admin,PMO`) atau nomor
  di `ADMIN_NUMBERS`. Admin bisa mengubah progress semua proyek dan melihat halaman Kontak.
- Kontak lain berperan **PIC**. PIC hanya bisa melaporkan progress proyek yang mencantumkan namanya di kolom
  `pic`, `admin`, atau `manager`. Pengecekan ini dilakukan di server, bukan oleh AI.
- Kode OTP berlaku 5 menit, maksimal 5 kali percobaan, dan bisa diminta ulang setelah 60 detik (maksimal 5 kali per jam).
- Sesi berlaku 7 hari (cookie httpOnly bertanda tangan). Kontak yang dihapus dari tabel langsung kehilangan akses.

## Menjalankan secara lokal

```bash
npm install
cp .env.example .env.local     # default: DATA_SOURCE=mock, OTP_DEV_MODE=true
npm run dev                    # http://localhost:3000
```

Dengan `DATA_SOURCE=mock`, dashboard memakai **data contoh fiktif** dan kode OTP ditampilkan di layar.
Nomor contoh:

- `081200000001`: Admin Demo
- `081200000002`: PIC, Andi Pratama

Perintah pemeriksaan:

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

## Deploy di Coolify

> **Penting:** situs `ivanaplnip.web.id` saat ini disajikan sebagai situs statis. Setelah perubahan ini
> di-merge, `index.html` pindah ke `public/`. Karena itu, **ubah dulu resource di Coolify agar build memakai
> `Dockerfile`** (atau buat resource baru) sebelum merge. Jika tidak, situs yang sedang live bisa rusak.

1. Coolify → resource website → **Build Pack: Dockerfile**, port **3000**.
2. Isi **Environment Variables** (lihat `.env.example`):
   - `DATA_SOURCE=n8n`
   - `N8N_BASE_URL`, `N8N_API_KEY`: buat API key di n8n → *Settings → n8n API*.
   - `N8N_TABLE_PROYEK`, `N8N_TABLE_KONTAK`, `N8N_TABLE_AGENDA`, `N8N_TABLE_KNOWLEDGE`: ID Data Table,
     bisa dilihat di URL tabel pada n8n (`/projects/<project>/datatables/<ID>`).
   - `OPENWA_BASE_URL`, `OPENWA_API_KEY`, `OPENWA_SESSION_ID`: session WA yang dipakai bot.
   - `SESSION_SECRET`: string acak minimal 32 karakter (`openssl rand -base64 48`).
   - `OTP_DEV_MODE` jangan diisi di produksi. Nilainya juga diabaikan otomatis saat `NODE_ENV=production`.
3. Opsional, untuk riwayat progress: jalankan
   `N8N_BASE_URL=... N8N_API_KEY=... npm run setup:n8n`. Skrip ini membuat Data Table `progress_log`.
   Isi ID yang dicetak ke `N8N_TABLE_PROGRESS_LOG`.

Aplikasi menyimpan OTP di memori, jadi jalankan **satu instance** saja (bawaan Coolify).

> Repo ini **publik**: jangan commit file `.env`, API key, ID tabel, atau data proyek/kontak asli.

## Struktur

```
public/                 landing page statis, og-image, robots.txt, grb-apps/
src/app/login/          halaman & server action login OTP
src/app/dashboard/      halaman dashboard + server actions
src/lib/proyek.ts       penggabungan kode_induk, pencarian, hak akses, status lapor
src/lib/dates.ts        serial tanggal Excel & zona WIB
src/lib/data/           sumber data: n8n.ts (Public API Data Table), mock.ts (data fiktif)
src/lib/otp.ts          OTP (memori, rate limit)
src/lib/session.ts      sesi JWT di cookie
scripts/                skrip setup Data Table n8n
```

## Rencana tahap berikutnya

1. Pindahkan data dari Data Table n8n ke PostgreSQL. Tambahkan adapter baru di `src/lib/data/`
   tanpa mengubah halaman dashboard.
2. Pindahkan jadwal (reminder agenda harian, reminder PIC, cek belum lapor) ke cron di aplikasi ini.
3. Pindahkan bot WhatsApp: webhook OpenWA/Kirim, AI agent, dan tool (Search, UpdateProyek, Agenda,
   Knowledge, Analyst) ke aplikasi ini.
4. Matikan workflow n8n yang sudah digantikan.
