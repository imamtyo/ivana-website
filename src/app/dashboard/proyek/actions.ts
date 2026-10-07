"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { getStore } from "@/lib/data";
import { todaySerialWIB } from "@/lib/dates";
import { canEditProject, composeProgress, findProject, groupProjects } from "@/lib/proyek";

export type ProgressState = { ok?: boolean; message?: string };

const MAX_LEN = 4000;

export async function updateProgressAction(_prev: ProgressState, form: FormData): Promise<ProgressState> {
  const user = await requireUser();
  const kode = String(form.get("kode") ?? "");
  const parts = {
    update: String(form.get("update") ?? ""),
    inprogress: String(form.get("inprogress") ?? ""),
    selesai: String(form.get("selesai") ?? ""),
  };
  if (!parts.update.trim()) return { ok: false, message: "Kolom Update wajib diisi." };

  const progress = composeProgress(parts);
  if (progress.length > MAX_LEN) return { ok: false, message: `Laporan terlalu panjang (maks. ${MAX_LEN} karakter).` };

  const store = getStore();
  const proyek = findProject(groupProjects(await store.listProyekRows()), kode);
  if (!proyek) return { ok: false, message: "Proyek tidak ditemukan." };
  if (!canEditProject(proyek, user)) {
    return { ok: false, message: "Anda bukan PIC, admin, atau manager proyek ini, jadi tidak dapat mengubah progress." };
  }

  // Sama dengan Tool-UpdateProyek v2: progress diterapkan ke semua baris RUPTL dalam satu kode_induk.
  // Baris lama tanpa kode_induk diperbarui lewat kode_ruptl-nya sendiri.
  const tanggal_update = todaySerialWIB();
  let updated = 0;
  if (proyek.rows.some((r) => r.kode_induk === proyek.induk)) {
    updated += await store.updateProgress({ column: "kode_induk", value: proyek.induk }, { progress, tanggal_update });
  }
  for (const r of proyek.rows.filter((r) => !r.kode_induk)) {
    updated += await store.updateProgress({ column: "kode_ruptl", value: r.kode_ruptl }, { progress, tanggal_update });
  }

  if (store.hasProgressLog) {
    try {
      await store.appendProgressLog({
        kode_induk: proyek.induk,
        nama_proyek: proyek.nama,
        progress,
        pelapor: user.nama,
        nomor_pelapor: user.nomor,
        sumber: "dashboard",
        waktu: new Date().toISOString(),
      });
    } catch (e) {
      // Progress utama sudah tersimpan; kegagalan log tidak membatalkannya.
      console.error("[progress] gagal menulis riwayat", e);
    }
  }

  revalidatePath("/dashboard", "layout");
  return {
    ok: true,
    message:
      updated > 1
        ? `Progress tersimpan dan diterapkan ke ${updated} baris RUPTL (${proyek.kodeRuptl.join(", ")}). Excel akan ikut diperbarui pada sinkronisasi berikutnya.`
        : "Progress tersimpan. Excel akan ikut diperbarui pada sinkronisasi berikutnya.",
  };
}
