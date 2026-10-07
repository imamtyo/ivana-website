import { describe, expect, it } from "vitest";
import { toProyekRow } from "./data/n8n";
import {
  applyFilters,
  canEditProject,
  composeProgress,
  findProject,
  groupProjects,
  parseProgress,
  picReportStatus,
  searchProjects,
} from "./proyek";
import type { ProyekRow, SessionUser } from "./types";


const row = (o: Partial<ProyekRow>): ProyekRow => toProyekRow({ id: 1, ...o });

const ROWS: ProyekRow[] = [
  row({ id: 1, kode_ruptl: "A-1", kode_induk: "A-1", nama_proyek: "PLTP Gunung Satu", jenis: "PLTP", provinsi: "Jawa Barat", kapasitas_mw: 55, capex_musd: 100, pic: "Andi Pratama", tanggal_update: 46100, progress: "lama" }),
  row({ id: 2, kode_ruptl: "A-2", kode_induk: "A-1", nama_proyek: "PLTP Gunung Satu", jenis: "PLTP", provinsi: "Jawa Barat", kapasitas_mw: 55, capex_musd: 50, pic: "Andi Pratama", tanggal_update: 46200, progress: "baru" }),
  row({ id: 3, kode_ruptl: "B-1", kode_induk: "", nama_proyek: "PLTS Saguling", jenis: "PLTS", provinsi: "Jawa Barat", kapasitas_mw: 60, pic: "Bunga Lestari", tanggal_update: 46000 }),
  row({ id: 4, kode_ruptl: "C-1", kode_induk: "C-1", nama_proyek: "PLTS Saguling Terapung", jenis: "PLTS+BESS", provinsi: "Jawa Barat", kapasitas_mw: 92, pic: "", admin: "Eka", tanggal_update: 0 }),
];

const user = (o: Partial<SessionUser> = {}): SessionUser => ({ nomor: "6281", nama: "Andi Pratama", panggilan: "Andi", jabatan: "Officer", role: "pic", ...o });

describe("groupProjects", () => {
  it("menggabungkan baris dengan kode_induk sama dan menjumlahkan MW/CAPEX", () => {
    const ps = groupProjects(ROWS);
    expect(ps).toHaveLength(3);
    const g = ps.find((p) => p.induk === "A-1")!;
    expect(g.kodeRuptl).toEqual(["A-1", "A-2"]);
    expect(g.totalMw).toBe(110);
    expect(g.totalCapex).toBe(150);
    expect(g.progress).toBe("baru");
    expect(g.progressBerbeda).toBe(true);
  });

  it("memakai kode_ruptl sebagai induk jika kode_induk kosong", () => {
    expect(findProject(groupProjects(ROWS), "b-1")?.nama).toBe("PLTS Saguling");
    expect(findProject(groupProjects(ROWS), "A-2")?.induk).toBe("A-1");
  });
});

describe("searchProjects", () => {
  it("kode RUPTL persis langsung ketemu", () => {
    const r = searchProjects(ROWS, "progress A-2 dong");
    expect(r.scope).toBe("kode");
    expect(r.projects.map((p) => p.induk)).toEqual(["A-1"]);
  });

  it("membuang stopword dan mengutamakan nama persis", () => {
    const r = searchProjects(ROWS, "info proyek PLTS Saguling");
    expect(r.scope).toBe("nama persis");
    expect(r.projects.map((p) => p.induk)).toEqual(["B-1"]);
  });

  it("fallback kecocokan sebagian bila tidak semua kata cocok", () => {
    const r = searchProjects(ROWS, "saguling sulawesi");
    expect(r.fuzzy).toBe(true);
    expect(r.projects.length).toBe(2);
  });

  it("query kosong mengembalikan semua proyek", () => {
    expect(searchProjects(ROWS, "  ").projects).toHaveLength(3);
  });
});

describe("filters dan hak akses", () => {
  it("filter jenis dan proyek saya", () => {
    const ps = groupProjects(ROWS);
    expect(applyFilters(ps, { jenis: "PLTS" }).map((p) => p.induk)).toEqual(["B-1"]);
    expect(applyFilters(ps, { milikSaya: true }, user()).map((p) => p.induk)).toEqual(["A-1"]);
  });

  it("PIC hanya boleh mengubah proyeknya, admin boleh semua", () => {
    const [a, b] = groupProjects(ROWS);
    expect(canEditProject(a, user())).toBe(true);
    expect(canEditProject(b, user())).toBe(false);
    expect(canEditProject(b, user({ role: "admin" }))).toBe(true);
    expect(canEditProject(b, user({ nama: "An" }))).toBe(false);
  });
});

describe("progress terstruktur", () => {
  it("parse dan compose bolak-balik", () => {
    const text = "[Update] Sudah PQ.\nbaris dua\n[Inprogress] -\n[Selesai] Survei";
    const p = parseProgress(text);
    expect(p).toEqual({ update: "Sudah PQ.\nbaris dua", inprogress: "", selesai: "Survei", structured: true });
    expect(composeProgress(p)).toBe("[Update] Sudah PQ.\nbaris dua\n[Inprogress] -\n[Selesai] Survei");
  });

  it("teks bebas dianggap tidak terstruktur", () => {
    expect(parseProgress("catatan bebas")).toMatchObject({ update: "catatan bebas", structured: false });
  });
});

describe("picReportStatus", () => {
  it("PIC sudah lapor jika salah satu proyeknya diperbarui sejak Senin WIB", () => {
    // Rabu 2026-10-07 10:00 WIB → Senin = 2026-10-05 = serial 46300
    const now = new Date("2026-10-07T03:00:00Z");
    const rows = [
      row({ kode_ruptl: "X", nama_proyek: "X", pic: "Andi", tanggal_update: 46300 }),
      row({ kode_ruptl: "Y", nama_proyek: "Y", pic: "Andi", tanggal_update: 46000 }),
      row({ kode_ruptl: "Z", nama_proyek: "Z", pic: "Budi", tanggal_update: 46299 }),
      row({ kode_ruptl: "W", nama_proyek: "W", pic: "Selesai di GRB", tanggal_update: 0 }),
    ];
    const s = picReportStatus(groupProjects(rows), now);
    expect(s.map((x) => [x.pic, x.sudahLapor])).toEqual([["Budi", false], ["Andi", true]]);
  });
});
