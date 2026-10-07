import Link from "next/link";
import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getStore } from "@/lib/data";
import { formatSerial } from "@/lib/dates";
import { applyFilters, distinctValues, formatNumber, isUpdatedThisWeek, searchProjects, type ProjectFilters } from "@/lib/proyek";

export const metadata = { title: "Proyek" };

function Select({ name, label, values, value }: { name: string; label: string; values: string[]; value: string }) {
  return (
    <label className="text-sm">
      <span className="sr-only">{label}</span>
      <select name={name} defaultValue={value} className="input py-1.5">
        <option value="">{label}: semua</option>
        {values.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
    </label>
  );
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function ProyekPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const q = one(sp.q).trim();
  const filters: ProjectFilters = {
    jenis: one(sp.jenis),
    divisi: one(sp.divisi),
    sistem: one(sp.sistem),
    prioritas: one(sp.prioritas),
    cod: one(sp.cod),
    milikSaya: one(sp.saya) === "1",
  };

  const rows = await getStore().listProyekRows();
  const result = searchProjects(rows, q);
  const projects = applyFilters(result.projects, filters, user).sort((a, b) => a.nama.localeCompare(b.nama, "id"));
  const opsi = {
    jenis: distinctValues(rows, "jenis"),
    divisi: distinctValues(rows, "divisi_grb"),
    sistem: distinctValues(rows, "sistem"),
    prioritas: distinctValues(rows, "prioritas"),
    cod: distinctValues(rows, "cod_ruptl"),
  };
  const aktif = q || Object.values(filters).some(Boolean);

  return (
    <>
      <PageHeader title="Proyek" subtitle="Cari dengan nama proyek, kode RUPTL, lokasi, atau nama PIC — sama seperti bertanya ke IVANA." />

      <form className="card mb-6 space-y-3 p-4" role="search">
        <div className="flex gap-2">
          <input name="q" defaultValue={q} placeholder="mis. PLTS Saguling, R-18-K-114-SA, Hululais" className="input" aria-label="Kata kunci" />
          <button className="btn btn-primary shrink-0">Cari</button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <Select name="jenis" value={filters.jenis ?? ""} label="Jenis" values={opsi.jenis} />
          <Select name="divisi" value={filters.divisi ?? ""} label="Divisi" values={opsi.divisi} />
          <Select name="sistem" value={filters.sistem ?? ""} label="Sistem" values={opsi.sistem} />
          <Select name="prioritas" value={filters.prioritas ?? ""} label="Prioritas" values={opsi.prioritas} />
          <Select name="cod" value={filters.cod ?? ""} label="COD RUPTL" values={opsi.cod} />
          <label className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm">
            <input type="checkbox" name="saya" value="1" defaultChecked={filters.milikSaya} className="accent-brand-700" />
            Proyek saya
          </label>
        </div>
        {aktif && (
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>
              {projects.length} proyek ditemukan
              {q && result.fuzzy && " — tidak ada yang persis cocok, ini kandidat termirip"}
            </span>
            <Link href="/dashboard/proyek" className="font-medium text-brand-700 hover:text-brand-800">
              Reset
            </Link>
          </div>
        )}
      </form>

      {projects.length === 0 ? (
        <EmptyState>Tidak ada proyek yang cocok dengan pencarian atau filter.</EmptyState>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Proyek</th>
                <th className="px-4 py-3 font-semibold">Jenis</th>
                <th className="px-4 py-3 font-semibold">Provinsi</th>
                <th className="px-4 py-3 text-right font-semibold">MW</th>
                <th className="px-4 py-3 font-semibold">COD</th>
                <th className="px-4 py-3 font-semibold">PIC</th>
                <th className="px-4 py-3 font-semibold">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.map((p) => (
                <tr key={p.induk} className="align-top hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/proyek/${encodeURIComponent(p.induk)}`} className="font-medium text-slate-900 hover:text-brand-700">
                      {p.nama}
                    </Link>
                    <div className="mt-0.5 font-mono text-xs text-slate-500">
                      {p.kodeRuptl.join(", ")}
                      {p.rows.length > 1 && <> · {p.rows.length} baris RUPTL</>}
                    </div>
                  </td>
                  <td className="px-4 py-3">{p.jenis.join(" + ")}</td>
                  <td className="px-4 py-3">{p.provinsi}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatNumber(p.totalMw)}</td>
                  <td className="px-4 py-3">{p.codRuptl}</td>
                  <td className="px-4 py-3">{p.pic || <span className="text-slate-400">-</span>}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {p.tanggalUpdate ? (
                      <Badge tone={isUpdatedThisWeek(p) ? "good" : "neutral"}>{formatSerial(p.tanggalUpdate)}</Badge>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
