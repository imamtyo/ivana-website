"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { updateProgressAction, type ProgressState } from "../actions";

export function ProgressForm({ kode, initial }: { kode: string; initial: { update: string; inprogress: string; selesai: string } }) {
  const [state, action] = useActionState<ProgressState, FormData>(updateProgressAction, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="kode" value={kode} />
      {state.message && <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>}
      <div>
        <label htmlFor="update" className="label">
          Update <span className="font-normal text-slate-500">— perkembangan terbaru (wajib)</span>
        </label>
        <textarea id="update" name="update" required rows={3} defaultValue={initial.update} className="input" />
      </div>
      <div>
        <label htmlFor="inprogress" className="label">
          Inprogress <span className="font-normal text-slate-500">— yang sedang dikerjakan</span>
        </label>
        <textarea id="inprogress" name="inprogress" rows={2} defaultValue={initial.inprogress} className="input" />
      </div>
      <div>
        <label htmlFor="selesai" className="label">
          Selesai <span className="font-normal text-slate-500">— tahapan yang sudah selesai</span>
        </label>
        <textarea id="selesai" name="selesai" rows={2} defaultValue={initial.selesai} className="input" />
      </div>
      <SubmitButton pendingText="Menyimpan…">Simpan progress</SubmitButton>
    </form>
  );
}
