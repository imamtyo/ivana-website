"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { Alert } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import type { Knowledge } from "@/lib/types";
import { saveKnowledgeAction, type KnowledgeState } from "./actions";

export function KnowledgeForm({ item }: { item?: Knowledge }) {
  const ref = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [state, action] = useActionState<KnowledgeState, FormData>(saveKnowledgeAction, {});

  useEffect(() => {
    if (!state.ok) return;
    if (item) router.replace("/dashboard/knowledge");
    else ref.current?.reset();
  }, [state, item, router]);

  return (
    <form ref={ref} action={action} className="space-y-3">
      {item && <input type="hidden" name="id" value={item.id} />}
      {state.message && <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>}
      <div>
        <label htmlFor="key" className="label">
          Topik
        </label>
        <input id="key" name="key" required maxLength={200} defaultValue={item?.key} className="input" placeholder="mis. Stage PMO" />
      </div>
      <div>
        <label htmlFor="content" className="label">
          Isi
        </label>
        <textarea id="content" name="content" required rows={6} maxLength={8000} defaultValue={item?.content} className="input" />
      </div>
      <div>
        <label htmlFor="aliases" className="label">
          Kata kunci lain <span className="font-normal text-slate-500">(pisahkan dengan koma)</span>
        </label>
        <input id="aliases" name="aliases" maxLength={500} defaultValue={item?.aliases} className="input" />
      </div>
      <div>
        <label htmlFor="category" className="label">
          Kategori
        </label>
        <input id="category" name="category" maxLength={100} defaultValue={item?.category ?? "umum"} className="input" />
      </div>
      <div className="flex items-center gap-3">
        <SubmitButton pendingText="Menyimpan…">{item ? "Simpan perubahan" : "Tambah topik"}</SubmitButton>
        {item && (
          <Link href="/dashboard/knowledge" className="btn btn-secondary">
            Batal
          </Link>
        )}
      </div>
    </form>
  );
}
