import { isValidSerial, startOfWeekSerialWIB } from "./dates";
import type { ProyekRow, SessionUser } from "./types";

/**
 * Satu proyek fisik. Beberapa baris RUPTL dengan kode_induk yang sama
 * digabung menjadi satu proyek, sama seperti Tool-Project_Search_v2.
 */
export interface Proyek {
  induk: string;
  rows: ProyekRow[];
  kodeRuptl: string[];
  nama: string;
  jenis: string[];
  provinsi: string;
  sistem: string;
  divisi: string;
  prioritas: string;
  porsi: string;
  skema: string;
  codRuptl: string;
  codRealistis: string;
  stagePmo: string;
  stageDirrenbang: string;
  totalMw: number;
  totalCapex: number;
  pic: string;
  admin: string;
  manager: string;
  /** Progress dari baris dengan tanggal_update terbaru. */
  progress: string;
  tanggalUpdate: number;
  highlightIssue: string;
  tanggalUpdateIssue: number;
  /** True jika progress antar baris RUPTL dalam satu kelompok berbeda. */
  progressBerbeda: boolean;
}

export const norm = (s: unknown) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const num = (v: unknown) => {
  const n = parseFloat(String(v ?? "").replace(/,/g, "."));
  return Number.isNaN(n) ? 0 : n;
};

export const indukDari = (r: Pick<ProyekRow, "kode_induk" | "kode_ruptl">) =>
  String(r.kode_induk ?? "").trim() || String(r.kode_ruptl ?? "").trim();

function uniq(rows: ProyekRow[], field: keyof ProyekRow): string[] {
  return [...new Set(rows.map((r) => String(r[field] ?? "").trim()).filter(Boolean))];
}

function gabung(anggota: ProyekRow[]): Proyek {
  const urut = [...anggota].sort((a, b) => Number(b.tanggal_update || 0) - Number(a.tanggal_update || 0));
  const utama = urut[0];
  const satu = (f: keyof ProyekRow) => uniq(anggota, f).join(" / ");
  return {
    induk: indukDari(utama),
    rows: anggota,
    kodeRuptl: anggota.map((r) => r.kode_ruptl),
    nama: utama.nama_proyek || utama.nama_ruptl || utama.kode_ruptl,
    jenis: uniq(anggota, "jenis"),
    provinsi: satu("provinsi"),
    sistem: satu("sistem"),
    divisi: satu("divisi_grb"),
    prioritas: satu("prioritas"),
    porsi: satu("porsi"),
    skema: satu("skema"),
    codRuptl: satu("cod_ruptl"),
    codRealistis: satu("cod_realistis"),
    stagePmo: satu("stage_pmo"),
    stageDirrenbang: satu("stage_dirrenbang"),
    totalMw: anggota.reduce((a, r) => a + num(r.kapasitas_mw), 0),
    totalCapex: anggota.reduce((a, r) => a + num(r.capex_musd), 0),
    pic: uniq(anggota, "pic")[0] ?? "",
    admin: uniq(anggota, "admin")[0] ?? "",
    manager: uniq(anggota, "manager")[0] ?? "",
    progress: utama.progress ?? "",
    tanggalUpdate: isValidSerial(utama.tanggal_update) ? Number(utama.tanggal_update) : 0,
    highlightIssue: utama.highlight_issue ?? "",
    tanggalUpdateIssue: isValidSerial(utama.tanggal_update_issue) ? Number(utama.tanggal_update_issue) : 0,
    progressBerbeda: anggota.length > 1 && uniq(anggota, "progress").length > 1,
  };
}

/** Gabungkan semua baris RUPTL menjadi daftar proyek, urutan sesuai baris pertama tiap kelompok. */
export function groupProjects(rows: ProyekRow[]): Proyek[] {
  const kelompok = new Map<string, ProyekRow[]>();
  for (const r of rows) {
    if (!r.kode_ruptl && !r.nama_proyek) continue;
    const k = indukDari(r);
    const list = kelompok.get(k);
    if (list) list.push(r);
    else kelompok.set(k, [r]);
  }
  return [...kelompok.values()].map(gabung);
}

export function findProject(projects: Proyek[], kode: string): Proyek | undefined {
  const k = kode.trim().toUpperCase();
  return projects.find((p) => p.induk.toUpperCase() === k || p.kodeRuptl.some((c) => c.toUpperCase() === k));
}

const STOPWORDS = new Set(
  (
    "cari carikan tolong minta coba lihat cek tampilkan berikan apa apakah siapa siapakah berapa " +
    "bagaimana gimana kapan dimana mana kenapa mengapa adakah pic proyek project proyeknya lokasi nama " +
    "pembangkit plant info informasi detail data status kondisi kabar progres progress perkembangan " +
    "kemajuan update laporan tentang mengenai soal saja yang untuk buat dari di ke pada dan atau dengan " +
    "oleh milik punya sama ada tidak ini itu sudah belum saat sekarang terakhir terbaru terkini kah nya " +
    "dong ya deh sih kok nih pak bu mas mbak bapak ibu mw"
  ).split(" "),
);

const ID_FIELDS: (keyof ProyekRow)[] = [
  "kode_ruptl", "kode_induk", "nama_proyek", "nama_ruptl", "provinsi", "sistem",
  "jenis", "pic", "divisi_grb", "prioritas", "manager", "admin",
];

export type SearchScope = "kode" | "identitas" | "seluruh kolom" | "kecocokan sebagian" | "nama persis" | "kosong";

export interface SearchResult {
  projects: Proyek[];
  scope: SearchScope;
  fuzzy: boolean;
}

/**
 * Pencarian bertingkat, port dari Tool-Project_Search_v2:
 * kode RUPTL persis → semua kata kunci di kolom identitas → di seluruh kolom → kecocokan sebagian.
 */
export function searchProjects(rows: ProyekRow[], query: string): SearchResult {
  const all = groupProjects(rows);
  const rawTokens = norm(query).split(" ").filter(Boolean);
  if (rawTokens.length === 0) return { projects: all, scope: "kosong", fuzzy: false };

  const filtered = rawTokens.filter((t) => !STOPWORDS.has(t));
  const base = filtered.length ? filtered : rawTokens;
  const keywords: string[] = [];
  for (const t of base) {
    if (t.length <= 2 && keywords.length > 0) keywords[keywords.length - 1] += " " + t;
    else keywords.push(t);
  }

  const byInduk = new Map(all.map((p) => [p.induk, p]));
  const toProjects = (matched: ProyekRow[]) =>
    [...new Set(matched.map(indukDari))].map((k) => byInduk.get(k)!).filter(Boolean);

  const qNorm = norm(query);
  const byCode = rows.find((r) => {
    const kode = norm(r.kode_ruptl);
    return kode && (qNorm === kode || ` ${qNorm} `.includes(` ${kode} `));
  });
  if (byCode) return { projects: toProjects([byCode]), scope: "kode", fuzzy: false };

  const idText = (r: ProyekRow) => norm(ID_FIELDS.map((f) => r[f] ?? "").join(" "));
  const allText = (r: ProyekRow) => norm(Object.values(r).join(" "));
  const hitAll = (text: string) => keywords.every((kw) => text.includes(kw));

  let cocok = rows.filter((r) => hitAll(idText(r)));
  let scope: SearchScope = "identitas";
  let fuzzy = false;

  if (cocok.length === 0) {
    cocok = rows.filter((r) => hitAll(allText(r)));
    scope = "seluruh kolom";
  }
  if (cocok.length === 0) {
    const whole = (text: string, kw: string) => ` ${text} `.includes(` ${kw} `);
    const scored = rows
      .map((r) => ({ r, s: keywords.filter((kw) => whole(idText(r), kw)).length }))
      .filter((x) => x.s > 0 && x.s / keywords.length >= 0.5);
    if (scored.length) {
      const top = Math.max(...scored.map((x) => x.s));
      cocok = scored.filter((x) => x.s === top).map((x) => x.r);
      scope = "kecocokan sebagian";
      fuzzy = true;
    }
  }

  const q = keywords.join(" ");
  const exact = cocok.filter((r) => norm(r.nama_proyek) === q);
  if (exact.length > 0 && exact.length < cocok.length) {
    cocok = exact;
    scope = "nama persis";
  }

  return { projects: toProjects(cocok), scope, fuzzy };
}

export interface ProjectFilters {
  jenis?: string;
  divisi?: string;
  sistem?: string;
  prioritas?: string;
  cod?: string;
  milikSaya?: boolean;
}

export function applyFilters(projects: Proyek[], f: ProjectFilters, user?: SessionUser): Proyek[] {
  return projects.filter((p) => {
    if (f.jenis && !p.jenis.includes(f.jenis)) return false;
    if (f.divisi && !p.rows.some((r) => r.divisi_grb === f.divisi)) return false;
    if (f.sistem && !p.rows.some((r) => r.sistem === f.sistem)) return false;
    if (f.prioritas && !p.rows.some((r) => r.prioritas === f.prioritas)) return false;
    if (f.cod && !p.rows.some((r) => String(r.cod_ruptl) === f.cod)) return false;
    if (f.milikSaya && user && !isResponsible(p, user)) return false;
    return true;
  });
}

/** Nilai unik sebuah kolom untuk opsi filter, terurut. */
export function distinctValues(rows: ProyekRow[], field: keyof ProyekRow): string[] {
  return uniq(rows, field).sort((a, b) => a.localeCompare(b, "id", { numeric: true }));
}

// ---------- Progress terstruktur ----------

export interface ProgressParts {
  update: string;
  inprogress: string;
  selesai: string;
  /** False jika teks progress tidak memakai format [Update]/[Inprogress]/[Selesai]. */
  structured: boolean;
}

const TAGS = { update: "Update", inprogress: "Inprogress", selesai: "Selesai" } as const;

export function parseProgress(text: string): ProgressParts {
  const src = String(text ?? "").replace(/\r\n/g, "\n");
  const re = /\[(update|inprogress|in progress|selesai)\]/gi;
  const marks = [...src.matchAll(re)];
  if (marks.length === 0) return { update: src.trim(), inprogress: "", selesai: "", structured: false };
  const out: ProgressParts = { update: "", inprogress: "", selesai: "", structured: true };
  marks.forEach((m, i) => {
    const start = m.index! + m[0].length;
    const end = i + 1 < marks.length ? marks[i + 1].index! : src.length;
    const tag = m[1].toLowerCase().replace(" ", "") as keyof typeof TAGS;
    const value = src.slice(start, end).trim();
    out[tag] = value === "-" ? "" : value;
  });
  return out;
}

export function composeProgress(parts: Omit<ProgressParts, "structured">): string {
  const v = (s: string) => s.trim().replace(/\r\n/g, "\n") || "-";
  return `[${TAGS.update}] ${v(parts.update)}\n[${TAGS.inprogress}] ${v(parts.inprogress)}\n[${TAGS.selesai}] ${v(parts.selesai)}`;
}

// ---------- Hak akses ----------

const nameMatch = (cell: string, nama: string) => {
  const n = nama.trim().toLowerCase();
  return n.length >= 3 && cell.toLowerCase().includes(n);
};

/** User tercatat sebagai PIC, admin proyek, atau manager di salah satu baris RUPTL proyek ini. */
export function isResponsible(p: Proyek, user: SessionUser): boolean {
  return p.rows.some(
    (r) => nameMatch(r.pic ?? "", user.nama) || nameMatch(r.admin ?? "", user.nama) || nameMatch(r.manager ?? "", user.nama),
  );
}

/** Admin boleh mengubah semua proyek; selain itu hanya proyek yang menjadi tanggung jawabnya. */
export function canEditProject(p: Proyek, user: SessionUser): boolean {
  return user.role === "admin" || isResponsible(p, user);
}

// ---------- Belum lapor minggu ini ----------

export interface PicStatus {
  pic: string;
  admin: string;
  sudahLapor: boolean;
  projects: Proyek[];
}

/**
 * Status lapor per PIC minggu berjalan (mulai Senin WIB), logika sama dengan
 * Reminder-CekBelumLapor: PIC dianggap sudah lapor jika salah satu proyeknya
 * diperbarui minggu ini.
 */
export function picReportStatus(projects: Proyek[], now: Date = new Date()): PicStatus[] {
  const monday = startOfWeekSerialWIB(now);
  const map = new Map<string, PicStatus>();
  for (const p of projects) {
    if (!p.pic || p.pic === "Selesai di GRB") continue;
    const s = map.get(p.pic) ?? { pic: p.pic, admin: p.admin, sudahLapor: false, projects: [] };
    s.projects.push(p);
    if (p.tanggalUpdate >= monday) s.sudahLapor = true;
    if (!s.admin && p.admin) s.admin = p.admin;
    map.set(p.pic, s);
  }
  return [...map.values()].sort((a, b) => Number(a.sudahLapor) - Number(b.sudahLapor) || a.pic.localeCompare(b.pic));
}

export function isUpdatedThisWeek(p: Proyek, now: Date = new Date()): boolean {
  return p.tanggalUpdate >= startOfWeekSerialWIB(now);
}

export function formatNumber(n: number, digits = 2): string {
  return (Math.round(n * 10 ** digits) / 10 ** digits).toLocaleString("id-ID", { maximumFractionDigits: digits });
}
