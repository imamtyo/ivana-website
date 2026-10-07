"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { maskPhone } from "@/lib/phone";
import { loginAction, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action] = useActionState<LoginState, FormData>(loginAction, { step: "nomor" });

  if (state.step === "nomor") {
    return (
      <form action={action} className="space-y-4">
        <input type="hidden" name="intent" value="request" />
        {state.error && <Alert tone="error">{state.error}</Alert>}
        <div>
          <label htmlFor="nomor" className="label">
            Nomor WhatsApp
          </label>
          <input
            id="nomor"
            name="nomor"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            placeholder="0812xxxxxxxx"
            defaultValue={state.nomor ?? ""}
            className="input"
          />
          <p className="mt-1.5 text-xs text-slate-500">Gunakan nomor yang terdaftar di kontak IVANA.</p>
        </div>
        <SubmitButton className="btn btn-primary w-full" pendingText="Mengirim kode…">
          Kirim kode via WhatsApp
        </SubmitButton>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      {state.error ? <Alert tone="error">{state.error}</Alert> : state.info && <Alert tone="info">{state.info}</Alert>}
      {state.devCode && (
        <Alert tone="success">
          Mode pengembangan — kode: <strong className="font-mono">{state.devCode}</strong>
        </Alert>
      )}
      <form action={action} className="space-y-4">
        <input type="hidden" name="intent" value="verify" />
        <input type="hidden" name="nomor" value={state.nomor} />
        <div>
          <label htmlFor="kode" className="label">
            Kode 6 digit untuk {maskPhone(state.nomor)}
          </label>
          <input
            id="kode"
            name="kode"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            required
            autoFocus
            className="input text-center font-mono text-lg tracking-[0.5em]"
          />
        </div>
        <SubmitButton className="btn btn-primary w-full" pendingText="Memeriksa…">
          Masuk
        </SubmitButton>
      </form>
      <form action={action} className="flex items-center justify-between text-sm">
        <input type="hidden" name="intent" value="request" />
        <input type="hidden" name="nomor" value={state.nomor} />
        <a href="/login" className="text-slate-500 hover:text-slate-800">
          ← Ganti nomor
        </a>
        <SubmitButton className="font-medium text-brand-700 hover:text-brand-800 disabled:opacity-60" pendingText="Mengirim…">
          Kirim ulang kode
        </SubmitButton>
      </form>
    </div>
  );
}
