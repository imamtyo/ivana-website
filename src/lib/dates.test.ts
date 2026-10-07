import { describe, expect, it } from "vitest";
import { formatSerial, startOfWeekSerialWIB, todaySerialWIB, wibLocalToIso } from "./dates";
import { normalizePhone } from "./phone";

describe("tanggal WIB", () => {
  it("serial Excel mengikuti tanggal WIB, bukan UTC", () => {
    // 2026-10-06 18:00 UTC = 2026-10-07 01:00 WIB
    expect(todaySerialWIB(new Date("2026-10-06T18:00:00Z"))).toBe(46302);
    expect(todaySerialWIB(new Date("2026-10-06T16:00:00Z"))).toBe(46301);
    expect(formatSerial(46302)).toBe("7 Oktober 2026");
    expect(formatSerial(0)).toBe("-");
  });

  it("awal minggu = Senin WIB", () => {
    expect(startOfWeekSerialWIB(new Date("2026-10-07T03:00:00Z"))).toBe(46300); // Rabu → Senin 5 Okt
    expect(startOfWeekSerialWIB(new Date("2026-10-04T17:30:00Z"))).toBe(46300); // Senin 00:30 WIB
    expect(startOfWeekSerialWIB(new Date("2026-10-04T16:00:00Z"))).toBe(46293); // Minggu 23:00 WIB
  });

  it("datetime-local WIB ke ISO UTC", () => {
    expect(wibLocalToIso("2026-10-08T10:00")).toBe("2026-10-08T03:00:00.000Z");
    expect(wibLocalToIso("besok")).toBeNull();
  });
});

describe("normalizePhone", () => {
  it.each([
    ["0812-3456-789", "628123456789"],
    ["+62 812 3456 789", "628123456789"],
    ["8123456789", "628123456789"],
    [628123456789, "628123456789"],
    ["12345", null],
  ])("%s → %s", (input, out) => {
    expect(normalizePhone(input)).toBe(out);
  });
});
