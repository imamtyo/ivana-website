import { afterEach, describe, expect, it, vi } from "vitest";
import { N8nStore } from "./n8n";

const cfg = {
  baseUrl: "https://n8n.test",
  apiKey: "key",
  tables: { proyek: "TP", kontak: "TK", agenda: "TA", knowledge: "TKB" },
};

function mockFetch(handler: (url: string, init: RequestInit) => unknown) {
  const calls: { url: string; init: RequestInit }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(JSON.stringify(handler(url, init)), { status: 200 });
    }),
  );
  return calls;
}

afterEach(() => vi.unstubAllGlobals());

describe("N8nStore", () => {
  it("membaca semua halaman rows dengan cursor dan API key", async () => {
    const calls = mockFetch((url) =>
      url.includes("cursor=c1")
        ? { data: [{ id: 2, kode_ruptl: "B", nama_proyek: "Dua", kapasitas_mw: "10" }], nextCursor: null }
        : { data: [{ id: 1, kode_ruptl: "A", nama_proyek: "Satu", kapasitas_mw: 5, pic: null }], nextCursor: "c1" },
    );
    const rows = await new N8nStore(cfg).listProyekRows();
    expect(rows.map((r) => [r.kode_ruptl, r.kapasitas_mw, r.pic])).toEqual([["A", 5, ""], ["B", 10, ""]]);
    expect(calls[0].url).toBe("https://n8n.test/api/v1/data-tables/TP/rows?limit=250");
    expect((calls[0].init.headers as Record<string, string>)["X-N8N-API-KEY"]).toBe("key");
  });

  it("update progress memakai filter kode_induk dan menandai dirty", async () => {
    const calls = mockFetch(() => [{ id: 1 }, { id: 2 }]);
    const n = await new N8nStore(cfg).updateProgress({ column: "kode_induk", value: "A-1" }, { progress: "p", tanggal_update: 46300 });
    expect(n).toBe(2);
    expect(calls[0].url).toBe("https://n8n.test/api/v1/data-tables/TP/rows/update");
    expect(calls[0].init.method).toBe("PATCH");
    expect(JSON.parse(String(calls[0].init.body))).toEqual({
      filter: { type: "and", filters: [{ columnName: "kode_induk", condition: "eq", value: "A-1" }] },
      data: { progress: "p", tanggal_update: 46300, dirty: 1 },
      returnData: true,
    });
  });

  it("cache dibuang setelah menulis", async () => {
    let version = 1;
    mockFetch((url, init) => (init.method === "POST" ? { count: 1 } : { data: [{ id: version++, judul: "x", waktu: "2026-10-07T01:00:00Z" }] }));
    const store = new N8nStore(cfg);
    expect((await store.listAgenda())[0].id).toBe(1);
    expect((await store.listAgenda())[0].id).toBe(1); // dari cache
    await store.addAgenda({ waktu: "2026-10-08T03:00:00.000Z", judul: "j", deskripsi: "-", pencatat: "p", chat_id: "c", status_reminded: false });
    expect((await store.listAgenda())[0].id).toBe(2);
  });

  it("hapus memakai filter id di query string", async () => {
    const calls = mockFetch(() => true);
    await new N8nStore(cfg).deleteAgenda(7);
    const u = new URL(calls[0].url);
    expect(u.pathname).toBe("/api/v1/data-tables/TA/rows/delete");
    expect(JSON.parse(u.searchParams.get("filter")!)).toEqual({ type: "and", filters: [{ columnName: "id", condition: "eq", value: 7 }] });
  });
});
