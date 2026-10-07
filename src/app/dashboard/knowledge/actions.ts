"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { getStore } from "@/lib/data";

export type KnowledgeState = { ok?: boolean; message?: string };

export async function saveKnowledgeAction(_prev: KnowledgeState, form: FormData): Promise<KnowledgeState> {
  const user = await requireUser();
  const id = Number(form.get("id") || 0);
  const key = String(form.get("key") ?? "").trim();
  const content = String(form.get("content") ?? "").trim();
  const aliases = String(form.get("aliases") ?? "").trim();
  const category = String(form.get("category") ?? "").trim() || "umum";
  if (!key || !content) return { ok: false, message: "Topik dan isi wajib diisi." };
  if (key.length > 200 || content.length > 8000 || aliases.length > 500) return { ok: false, message: "Isian terlalu panjang." };

  const store = getStore();
  const existing = await store.listKnowledge();
  const dup = existing.find((k) => k.key.trim().toLowerCase() === key.toLowerCase() && k.id !== id);
  if (dup) return { ok: false, message: `Topik "${dup.key}" sudah ada. Edit topik tersebut, jangan membuat duplikat.` };

  const data = { key, content, aliases, category, pencatat: user.panggilan, tanggal: new Date().toISOString() };
  if (id) {
    if (!existing.some((k) => k.id === id)) return { ok: false, message: "Topik tidak ditemukan." };
    await store.updateKnowledge(id, data);
  } else {
    await store.addKnowledge(data);
  }
  revalidatePath("/dashboard/knowledge");
  return { ok: true, message: `Topik "${key}" tersimpan dan langsung bisa dijawab IVANA.` };
}

export async function deleteKnowledgeAction(form: FormData) {
  const user = await requireUser();
  if (user.role !== "admin") return;
  await getStore().deleteKnowledge(Number(form.get("id")));
  revalidatePath("/dashboard/knowledge");
}
