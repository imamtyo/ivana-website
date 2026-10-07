"use client";

import { useActionState, useEffect, useRef } from "react";
import { Alert } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { addAgendaAction, type AgendaState } from "./actions";

export function AgendaForm() {
  const ref = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState<AgendaState, FormData>(addAgendaAction, {});
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="space-y-3">
      {state.message && <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>}
      <div>
        <label htmlFor="judul" className="label">
          Judul
        </label>
        <input id="judul" name="judul" required maxLength={200} className="input" placeholder="Rapat koordinasi…" />
      </div>
      <div>
        <label htmlFor="waktu" className="label">
          Waktu (WIB)
        </label>
        <input id="waktu" name="waktu" type="datetime-local" required className="input" />
      </div>
      <div>
        <label htmlFor="deskripsi" className="label">
          Deskripsi
        </label>
        <textarea id="deskripsi" name="deskripsi" rows={3} maxLength={2000} className="input" placeholder="Tempat, link meeting, catatan…" />
      </div>
      <SubmitButton pendingText="Menyimpan…">Catat agenda</SubmitButton>
      <p className="text-xs text-slate-500">Agenda hari ini akan ikut dikirim IVANA ke grup WA setiap pukul 07.30.</p>
    </form>
  );
}
