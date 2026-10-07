import { Badge, PageHeader } from "@/components/ui";
import { requireAdmin, roleFor } from "@/lib/auth";
import { getStore } from "@/lib/data";
import { normalizePhone } from "@/lib/phone";

export const metadata = { title: "Kontak" };

export default async function KontakPage() {
  await requireAdmin();
  const kontak = (await getStore().listKontak()).sort((a, b) => a.Kontak.localeCompare(b.Kontak, "id"));
  return (
    <>
      <PageHeader
        title="Kontak & akses"
        subtitle="Daftar kontak IVANA. Hanya nomor di daftar ini yang bisa login; peran admin ditentukan dari jabatan."
      />
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Nama</th>
              <th className="px-4 py-3 font-semibold">Panggilan</th>
              <th className="px-4 py-3 font-semibold">Jabatan</th>
              <th className="px-4 py-3 font-semibold">Nomor WA</th>
              <th className="px-4 py-3 font-semibold">Akses dashboard</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {kontak.map((k) => {
              const nomor = normalizePhone(k.Nomor);
              return (
                <tr key={k.id}>
                  <td className="px-4 py-2.5 font-medium text-slate-900">{k.Kontak || "-"}</td>
                  <td className="px-4 py-2.5">{k.Panggilan || "-"}</td>
                  <td className="px-4 py-2.5">{k.Jabatan || "-"}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{nomor ?? String(k.Nomor ?? "-")}</td>
                  <td className="px-4 py-2.5">
                    {!nomor ? (
                      <Badge tone="bad">Nomor tidak valid</Badge>
                    ) : roleFor(k, nomor) === "admin" ? (
                      <Badge tone="brand">Admin</Badge>
                    ) : (
                      <Badge>PIC</Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-500">Kontak dikelola di Data Table n8n &ldquo;Kontak&rdquo; (dipakai juga oleh bot IVANA).</p>
    </>
  );
}
