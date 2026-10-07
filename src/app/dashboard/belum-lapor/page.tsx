import Link from "next/link";
import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getStore } from "@/lib/data";
import { formatSerial, serialToDate, startOfWeekSerialWIB } from "@/lib/dates";
import { groupProjects, picReportStatus } from "@/lib/proyek";

export const metadata = { title: "Status Lapor" };

export default async function BelumLaporPage() {
  await requireUser();
  const status = picReportStatus(groupProjects(await getStore().listProyekRows()));
  const belum = status.filter((s) => !s.sudahLapor);
  const sudah = status.filter((s) => s.sudahLapor);
  const senin = serialToDate(startOfWeekSerialWIB()).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

  return (
    <>
      <PageHeader
        title="Status lapor minggu ini"
        subtitle={`Dihitung sejak ${senin}. PIC dianggap sudah lapor jika salah satu proyeknya diperbarui minggu ini — sama dengan pengingat Jumat sore.`}
      />

      <section className="mb-8">
        <h2 className="mb-3 font-semibold text-slate-900">
          Belum lapor <Badge tone="warn">{belum.length} PIC</Badge>
        </h2>
        {belum.length === 0 ? (
          <EmptyState>Semua PIC sudah melaporkan progress minggu ini. 🎉</EmptyState>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {belum.map((s) => (
              <article key={s.pic} className="card p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-semibold text-slate-900">{s.pic}</h3>
                  <span className="text-xs text-slate-500">Admin: {s.admin || "-"}</span>
                </div>
                <ul className="mt-3 space-y-1.5 text-sm">
                  {s.projects.map((p) => (
                    <li key={p.induk} className="flex justify-between gap-3">
                      <Link href={`/dashboard/proyek/${encodeURIComponent(p.induk)}`} className="text-slate-700 hover:text-brand-700">
                        {p.nama}
                      </Link>
                      <span className="shrink-0 text-xs text-slate-500">{formatSerial(p.tanggalUpdate)}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-semibold text-slate-900">
          Sudah lapor <Badge tone="good">{sudah.length} PIC</Badge>
        </h2>
        <div className="card divide-y divide-slate-100">
          {sudah.map((s) => (
            <div key={s.pic} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
              <span className="font-medium text-slate-900">{s.pic}</span>
              <span className="text-slate-500">{s.projects.length} proyek</span>
            </div>
          ))}
          {sudah.length === 0 && <p className="px-4 py-3 text-sm text-slate-500">Belum ada.</p>}
        </div>
      </section>
    </>
  );
}
