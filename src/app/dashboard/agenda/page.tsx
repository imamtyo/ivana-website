import { Badge, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { requireUser } from "@/lib/auth";
import { getStore } from "@/lib/data";
import { formatDateTimeWIB, wibDateKey } from "@/lib/dates";
import type { Agenda, SessionUser } from "@/lib/types";
import { deleteAgendaAction } from "./actions";
import { AgendaForm } from "./AgendaForm";

export const metadata = { title: "Agenda" };

function AgendaList({ items, user, today }: { items: Agenda[]; user: SessionUser; today: string }) {
  if (items.length === 0) return <p className="px-4 py-3 text-sm text-slate-500">Tidak ada agenda.</p>;
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((a) => (
        <li key={a.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs text-slate-500">
              {formatDateTimeWIB(a.waktu)} WIB {wibDateKey(new Date(a.waktu)) === today && <Badge tone="brand">Hari ini</Badge>}
            </p>
            <p className="font-medium text-slate-900">{a.judul}</p>
            {a.deskripsi && a.deskripsi !== "-" && <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{a.deskripsi}</p>}
            <p className="mt-1 text-xs text-slate-400">Dicatat oleh {a.pencatat || "-"}</p>
          </div>
          {(user.role === "admin" || a.pencatat === user.panggilan) && (
            <form action={deleteAgendaAction}>
              <input type="hidden" name="id" value={a.id} />
              <SubmitButton className="btn btn-danger px-3 py-1 text-xs" pendingText="Menghapus…" confirm={`Hapus agenda "${a.judul}"?`}>
                Hapus
              </SubmitButton>
            </form>
          )}
        </li>
      ))}
    </ul>
  );
}

export default async function AgendaPage() {
  const user = await requireUser();
  const all = (await getStore().listAgenda()).filter((a) => a.waktu && !Number.isNaN(new Date(a.waktu).getTime()));
  const today = wibDateKey(new Date());
  const upcoming = all.filter((a) => wibDateKey(new Date(a.waktu)) >= today).sort((a, b) => a.waktu.localeCompare(b.waktu));
  const past = all
    .filter((a) => wibDateKey(new Date(a.waktu)) < today)
    .sort((a, b) => b.waktu.localeCompare(a.waktu))
    .slice(0, 20);

  return (
    <>
      <PageHeader title="Agenda tim" subtitle="Agenda yang sama dengan yang dicatat lewat IVANA di WhatsApp." />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <section className="card">
            <h2 className="border-b border-slate-100 px-4 py-3 font-semibold text-slate-900">Akan datang</h2>
            <AgendaList items={upcoming} user={user} today={today} />
          </section>
          <section className="card">
            <h2 className="border-b border-slate-100 px-4 py-3 font-semibold text-slate-900">Sudah lewat (20 terakhir)</h2>
            <AgendaList items={past} user={user} today={today} />
          </section>
        </div>
        <section className="card h-fit p-5">
          <h2 className="mb-4 font-semibold text-slate-900">Catat agenda baru</h2>
          <AgendaForm />
        </section>
      </div>
    </>
  );
}
