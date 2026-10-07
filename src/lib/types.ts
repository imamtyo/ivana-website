// Bentuk data mengikuti kolom Data Table n8n yang dipakai bot IVANA,
// supaya dashboard dan bot membaca/menulis tabel yang sama.

export interface ProyekRow {
  id: number;
  no_pmo: number;
  kode_ruptl: string;
  kode_induk: string;
  tabel_ruptl: string;
  sistem: string;
  provinsi: string;
  jenis: string;
  nama_ruptl: string;
  nama_proyek: string;
  kapasitas_mw: number;
  cod_ruptl: number;
  prioritas: string;
  porsi: string;
  skema: string;
  saham: number;
  capex_musd: number;
  ekuitas_musd: number;
  kebutuhan_ai_miliar: number;
  stage_pmo: string;
  stage_dirrenbang: string;
  pic: string;
  progress: string;
  /** Serial tanggal Excel (hari sejak 1899-12-30), tanggal WIB. */
  tanggal_update: number;
  admin: string;
  manager: string;
  divisi_grb: string;
  tahun_rkap: number;
  rkap_ai: string;
  highlight_issue: string;
  tanggal_update_issue: number;
  cod_realistis: string;
  /** 1 = belum ditulis balik ke Excel oleh workflow Sync-Excel-DataTable-2Arah. */
  dirty: number;
}

export interface Kontak {
  id: number;
  Kontak: string;
  Nomor: number | string;
  Jabatan: string;
  Panggilan: string;
}

export interface Agenda {
  id: number;
  /** ISO 8601 (UTC). */
  waktu: string;
  judul: string;
  deskripsi: string;
  pencatat: string;
  chat_id: string;
  status_reminded: boolean;
}

export interface Knowledge {
  id: number;
  key: string;
  aliases: string;
  content: string;
  category: string;
  pencatat: string;
  /** ISO 8601 (UTC). */
  tanggal: string;
}

export interface ProgressLog {
  id: number;
  kode_induk: string;
  nama_proyek: string;
  progress: string;
  pelapor: string;
  nomor_pelapor: string;
  sumber: string;
  waktu: string;
}

export type Role = "admin" | "pic";

export interface SessionUser {
  nomor: string;
  nama: string;
  panggilan: string;
  jabatan: string;
  role: Role;
}
