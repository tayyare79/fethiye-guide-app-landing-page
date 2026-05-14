import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { parseOzerOlgunEvents } from "../src/events/sources/ozerOlgun";

describe("Ozer Olgun parser", () => {
  it("returns an empty list when the public calendar has no events", () => {
    const events = parseOzerOlgunEvents("<h2>Yaklaşan Etkinlikler</h2>No events Found.");
    expect(events).toEqual([]);
  });

  it("extracts a basic dated event from the upcoming events section", async () => {
    const html = await readFile("tests/fixtures/ozer-olgun-event.html", "utf8");
    const events = parseOzerOlgunEvents(html);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      title: "Fethiye Caz Konseri",
      startDate: "2026-05-19",
      timeText: "20:30",
      category: "culture",
      language: "tr",
    });
  });
});
