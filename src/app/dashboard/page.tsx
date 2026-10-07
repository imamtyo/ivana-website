import Link from "next/link";
import { BarList, PageHeader, StatTile } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getStore } from "@/lib/data";
import { formatDateTimeWIB, formatSerial, wibDateKey } from "@/lib/dates";
import { formatNumber, groupProjects, isResponsible, isUpdatedThisWeek, picReportStatus } from "@/lib/proyek";

export const metadata = { title: "Ringkasan" };

function countBy<T>(items: T[], key: (t: T) => string[]): { label: string; value: number }[] {
  const m = new Map<string, number>();
  for (const it of items) for (const k of key(it)) m.set(k || "-", (m.get(k || "-") ?? 0) + 1);
  return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

export default async function OverviewPage() {
  const user = await requireUser();
  const store = getStore();
  const [rows, agenda] = await Promise.all([store.listProyekRows(), store.listAgenda()]);
  const projects = groupProjects(rows);

  const totalMw = projects.reduce((a, p) => a + p.totalMw, 0);
  const status = picReportStatus(projects);
  const belum = status.filter((s) => !s.sudahLapor);
  const today = wibDateKey(new Date());
  const agendaHariIni = agenda
    .filter((a) => a.waktu && wibDateKey(new Date(a.waktu)) === today)
    .sort((a, b) => a.waktu.localeCompare(b.waktu));
  const milikSaya = projects.filter((p) => isResponsible(p, user));
  const terbaru = [...projects].filter((p) => p.tanggalUpdate).sort((a, b) => b.tanggalUpdate - a.tanggalUpdate).slice(0, 6);
  const perJenis = countBy(projects, (p) => p.jenis).slice(0, 10);
  const perDivisi = countBy(projects, (p) => [p.divisi]);

  return (
    <>
      <PageHeader title={`Halo, ${user.panggilan}`} subtitle="Ringkasan portofolio proyek GRB dari database IVANA." />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Angka utama">
        <StatTile label="Proyek" value={projects.length} hint={`${rows.length} baris RUPTL`} href="/dashboard/proyek" />
        <StatTile label="Total kapasitas" value={`${formatNumber(totalMw, 0)} MW`} />
        <StatTile
          label="PIC belum lapor minggu ini"
          value={belum.length}
          hint={`dari ${status.length} PIC`}
          href="/dashboard/belum-lapor"
        />
        <StatTile label="Agenda hari ini" value={agendaHariIni.length} href="/dashboard/agenda" />
      </section>

      {milikSaya.length > 0 && (
        <section className="card mt-6 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Proyek saya</h2>
            <Link href="/dashboard/proyek?saya=1" className="text-sm font-medium text-brand-700 hover:text-brand-800">
              Lihat semua →
            </Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {milikSaya.slice(0, 5).map((p) => (
              <li key={p.induk} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <Link href={`/dashboard/proyek/${encodeURIComponent(p.induk)}`} className="font-medium text-slate-900 hover:text-brand-700">
                  {p.nama}
                </Link>
                <span className={isUpdatedThisWeek(p) ? "text-emerald-700" : "text-amber-700"}>
                  {isUpdatedThisWeek(p) ? "✓ Sudah update minggu ini" : `! Update terakhir ${formatSerial(p.tanggalUpdate)}`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-semibold text-slate-900">Jumlah proyek per jenis pembangkit</h2>
          <p className="mb-4 text-xs text-slate-500">Proyek gabungan dihitung pada setiap jenisnya.</p>
          <BarList items={perJenis.map((i) => ({ ...i, href: `/dashboard/proyek?jenis=${encodeURIComponent(i.label)}` }))} />
        </section>

        <section className="card p-5">
          <h2 className="font-semibold text-slate-900">Jumlah proyek per divisi</h2>
          <p className="mb-4 text-xs text-slate-500">Berdasarkan kolom divisi GRB.</p>
          <BarList items={perDivisi} />
          <h3 className="mb-3 mt-6 font-semibold text-slate-900">Agenda hari ini</h3>
          {agendaHariIni.length === 0 ? (
            <p className="text-sm text-slate-500">Tidak ada agenda.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {agendaHariIni.map((a) => (
                <li key={a.id} className="flex gap-3">
                  <span className="shrink-0 font-mono text-slate-500">
                    {new Date(a.waktu).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })}
                  </span>
                  <span className="text-slate-900">{a.judul}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card mt-6 p-5">
        <h2 className="mb-3 font-semibold text-slate-900">Update progress terbaru</h2>
        <ul className="divide-y divide-slate-100">
          {terbaru.map((p) => (
            <li key={p.induk} className="py-3 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Link href={`/dashboard/proyek/${encodeURIComponent(p.induk)}`} className="font-medium text-slate-900 hover:text-brand-700">
                  {p.nama}
                </Link>
                <span className="text-xs text-slate-500">
                  {formatSerial(p.tanggalUpdate)} · {p.pic || "Tanpa PIC"}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 whitespace-pre-line text-slate-600">{p.progress || "-"}</p>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-6 text-xs text-slate-400">Data diperbarui otomatis; dimuat {formatDateTimeWIB(new Date().toISOString())} WIB.</p>
    </>
  );
}
