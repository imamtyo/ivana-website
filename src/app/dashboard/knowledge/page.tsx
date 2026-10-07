import Link from "next/link";
import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { requireUser } from "@/lib/auth";
import { getStore } from "@/lib/data";
import { formatDateTimeWIB } from "@/lib/dates";
import { norm } from "@/lib/proyek";
import { deleteKnowledgeAction } from "./actions";
import { KnowledgeForm } from "./KnowledgeForm";

export const metadata = { title: "Knowledge" };

export default async function KnowledgePage({ searchParams }: { searchParams: Promise<{ q?: string; edit?: string }> }) {
  const user = await requireUser();
  const { q = "", edit } = await searchParams;
  const all = (await getStore().listKnowledge()).sort((a, b) => a.key.localeCompare(b.key, "id"));
  const words = norm(q).split(" ").filter(Boolean);
  const items = words.length
    ? all.filter((k) => {
        const text = norm(`${k.key} ${k.aliases} ${k.content} ${k.category}`);
        return words.every((w) => text.includes(w));
      })
    : all;
  const editing = edit ? all.find((k) => k.id === Number(edit)) : undefined;

  return (
    <>
      <PageHeader title="Knowledge base GRB" subtitle="Definisi, istilah, dan prosedur yang dipakai IVANA untuk menjawab pertanyaan di WhatsApp." />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div>
          <form className="mb-4 flex gap-2" role="search">
            <input name="q" defaultValue={q} placeholder="Cari topik…" className="input" aria-label="Cari topik" />
            <button className="btn btn-secondary shrink-0">Cari</button>
          </form>
          {items.length === 0 ? (
            <EmptyState>Topik tidak ditemukan.</EmptyState>
          ) : (
            <div className="space-y-3">
              {items.map((k) => (
                <article key={k.id} className="card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h2 className="font-semibold text-slate-900">{k.key}</h2>
                    <Badge tone="brand">{k.category || "umum"}</Badge>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{k.content}</p>
                  {k.aliases && <p className="mt-2 text-xs text-slate-500">Kata kunci: {k.aliases}</p>}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                    <span>
                      {k.pencatat || "-"} · {k.tanggal ? formatDateTimeWIB(k.tanggal) : "-"}
                    </span>
                    <span className="flex items-center gap-2">
                      <Link href={`/dashboard/knowledge?edit=${k.id}`} className="btn btn-secondary px-3 py-1 text-xs">
                        Edit
                      </Link>
                      {user.role === "admin" && (
                        <form action={deleteKnowledgeAction}>
                          <input type="hidden" name="id" value={k.id} />
                          <SubmitButton className="btn btn-danger px-3 py-1 text-xs" pendingText="Menghapus…" confirm={`Hapus topik "${k.key}"?`}>
                            Hapus
                          </SubmitButton>
                        </form>
                      )}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
        <section className="card h-fit p-5 lg:sticky lg:top-6">
          <h2 className="mb-4 font-semibold text-slate-900">{editing ? `Edit: ${editing.key}` : "Tambah topik"}</h2>
          <KnowledgeForm key={editing?.id ?? "new"} item={editing} />
        </section>
      </div>
    </>
  );
}
