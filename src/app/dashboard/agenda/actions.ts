"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { getStore } from "@/lib/data";
import { wibLocalToIso } from "@/lib/dates";
import { env } from "@/lib/env";

export type AgendaState = { ok?: boolean; message?: string };

export async function addAgendaAction(_prev: AgendaState, form: FormData): Promise<AgendaState> {
  const user = await requireUser();
  const judul = String(form.get("judul") ?? "").trim();
  const deskripsi = String(form.get("deskripsi") ?? "").trim();
  const waktu = wibLocalToIso(String(form.get("waktu") ?? ""));
  if (!judul) return { ok: false, message: "Judul agenda wajib diisi." };
  if (judul.length > 200 || deskripsi.length > 2000) return { ok: false, message: "Judul atau deskripsi terlalu panjang." };
  if (!waktu) return { ok: false, message: "Waktu pelaksanaan tidak valid." };

  await getStore().addAgenda({
    waktu,
    judul,
    deskripsi: deskripsi || "-",
    pencatat: user.panggilan,
    chat_id: env.agendaChatId,
    status_reminded: false,
  });
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: `Agenda "${judul}" tercatat.` };
}

export async function deleteAgendaAction(form: FormData) {
  const user = await requireUser();
  const id = Number(form.get("id"));
  const store = getStore();
  const item = (await store.listAgenda()).find((a) => a.id === id);
  if (!item) return;
  if (user.role !== "admin" && item.pencatat !== user.panggilan) return;
  await store.deleteAgenda(id);
  revalidatePath("/dashboard", "layout");
}
