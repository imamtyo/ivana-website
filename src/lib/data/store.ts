import type { Agenda, Knowledge, Kontak, ProgressLog, ProyekRow } from "../types";

export type NewAgenda = Omit<Agenda, "id">;
export type KnowledgeInput = Omit<Knowledge, "id">;
export type NewProgressLog = Omit<ProgressLog, "id">;

/** Sumber data dashboard. Implementasi: n8n Data Table (produksi) dan mock (lokal). */
export interface DataStore {
  listProyekRows(): Promise<ProyekRow[]>;
  /** Perbarui progress semua baris yang cocok; mengembalikan jumlah baris yang diubah. */
  updateProgress(
    match: { column: "kode_induk" | "kode_ruptl"; value: string },
    data: { progress: string; tanggal_update: number },
  ): Promise<number>;

  listKontak(): Promise<Kontak[]>;

  listAgenda(): Promise<Agenda[]>;
  addAgenda(a: NewAgenda): Promise<void>;
  deleteAgenda(id: number): Promise<void>;

  listKnowledge(): Promise<Knowledge[]>;
  addKnowledge(k: KnowledgeInput): Promise<void>;
  updateKnowledge(id: number, k: Partial<KnowledgeInput>): Promise<void>;
  deleteKnowledge(id: number): Promise<void>;

  /** Riwayat progress hanya tersedia jika tabel log dikonfigurasi. */
  readonly hasProgressLog: boolean;
  listProgressLog(kodeInduk: string): Promise<ProgressLog[]>;
  appendProgressLog(entry: NewProgressLog): Promise<void>;
}
