"use client";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="card mx-auto max-w-lg p-6 text-center">
      <h2 className="text-lg font-bold text-slate-900">Data belum bisa dimuat</h2>
      <p className="mt-2 text-sm text-slate-500">
        Sumber data (n8n) sedang tidak bisa dihubungi atau konfigurasinya belum lengkap. Coba lagi beberapa saat.
      </p>
      {error.digest && <p className="mt-2 font-mono text-xs text-slate-400">Kode: {error.digest}</p>}
      <button onClick={reset} className="btn btn-primary mt-5">
        Coba lagi
      </button>
    </div>
  );
}
