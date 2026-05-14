import { describe, expect, it } from "vitest";
import { calculateConfidence, inferCategory, makeDedupeKey, normalizeEvent } from "../src/events/normalize";

describe("event normalizer", () => {
  it("deduplicates by title, date and venue", () => {
    const key = makeDedupeKey({
      title: "  Fethiye Caz Konseri ",
      startDate: "2026-05-19T20:30:00+03:00",
      venueName: "Ozer Olgun Kultur Merkezi",
      sourceUrl: "https://example.com/event",
    });

    expect(key).toBe("fethiye caz konseri|2026-05-19|ozer olgun kultur merkezi");
  });

  it("infers event categories from Turkish and English keywords", () => {
    expect(inferCategory("Fethiye Caz Konseri")).toBe("music");
    expect(inferCategory("Cocuk tiyatro oyunu")).toBe("culture");
    expect(inferCategory("Fethiye food walk")).toBe("food");
  });

  it("normalizes and auto-publishes only high-confidence events", async () => {
    const normalized = await normalizeEvent(
      {
        title: "Fethiye Caz Konseri",
        description: "Fethiye'de halka acik konser etkinligi.",
        startDate: "2026-05-19",
        venueName: "Ozer Olgun Kultur Merkezi",
        sourceName: "Ozer Olgun",
        sourceUrl: "https://gosteri.ozerolgunkulturmerkezi.com/",
        language: "tr",
        category: "music",
      },
      "2026-05-14T08:00:00.000Z",
      0.8,
    );

    expect(normalized?.status).toBe("published");
    expect(normalized?.titleLocalized.tr).toBe("Fethiye Caz Konseri");
    expect(calculateConfidence(normalized!)).toBeGreaterThanOrEqual(0.8);
  });
});
