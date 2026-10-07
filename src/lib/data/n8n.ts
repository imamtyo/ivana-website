import "server-only";
import type { Agenda, Knowledge, Kontak, ProgressLog, ProyekRow } from "../types";
import type { DataStore, KnowledgeInput, NewAgenda, NewProgressLog } from "./store";

type Row = Record<string, unknown> & { id: number };
type Filter = { columnName: string; condition: "eq"; value: string | number };

export interface N8nConfig {
  baseUrl: string;
  apiKey: string;
  tables: { proyek: string; kontak: string; agenda: string; knowledge: string; progressLog?: string };
}

const CACHE_TTL_MS = 30_000;

/**
 * Akses Data Table n8n lewat Public API (/api/v1/data-tables).
 * Dipakai bersama bot IVANA: perubahan dari dashboard langsung terlihat oleh bot,
 * dan baris yang diubah ditandai dirty=1 agar ikut ditulis balik ke Excel oleh
 * workflow Sync-Excel-DataTable-2Arah.
 */
export class N8nStore implements DataStore {
  private cache = new Map<string, { at: number; rows: Row[] }>();

  constructor(private cfg: N8nConfig) {}

  get hasProgressLog() {
    return Boolean(this.cfg.tables.progressLog);
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.cfg.baseUrl}/api/v1${path}`, {
      ...init,
      headers: {
        "X-N8N-API-KEY": this.cfg.apiKey,
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`n8n API ${init.method ?? "GET"} ${path} gagal: ${res.status} ${body.slice(0, 200)}`);
    }
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  private async allRows(table: string): Promise<Row[]> {
    const hit = this.cache.get(table);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.rows;
    const rows: Row[] = [];
    let cursor: string | undefined;
    for (let page = 0; page < 100; page++) {
      const qs = new URLSearchParams({ limit: "250" });
      if (cursor) qs.set("cursor", cursor);
      const res = await this.request<{ data: Row[]; nextCursor?: string | null }>(
        `/data-tables/${table}/rows?${qs}`,
      );
      rows.push(...res.data);
      if (!res.nextCursor) break;
      cursor = res.nextCursor;
    }
    this.cache.set(table, { at: Date.now(), rows });
    return rows;
  }

  private async insert(table: string, data: Record<string, unknown>[]) {
    await this.request(`/data-tables/${table}/rows`, {
      method: "POST",
      body: JSON.stringify({ data, returnType: "count" }),
    });
    this.cache.delete(table);
  }

  private async update(table: string, filters: Filter[], data: Record<string, unknown>): Promise<number> {
    const res = await this.request<unknown>(`/data-tables/${table}/rows/update`, {
      method: "PATCH",
      body: JSON.stringify({ filter: { type: "and", filters }, data, returnData: true }),
    });
    this.cache.delete(table);
    return Array.isArray(res) ? res.length : res ? 1 : 0;
  }

  private async remove(table: string, filters: Filter[]) {
    const filter = encodeURIComponent(JSON.stringify({ type: "and", filters }));
    await this.request(`/data-tables/${table}/rows/delete?filter=${filter}`, { method: "DELETE" });
    this.cache.delete(table);
  }

  // ---------- proyek ----------

  async listProyekRows(): Promise<ProyekRow[]> {
    return (await this.allRows(this.cfg.tables.proyek)).map(toProyekRow);
  }

  async updateProgress(
    match: { column: "kode_induk" | "kode_ruptl"; value: string },
    data: { progress: string; tanggal_update: number },
  ): Promise<number> {
    return this.update(
      this.cfg.tables.proyek,
      [{ columnName: match.column, condition: "eq", value: match.value }],
      { progress: data.progress, tanggal_update: data.tanggal_update, dirty: 1 },
    );
  }

  // ---------- kontak ----------

  async listKontak(): Promise<Kontak[]> {
    return (await this.allRows(this.cfg.tables.kontak)).map((r) => ({
      id: r.id,
      Kontak: str(r.Kontak),
      Nomor: (r.Nomor as number | string) ?? "",
      Jabatan: str(r.Jabatan),
      Panggilan: str(r.Panggilan),
    }));
  }

  // ---------- agenda ----------

  async listAgenda(): Promise<Agenda[]> {
    return (await this.allRows(this.cfg.tables.agenda)).map((r) => ({
      id: r.id,
      waktu: str(r.waktu),
      judul: str(r.judul),
      deskripsi: str(r.deskripsi),
      pencatat: str(r.pencatat),
      chat_id: str(r.chat_id),
      status_reminded: r.status_reminded === true || r.status_reminded === "true",
    }));
  }

  async addAgenda(a: NewAgenda) {
    await this.insert(this.cfg.tables.agenda, [{ ...a }]);
  }

  async deleteAgenda(id: number) {
    await this.remove(this.cfg.tables.agenda, [{ columnName: "id", condition: "eq", value: id }]);
  }

  // ---------- knowledge ----------

  async listKnowledge(): Promise<Knowledge[]> {
    return (await this.allRows(this.cfg.tables.knowledge)).map((r) => ({
      id: r.id,
      key: str(r.key),
      aliases: str(r.aliases),
      content: str(r.content),
      category: str(r.category),
      pencatat: str(r.pencatat),
      tanggal: str(r.tanggal),
    }));
  }

  async addKnowledge(k: KnowledgeInput) {
    await this.insert(this.cfg.tables.knowledge, [{ ...k }]);
  }

  async updateKnowledge(id: number, k: Partial<KnowledgeInput>) {
    await this.update(this.cfg.tables.knowledge, [{ columnName: "id", condition: "eq", value: id }], k);
  }

  async deleteKnowledge(id: number) {
    await this.remove(this.cfg.tables.knowledge, [{ columnName: "id", condition: "eq", value: id }]);
  }

  // ---------- riwayat progress (opsional) ----------

  async listProgressLog(kodeInduk: string): Promise<ProgressLog[]> {
    const table = this.cfg.tables.progressLog;
    if (!table) return [];
    return (await this.allRows(table))
      .filter((r) => str(r.kode_induk) === kodeInduk)
      .map((r) => ({
        id: r.id,
        kode_induk: str(r.kode_induk),
        nama_proyek: str(r.nama_proyek),
        progress: str(r.progress),
        pelapor: str(r.pelapor),
        nomor_pelapor: str(r.nomor_pelapor),
        sumber: str(r.sumber),
        waktu: str(r.waktu),
      }))
      .sort((a, b) => b.waktu.localeCompare(a.waktu));
  }

  async appendProgressLog(entry: NewProgressLog) {
    const table = this.cfg.tables.progressLog;
    if (!table) return;
    await this.insert(table, [{ ...entry }]);
  }
}

function str(v: unknown): string {
  return v === null || v === undefined ? "" : String(v);
}

function numOr0(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function toProyekRow(r: Record<string, unknown>): ProyekRow {
  return {
    id: numOr0(r.id),
    no_pmo: numOr0(r.no_pmo),
    kode_ruptl: str(r.kode_ruptl).trim(),
    kode_induk: str(r.kode_induk).trim(),
    tabel_ruptl: str(r.tabel_ruptl),
    sistem: str(r.sistem),
    provinsi: str(r.provinsi),
    jenis: str(r.jenis),
    nama_ruptl: str(r.nama_ruptl),
    nama_proyek: str(r.nama_proyek),
    kapasitas_mw: numOr0(r.kapasitas_mw),
    cod_ruptl: numOr0(r.cod_ruptl),
    prioritas: str(r.prioritas),
    porsi: str(r.porsi),
    skema: str(r.skema),
    saham: numOr0(r.saham),
    capex_musd: numOr0(r.capex_musd),
    ekuitas_musd: numOr0(r.ekuitas_musd),
    kebutuhan_ai_miliar: numOr0(r.kebutuhan_ai_miliar),
    stage_pmo: str(r.stage_pmo),
    stage_dirrenbang: str(r.stage_dirrenbang),
    pic: str(r.pic),
    progress: str(r.progress),
    tanggal_update: numOr0(r.tanggal_update),
    admin: str(r.admin),
    manager: str(r.manager),
    divisi_grb: str(r.divisi_grb),
    tahun_rkap: numOr0(r.tahun_rkap),
    rkap_ai: str(r.rkap_ai),
    highlight_issue: str(r.highlight_issue),
    tanggal_update_issue: numOr0(r.tanggal_update_issue),
    cod_realistis: str(r.cod_realistis),
    dirty: numOr0(r.dirty),
  };
}
