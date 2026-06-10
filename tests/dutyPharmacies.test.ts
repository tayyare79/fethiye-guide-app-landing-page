import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { dutyPharmacyConfigs } from "../src/pharmacies/cities";
import { dedupePharmacies, parseDutyPharmacies } from "../src/pharmacies/parser";
import { importDutyPharmacies, mergeSourcePharmacyRows } from "../src/pharmacies/importer";
import { handleRequest } from "../src/api";
import type { PublicDutyPharmacy } from "../src/pharmacies/types";

const fixtureRoot = new URL("./fixtures/pharmacies/", import.meta.url);

function readFixture(name: string): string {
  return readFileSync(new URL(name, fixtureRoot), "utf8");
}

interface SnapshotRow {
  city: string;
  fetched_at: string;
  stale: number;
  pharmacies_json: string;
  last_attempt_at: string | null;
  last_error: string | null;
  updated_at: string;
}

function createSnapshotDb(initialRows: SnapshotRow[] = []): D1Database {
  const rows = new Map(initialRows.map((row) => [row.city, { ...row }]));

  return {
    prepare(query: string) {
      return {
        bind(...args: unknown[]) {
          return {
            async first<T>() {
              const city = String(args[0]);
              return (rows.get(city) || null) as T | null;
            },
            async all<T>() {
              return { results: Array.from(rows.values()) as T[] };
            },
            async run() {
              if (query.startsWith("INSERT INTO duty_pharmacy_snapshots")) {
                const [city, fetchedAt, pharmaciesJson, lastAttemptAt, updatedAt] = args.map(String);
                rows.set(city, {
                  city,
                  fetched_at: fetchedAt,
                  stale: 0,
                  pharmacies_json: pharmaciesJson,
                  last_attempt_at: lastAttemptAt,
                  last_error: null,
                  updated_at: updatedAt,
                });
              }

              if (query.startsWith("UPDATE duty_pharmacy_snapshots")) {
                const [lastAttemptAt, lastError, updatedAt, city] = args.map(String);
                const existing = rows.get(city);
                if (existing) {
                  rows.set(city, {
                    ...existing,
                    stale: 1,
                    last_attempt_at: lastAttemptAt,
                    last_error: lastError,
                    updated_at: updatedAt,
                  });
                }
              }

              return { success: true };
            },
          };
        },
      };
    },
  } as unknown as D1Database;
}

describe("duty pharmacy parsers", () => {
  it("parses Eczaneler.gen.tr real Fethiye fixture", () => {
    const config = dutyPharmacyConfigs.fethiye;
    const source = config.sources[0];
    const pharmacies = parseDutyPharmacies(readFixture("eczaneler-fethiye.html"), config, source);

    expect(pharmacies.length).toBeGreaterThan(0);
    expect(pharmacies[0]).toMatchObject({
      sourceName: "Eczaneler.gen.tr",
      sourceURL: source.url,
    });
    expect(pharmacies[0]?.phone).toMatch(/^\+90\d+$/);
  });

  it("reads only the final duty window from multi-day Eczaneler.gen.tr HTML", () => {
    const config = dutyPharmacyConfigs.fethiye;
    const pharmacies = parseDutyPharmacies(readFixture("eczaneler-fethiye.html"), config, config.sources[0]);
    const names = pharmacies.map((pharmacy) => pharmacy.name);

    expect(pharmacies).toHaveLength(7);
    expect(names).toContain("Balcı Eczanesi");
    expect(names).toContain("Aybek Eczanesi");
    expect(names).not.toContain("Altay Eczanesi");
    expect(names).not.toContain("Likya Eczanesi");
  });

  it("parses Nobetci Eczaneleri real Fethiye fixture", () => {
    const config = dutyPharmacyConfigs.fethiye;
    const source = config.sources[1];
    const pharmacies = parseDutyPharmacies(readFixture("nobetci-fethiye.html"), config, source);

    expect(pharmacies.length).toBeGreaterThan(0);
    expect(pharmacies[0]).toMatchObject({
      sourceName: "Nöbetçi Eczaneleri",
      sourceURL: source.url,
    });
    expect(pharmacies[0]?.phone).toMatch(/^\+90\d+$/);
  });

  it("rejects Cloudflare challenge pages without garbage rows", () => {
    const config = dutyPharmacyConfigs.fethiye;
    const challenge = readFixture("cloudflare-challenge.html");

    expect(parseDutyPharmacies(challenge, config, config.sources[0])).toEqual([]);
    expect(parseDutyPharmacies(challenge, config, config.sources[1])).toEqual([]);
  });

  it("dedupes same normalized name and phone across sources", () => {
    const rows: PublicDutyPharmacy[] = [
      {
        name: "Altay Eczanesi",
        address: "A",
        phone: "+902526123105",
        area: "Fethiye",
        sourceName: "Eczaneler.gen.tr",
        sourceURL: "https://example.com/1",
      },
      {
        name: "altay eczanesi",
        address: "B",
        phone: "+902526123105",
        area: "Fethiye",
        sourceName: "Nöbetçi Eczaneleri",
        sourceURL: "https://example.com/2",
      },
    ];

    expect(dedupePharmacies(rows)).toHaveLength(1);
  });

  it("dedupes same normalized name and area with Eczaneler.gen.tr priority", () => {
    const rows: PublicDutyPharmacy[] = [
      {
        name: "Candan Eczanesi",
        address: "Fallback address",
        phone: "+902526110323",
        area: "Patlangıç",
        sourceName: "Nöbetçi Eczaneleri",
        sourceURL: "https://example.com/fallback",
      },
      {
        name: "Candan Eczanesi",
        address: "Primary address",
        phone: "+902526110111",
        area: "Patlangıç",
        sourceName: "Eczaneler.gen.tr",
        sourceURL: "https://example.com/primary",
      },
    ];

    expect(dedupePharmacies(rows)).toEqual([rows[1]]);
  });

  it("keeps fallback additions only when the primary source is sparse", () => {
    const primary = Array.from({ length: 4 }, (_, index) => ({
      name: `Primary ${index} Eczanesi`,
      address: `Primary address ${index}`,
      phone: `+9025261100${index}`,
      area: "Merkez",
      sourceName: "Eczaneler.gen.tr",
      sourceURL: "https://example.com/primary",
    }));
    const fallbackOnly = {
      name: "Fallback Eczanesi",
      address: "Fallback address",
      phone: "+902526220000",
      area: "Merkez",
      sourceName: "Nöbetçi Eczaneleri",
      sourceURL: "https://example.com/fallback",
    };

    expect(
      mergeSourcePharmacyRows([
        { source: "eczaneler-gen-tr", pharmacies: primary },
        { source: "nobetci-eczaneleri", pharmacies: [fallbackOnly] },
      ]),
    ).toHaveLength(4);
    expect(
      mergeSourcePharmacyRows([
        { source: "eczaneler-gen-tr", pharmacies: primary.slice(0, 2) },
        { source: "nobetci-eczaneleri", pharmacies: [fallbackOnly] },
      ]),
    ).toHaveLength(3);
  });
});

describe("duty pharmacy API", () => {
  it("does not merge fallback rows from a different duty window when the primary source is available", async () => {
    const db = createSnapshotDb();
    const env = { EVENTS_DB: db } as unknown as Env;
    const fixtureByUrl = new Map([
      [dutyPharmacyConfigs.fethiye.sources[0].url, readFixture("eczaneler-fethiye.html")],
      [dutyPharmacyConfigs.fethiye.sources[1].url, readFixture("nobetci-fethiye.html")],
    ]);
    const fixtureFetch = async (input: URL | RequestInfo) => {
      const url = input instanceof Request ? input.url : String(input);
      return new Response(fixtureByUrl.get(url) || readFixture("cloudflare-challenge.html"), { status: 200 });
    };

    await importDutyPharmacies(env, fixtureFetch as typeof fetch);

    const response = await handleRequest(new Request("https://fethiye-app.com/api/duty-pharmacies?city=fethiye"), env);
    const body = await response.json<{ fetchedAt: string; stale: boolean; pharmacies: PublicDutyPharmacy[] }>();
    const names = body.pharmacies.map((pharmacy) => pharmacy.name);

    expect(response.status).toBe(200);
    expect(body.stale).toBe(false);
    expect(body.pharmacies).toHaveLength(7);
    expect(names).toContain("Balcı Eczanesi");
    expect(names).not.toContain("Altay Eczanesi");
  });

  it("keeps serving last-good data as stale after scrape failures", async () => {
    const db = createSnapshotDb([
      {
        city: "fethiye",
        fetched_at: "2026-06-10T05:30:00.000Z",
        stale: 0,
        pharmacies_json: JSON.stringify([
          {
            name: "Altay Eczanesi",
            address: "Tuzla Mahallesi",
            phone: "+902526123105",
            area: "Fethiye",
            sourceName: "Eczaneler.gen.tr",
            sourceURL: dutyPharmacyConfigs.fethiye.sources[0].url,
          },
        ]),
        last_attempt_at: "2026-06-10T05:30:00.000Z",
        last_error: null,
        updated_at: "2026-06-10T05:30:00.000Z",
      },
    ]);
    const env = { EVENTS_DB: db } as unknown as Env;
    const failingFetch = async () => new Response("upstream error", { status: 503 });

    await importDutyPharmacies(env, failingFetch as typeof fetch);

    const response = await handleRequest(new Request("https://fethiye-app.com/api/duty-pharmacies?city=fethiye"), env);
    const body = await response.json<{ fetchedAt: string; stale: boolean; pharmacies: PublicDutyPharmacy[] }>();

    expect(response.status).toBe(200);
    expect(body.fetchedAt).toBe("2026-06-10T05:30:00.000Z");
    expect(body.stale).toBe(true);
    expect(body.pharmacies).toHaveLength(1);
  });

  it("returns 503 when no last-good city data exists", async () => {
    const response = await handleRequest(
      new Request("https://fethiye-app.com/api/duty-pharmacies?city=marmaris"),
      { EVENTS_DB: createSnapshotDb() } as unknown as Env,
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({ error: expect.any(String) });
  });
});
