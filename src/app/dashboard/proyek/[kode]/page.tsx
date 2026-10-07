import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getStore } from "@/lib/data";
import { formatDateTimeWIB, formatSerial } from "@/lib/dates";
import { canEditProject, findProject, formatNumber, groupProjects, isUpdatedThisWeek, parseProgress } from "@/lib/proyek";
import { ProgressForm } from "./ProgressForm";

export async function generateMetadata({ params }: { params: Promise<{ kode: string }> }) {
  return { title: decodeURIComponent((await params).kode) };
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900">{value || <span className="text-slate-400">-</span>}</dd>
    </div>
  );
}

export default async function ProyekDetailPage({ params }: { params: Promise<{ kode: string }> }) {
  const user = await requireUser();
  const kode = decodeURIComponent((await params).kode);
  const store = getStore();
  const p = findProject(groupProjects(await store.listProyekRows()), kode);
  if (!p) notFound();

  const editable = canEditProject(p, user);
  const parts = parseProgress(p.progress);
  const log = store.hasProgressLog ? await store.listProgressLog(p.induk) : [];

  return (
    <>
      <Link href="/dashboard/proyek" className="mb-3 inline-block text-sm text-slate-500 hover:text-slate-800">
        ← Semua proyek
      </Link>
      <PageHeader
        title={p.nama}
        subtitle={
          <span className="font-mono">
            {p.kodeRuptl.join(", ")}
            {p.rows.length > 1 && ` · gabungan ${p.rows.length} baris RUPTL`}
          </span>
        }
        actions={isUpdatedThisWeek(p) ? <Badge tone="good">✓ Sudah update minggu ini</Badge> : <Badge tone="warn">! Belum update minggu ini</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <section className="card p-5">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-semibold text-slate-900">Progress terakhir</h2>
              <span className="text-xs text-slate-500">{formatSerial(p.tanggalUpdate)}</span>
            </div>
            {p.progressBerbeda && (
              <p className="mb-3 text-xs text-amber-700">
                Progress antar baris RUPTL berbeda; yang ditampilkan adalah versi terbaru.
              </p>
            )}
            {parts.structured ? (
              <dl className="space-y-3 text-sm">
                {(
                  [
                    ["Update", parts.update],
                    ["Inprogress", parts.inprogress],
                    ["Selesai", parts.selesai],
                  ] as const
                ).map(([label, v]) => (
                  <div key={label}>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-brand-700">{label}</dt>
                    <dd className="mt-0.5 whitespace-pre-line text-slate-800">{v || "-"}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="whitespace-pre-line text-sm text-slate-800">{p.progress || "Belum ada laporan progress."}</p>
            )}
          </section>

          {p.highlightIssue && (
            <section className="card border-amber-200 bg-amber-50/50 p-5">
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-semibold text-amber-900">Highlight issue</h2>
                <span className="text-xs text-amber-800">{formatSerial(p.tanggalUpdateIssue)}</span>
              </div>
              <p className="whitespace-pre-line text-sm text-amber-950">{p.highlightIssue}</p>
            </section>
          )}

          <section className="card p-5">
            <h2 className="mb-4 font-semibold text-slate-900">Lapor progress</h2>
            {editable ? (
              <ProgressForm kode={p.induk} initial={parts.structured ? parts : { update: "", inprogress: "", selesai: "" }} />
            ) : (
              <p className="text-sm text-slate-500">
                Hanya PIC ({p.pic || "belum ditentukan"}), admin, atau manager proyek ini yang dapat melaporkan progress.
              </p>
            )}
          </section>

          {store.hasProgressLog && (
            <section className="card p-5">
              <h2 className="mb-3 font-semibold text-slate-900">Riwayat laporan dari dashboard</h2>
              {log.length === 0 ? (
                <p className="text-sm text-slate-500">Belum ada riwayat.</p>
              ) : (
                <ol className="space-y-4">
                  {log.map((l) => (
                    <li key={l.id} className="border-l-2 border-brand-100 pl-4 text-sm">
                      <p className="text-xs text-slate-500">
                        {formatDateTimeWIB(l.waktu)} · {l.pelapor} · {l.sumber}
                      </p>
                      <p className="mt-1 whitespace-pre-line text-slate-800">{l.progress}</p>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <section className="card p-5">
            <h2 className="mb-4 font-semibold text-slate-900">Data proyek</h2>
            <dl className="grid grid-cols-2 gap-4">
              <Field label="Jenis" value={p.jenis.join(" + ")} />
              <Field label="Kapasitas" value={`${formatNumber(p.totalMw)} MW`} />
              <Field label="Provinsi" value={p.provinsi} />
              <Field label="Sistem" value={p.sistem} />
              <Field label="COD RUPTL" value={p.codRuptl} />
              <Field label="COD realistis" value={p.codRealistis} />
              <Field label="Prioritas" value={p.prioritas} />
              <Field label="Skema" value={p.skema} />
              <Field label="Porsi" value={p.porsi} />
              <Field label="CAPEX" value={p.totalCapex ? `${formatNumber(p.totalCapex)} MUSD` : ""} />
              <Field label="Divisi" value={p.divisi} />
              <Field label="PIC" value={p.pic} />
              <Field label="Admin" value={p.admin} />
              <Field label="Manager" value={p.manager} />
            </dl>
            <dl className="mt-4 space-y-3 border-t border-slate-100 pt-4">
              <Field label="Stage PMO" value={p.stagePmo} />
              <Field label="Stage Dirrenbang" value={p.stageDirrenbang} />
            </dl>
          </section>

          {p.rows.length > 1 && (
            <section className="card p-5">
              <h2 className="mb-3 font-semibold text-slate-900">Baris RUPTL</h2>
              <ul className="space-y-2 text-sm">
                {p.rows.map((r) => (
                  <li key={r.kode_ruptl} className="flex justify-between gap-3">
                    <span className="font-mono text-xs text-slate-600">{r.kode_ruptl}</span>
                    <span className="tabular-nums text-slate-900">
                      {r.jenis} {formatNumber(r.kapasitas_mw)} MW · COD {r.cod_ruptl || "-"}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
