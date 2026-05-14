import { describe, expect, it } from "vitest";
import { handleRequest } from "../src/api";

const sampleRow = {
  id: "event_1",
  title: "Fethiye Caz Konseri",
  title_de: null,
  title_en: null,
  title_tr: "Fethiye Caz Konseri",
  description: "Konser",
  description_de: null,
  description_en: null,
  description_tr: "Konser",
  start_date: "2026-05-19",
  end_date: null,
  time_text: "20:30",
  venue_name: "Ozer Olgun Kultur Merkezi",
  address: null,
  latitude: null,
  longitude: null,
  category: "music",
  image_url: null,
  source_name: "Ozer Olgun",
  source_url: "https://gosteri.ozerolgunkulturmerkezi.com/",
  language: "tr",
  created_at: "2026-05-14T08:00:00.000Z",
  updated_at: "2026-05-14T08:00:00.000Z",
  confidence_score: 0.9,
  status: "published",
};

function createEnv(): Env {
  const db = {
    prepare(_query: string) {
      return {
        bind() {
          return {
            async all() {
              return { results: [sampleRow] };
            },
          };
        },
      };
    },
  };

  return { EVENTS_DB: db } as unknown as Env;
}

describe("events API", () => {
  it("returns published events", async () => {
    const response = await handleRequest(new Request("https://fethiye-app.com/api/events"), createEnv());
    const body = await response.json<{ data: Array<{ title: string }>; meta: { count: number } }>();

    expect(response.status).toBe(200);
    expect(body.meta.count).toBe(1);
    expect(body.data[0]?.title).toBe("Fethiye Caz Konseri");
  });

  it("rejects invalid categories", async () => {
    const response = await handleRequest(
      new Request("https://fethiye-app.com/api/events?category=party"),
      createEnv(),
    );
    const body = await response.json<{ error: { code: string } }>();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("invalid_category");
  });
});
