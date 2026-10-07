import "server-only";
import { todaySerialWIB } from "../dates";
import type { Agenda, Knowledge, Kontak, ProgressLog, ProyekRow } from "../types";
import type { DataStore, KnowledgeInput, NewAgenda, NewProgressLog } from "./store";

// Data contoh FIKTIF untuk pengembangan lokal dan demo. Tidak ada data proyek asli di repo ini.

const PIC = ["Andi Pratama", "Bunga Lestari", "Citra Maharani", "Dimas Saputra"];
const ADMIN = ["Eka Wulandari", "Fajar Nugroho"];
const MANAGER = ["Gilang Ramadhan", "Hana Puspita"];

const SEED: Array<[string, string, string, string, string, number, number, string]> = [
  // kode_ruptl, kode_induk, nama_proyek, jenis, provinsi, mw, cod, divisi
  ["X-01-A-001-JB", "", "PLTS Contoh Alpha", "PLTS", "Jawa Barat", 50, 2027, "GRB I"],
  ["X-01-A-002-JB", "", "PLTS Contoh Beta", "PLTS+BESS", "Jawa Barat", 25, 2028, "GRB I"],
  ["X-01-A-003-JT", "", "PLTB Contoh Gamma", "PLTB", "Jawa Tengah", 70, 2029, "GRB II"],
  ["X-01-A-004-SU", "X-01-A-004-SU", "PLTP Contoh Delta", "PLTP", "Sumatera Utara", 55, 2028, "GRB II"],
  ["X-01-A-005-SU", "X-01-A-004-SU", "PLTP Contoh Delta", "PLTP", "Sumatera Utara", 55, 2030, "GRB II"],
  ["X-01-A-006-KT", "", "PLTMG Contoh Epsilon", "PLTMG", "Kalimantan Timur", 30, 2026, "GRB I"],
  ["X-01-A-007-SS", "", "PLTA Contoh Zeta", "PLTA", "Sulawesi Selatan", 90, 2031, "GRB II"],
  ["X-01-A-008-NT", "", "BESS Contoh Eta", "BESS", "Nusa Tenggara Timur", 10, 2026, "GRB I"],
  ["X-01-A-009-BA", "", "PLTS Contoh Theta", "PLTS", "Bali", 40, 2027, "GRB II"],
  ["X-01-A-010-JI", "", "PLTA PS Contoh Iota", "PLTA PS", "Jawa Timur", 450, 2033, "GRB I"],
  ["X-01-A-011-MA", "", "PLTMG Contoh Kappa", "PLTMG", "Maluku", 20, 2027, "GRB II"],
  ["X-01-A-012-JB", "", "PLTS Contoh Lambda", "PLTS+BESS", "Jawa Barat", 100, 2030, "GRB I"],
];

function seedRows(): ProyekRow[] {
  const today = todaySerialWIB();
  return SEED.map(([kode, induk, nama, jenis, provinsi, mw, cod, divisi], i) => ({
    id: i + 1,
    no_pmo: 900 + i,
    kode_ruptl: kode,
    kode_induk: induk || kode,
    tabel_ruptl: "-",
    sistem: provinsi.startsWith("Jawa") || provinsi === "Bali" ? "Jawa Bali" : "Luar Jawa",
    provinsi,
    jenis,
    nama_ruptl: nama.replace("Contoh ", ""),
    nama_proyek: nama,
    kapasitas_mw: mw,
    cod_ruptl: cod,
    prioritas: ["P0", "P1", "P2"][i % 3],
    porsi: ["IPP", "SH-PLN", "PLN"][i % 3],
    skema: ["P30", "P51", "P100"][i % 3],
    saham: [0.3, 0.51, 1][i % 3],
    capex_musd: Math.round(mw * 1.1 * 10) / 10,
    ekuitas_musd: Math.round(mw * 0.33 * 10) / 10,
    kebutuhan_ai_miliar: Math.round(mw * 15),
    stage_pmo: ["", "OBC-Usulan Penugasan dan Pendanaan (AI dan AKI)", "Procurement-PengadaanEPC SH"][i % 3],
    stage_dirrenbang: ["8. Holding: Kajian", "10. Holding: GRC", "12. SH: Pengadaan"][i % 3],
    pic: PIC[i % PIC.length],
    progress:
      "[Update] Contoh laporan progress terakhir.\n[Inprogress] Penyusunan dokumen kajian.\n[Selesai] Survei lapangan awal.",
    // Sebagian proyek diperbarui minggu ini, sebagian belum, agar halaman Belum Lapor berisi.
    tanggal_update: today - (i % 4 === 0 ? 0 : 10 + i),
    admin: ADMIN[i % ADMIN.length],
    manager: MANAGER[i % MANAGER.length],
    divisi_grb: divisi,
    tahun_rkap: 2026,
    rkap_ai: "",
    highlight_issue: i % 3 === 0 ? "Contoh isu: menunggu persetujuan dokumen." : "",
    tanggal_update_issue: i % 3 === 0 ? today - 3 : 0,
    cod_realistis: String(cod + (i % 2)),
    dirty: 0,
  }));
}

const KONTAK: Kontak[] = [
  { id: 1, Kontak: "Admin Demo", Nomor: 6281200000001, Jabatan: "Admin", Panggilan: "Admin" },
  { id: 2, Kontak: "Andi Pratama", Nomor: 6281200000002, Jabatan: "Officer", Panggilan: "Mas Andi" },
  { id: 3, Kontak: "Bunga Lestari", Nomor: 6281200000003, Jabatan: "Officer", Panggilan: "Mbak Bunga" },
  { id: 4, Kontak: "Citra Maharani", Nomor: 6281200000004, Jabatan: "Senior Officer", Panggilan: "Bu Citra" },
  { id: 5, Kontak: "Dimas Saputra", Nomor: 6281200000005, Jabatan: "Officer", Panggilan: "Mas Dimas" },
  { id: 6, Kontak: "Eka Wulandari", Nomor: 6281200000006, Jabatan: "Admin", Panggilan: "Kak Eka" },
];

function seedAgenda(): Agenda[] {
  const base = new Date();
  const at = (days: number, hour: number) => {
    const d = new Date(base.getTime() + days * 86_400_000);
    const key = new Date(d.getTime() + 7 * 3_600_000).toISOString().slice(0, 10);
    return new Date(`${key}T${String(hour).padStart(2, "0")}:00:00+07:00`).toISOString();
  };
  return [
    { id: 1, waktu: at(0, 9), judul: "Rapat koordinasi mingguan", deskripsi: "Ruang rapat lt. 5", pencatat: "Kak Eka", chat_id: "dashboard", status_reminded: false },
    { id: 2, waktu: at(1, 13), judul: "Review kajian PLTS Contoh Alpha", deskripsi: "-", pencatat: "Mas Andi", chat_id: "dashboard", status_reminded: false },
    { id: 3, waktu: at(-2, 10), judul: "Kick-off pengadaan", deskripsi: "-", pencatat: "Admin", chat_id: "dashboard", status_reminded: true },
  ];
}

function seedKnowledge(): Knowledge[] {
  return [
    { id: 1, key: "Contoh: Stage PMO", aliases: "stage, tahapan", content: "Contoh isi knowledge base: tahapan pengembangan proyek menurut PMO.", category: "istilah", pencatat: "Admin", tanggal: new Date().toISOString() },
    { id: 2, key: "Contoh: Prioritas P0", aliases: "P0, prioritas", content: "Contoh isi: proyek dengan prioritas tertinggi.", category: "istilah", pencatat: "Admin", tanggal: new Date().toISOString() },
  ];
}

interface MockState {
  proyek: ProyekRow[];
  agenda: Agenda[];
  knowledge: Knowledge[];
  log: ProgressLog[];
  seq: number;
}

const g = globalThis as unknown as { __ivanaMock?: MockState };

function state(): MockState {
  g.__ivanaMock ??= { proyek: seedRows(), agenda: seedAgenda(), knowledge: seedKnowledge(), log: [], seq: 1000 };
  return g.__ivanaMock;
}

export class MockStore implements DataStore {
  readonly hasProgressLog = true;

  async listProyekRows() {
    return structuredClone(state().proyek);
  }

  async updateProgress(match: { column: "kode_induk" | "kode_ruptl"; value: string }, data: { progress: string; tanggal_update: number }) {
    let n = 0;
    for (const r of state().proyek) {
      if (r[match.column] === match.value) {
        Object.assign(r, data, { dirty: 1 });
        n++;
      }
    }
    return n;
  }

  async listKontak() {
    return structuredClone(KONTAK);
  }

  async listAgenda() {
    return structuredClone(state().agenda);
  }

  async addAgenda(a: NewAgenda) {
    const s = state();
    s.agenda.push({ ...a, id: ++s.seq });
  }

  async deleteAgenda(id: number) {
    const s = state();
    s.agenda = s.agenda.filter((a) => a.id !== id);
  }

  async listKnowledge() {
    return structuredClone(state().knowledge);
  }

  async addKnowledge(k: KnowledgeInput) {
    const s = state();
    s.knowledge.push({ ...k, id: ++s.seq });
  }

  async updateKnowledge(id: number, k: Partial<KnowledgeInput>) {
    const item = state().knowledge.find((x) => x.id === id);
    if (item) Object.assign(item, k);
  }

  async deleteKnowledge(id: number) {
    const s = state();
    s.knowledge = s.knowledge.filter((x) => x.id !== id);
  }

  async listProgressLog(kodeInduk: string) {
    return state()
      .log.filter((l) => l.kode_induk === kodeInduk)
      .sort((a, b) => b.waktu.localeCompare(a.waktu));
  }

  async appendProgressLog(entry: NewProgressLog) {
    const s = state();
    s.log.push({ ...entry, id: ++s.seq });
  }
}
