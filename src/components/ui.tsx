import Link from "next/link";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function StatTile({ label, value, hint, href }: { label: string; value: React.ReactNode; hint?: React.ReactNode; href?: string }) {
  const body = (
    <>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="card block p-5 transition hover:border-brand-500 hover:shadow">
      {body}
    </Link>
  ) : (
    <div className="card p-5">{body}</div>
  );
}

const BADGE = {
  neutral: "bg-slate-100 text-slate-700",
  brand: "bg-brand-50 text-brand-800 ring-1 ring-brand-100",
  good: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200",
  warn: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
  bad: "bg-red-50 text-red-800 ring-1 ring-red-200",
};

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: keyof typeof BADGE }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${BADGE[tone]}`}>{children}</span>;
}

export function Alert({ tone, children }: { tone: "error" | "success" | "info"; children: React.ReactNode }) {
  const cls = {
    error: "border-red-200 bg-red-50 text-red-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    info: "border-sky-200 bg-sky-50 text-sky-800",
  }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-lg border px-3 py-2 text-sm ${cls}`}>
      {children}
    </div>
  );
}

/**
 * Bar list horizontal satu seri (tanpa legend; judul kartu sudah menyebut isinya).
 * Batang ≤ 20px, ujung data membulat 4px, label nilai di luar ujung batang.
 */
export function BarList({ items, unit = "" }: { items: { label: string; value: number; href?: string }[]; unit?: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-2.5">
      {items.map((i) => {
        const pct = (i.value / max) * 100;
        const row = (
          <div className="grid grid-cols-[minmax(0,9rem)_1fr] items-center gap-3 text-sm" title={`${i.label}: ${i.value.toLocaleString("id-ID")}${unit}`}>
            <span className="truncate text-slate-600">{i.label}</span>
            <span className="flex items-center gap-2">
              <span className="h-4 rounded-r bg-brand-600 transition-[width]" style={{ width: `max(calc((100% - 4rem) * ${pct / 100}), 2px)` }} />
              <span className="shrink-0 font-medium tabular-nums text-slate-900">
                {i.value.toLocaleString("id-ID")}
                {unit}
              </span>
            </span>
          </div>
        );
        return (
          <li key={i.label}>
            {i.href ? (
              <Link href={i.href} className="block rounded-md hover:bg-slate-50">
                {row}
              </Link>
            ) : (
              row
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">{children}</div>;
}
