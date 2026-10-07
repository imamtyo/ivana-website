import "server-only";
import { env } from "../env";
import { MockStore } from "./mock";
import { N8nStore } from "./n8n";
import type { DataStore } from "./store";

const g = globalThis as unknown as { __ivanaStore?: DataStore };

export function getStore(): DataStore {
  if (g.__ivanaStore) return g.__ivanaStore;
  if (env.dataSource === "n8n") {
    const { baseUrl, apiKey, tables } = env.n8n;
    const missing = Object.entries({
      N8N_BASE_URL: baseUrl,
      N8N_API_KEY: apiKey,
      N8N_TABLE_PROYEK: tables.proyek,
      N8N_TABLE_KONTAK: tables.kontak,
      N8N_TABLE_AGENDA: tables.agenda,
      N8N_TABLE_KNOWLEDGE: tables.knowledge,
    })
      .filter(([, v]) => !v)
      .map(([k]) => k);
    if (missing.length) throw new Error(`Konfigurasi n8n belum lengkap: ${missing.join(", ")}`);
    g.__ivanaStore = new N8nStore({
      baseUrl: baseUrl!,
      apiKey: apiKey!,
      tables: {
        proyek: tables.proyek!,
        kontak: tables.kontak!,
        agenda: tables.agenda!,
        knowledge: tables.knowledge!,
        progressLog: tables.progressLog,
      },
    });
  } else {
    g.__ivanaStore = new MockStore();
  }
  return g.__ivanaStore;
}

export type { DataStore } from "./store";
