import type { EventCategory, NormalizedEvent, PublicEvent } from "../events/types";

export interface EventFilters {
  date?: string;
  category?: EventCategory;
}

interface EventRow {
  id: string;
  title: string;
  title_de: string | null;
  title_en: string | null;
  title_tr: string | null;
  description: string;
  description_de: string | null;
  description_en: string | null;
  description_tr: string | null;
  start_date: string;
  end_date: string | null;
  time_text: string | null;
  venue_name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  category: EventCategory;
  image_url: string | null;
  source_name: string;
  source_url: string;
  language: PublicEvent["language"];
  created_at: string;
  updated_at: string;
  confidence_score: number;
  status: PublicEvent["status"];
}

export function toPublicEvent(row: EventRow): PublicEvent {
  return {
    id: row.id,
    title: row.title,
    titleLocalized: {
      de: row.title_de || undefined,
      en: row.title_en || undefined,
      tr: row.title_tr || undefined,
    },
    description: row.description,
    descriptionLocalized: {
      de: row.description_de || undefined,
      en: row.description_en || undefined,
      tr: row.description_tr || undefined,
    },
    startDate: row.start_date,
    endDate: row.end_date || undefined,
    timeText: row.time_text || undefined,
    venueName: row.venue_name,
    address: row.address || undefined,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    category: row.category,
    imageUrl: row.image_url || undefined,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    language: row.language,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    confidenceScore: row.confidence_score,
    status: row.status,
  };
}

export async function listPublishedEvents(db: D1Database, filters: EventFilters): Promise<PublicEvent[]> {
  let query = "SELECT * FROM events WHERE status = ?";
  const bindings: Array<string> = ["published"];

  if (filters.date) {
    query += " AND substr(start_date, 1, 10) = ?";
    bindings.push(filters.date);
  }

  if (filters.category) {
    query += " AND category = ?";
    bindings.push(filters.category);
  }

  query += " ORDER BY start_date ASC, title ASC LIMIT 100";
  const result = await db.prepare(query).bind(...bindings).all<EventRow>();
  return (result.results || []).map(toPublicEvent);
}

export async function upsertEvents(db: D1Database, events: NormalizedEvent[]): Promise<number> {
  if (events.length === 0) {
    return 0;
  }

  const statements = events.map((event) =>
    db
      .prepare(
        `INSERT INTO events (
          id, dedupe_key, title, title_de, title_en, title_tr,
          description, description_de, description_en, description_tr,
          start_date, end_date, time_text, venue_name, address,
          latitude, longitude, category, image_url, source_name, source_url,
          language, confidence_score, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(dedupe_key) DO UPDATE SET
          title = excluded.title,
          title_de = excluded.title_de,
          title_en = excluded.title_en,
          title_tr = excluded.title_tr,
          description = excluded.description,
          description_de = excluded.description_de,
          description_en = excluded.description_en,
          description_tr = excluded.description_tr,
          start_date = excluded.start_date,
          end_date = excluded.end_date,
          time_text = excluded.time_text,
          venue_name = excluded.venue_name,
          address = excluded.address,
          latitude = excluded.latitude,
          longitude = excluded.longitude,
          category = excluded.category,
          image_url = excluded.image_url,
          source_name = excluded.source_name,
          source_url = excluded.source_url,
          language = excluded.language,
          confidence_score = excluded.confidence_score,
          status = CASE
            WHEN events.status = 'published' THEN 'published'
            ELSE excluded.status
          END,
          updated_at = excluded.updated_at`,
      )
      .bind(
        event.id,
        event.dedupeKey,
        event.title,
        event.titleLocalized.de || null,
        event.titleLocalized.en || null,
        event.titleLocalized.tr || null,
        event.description,
        event.descriptionLocalized.de || null,
        event.descriptionLocalized.en || null,
        event.descriptionLocalized.tr || null,
        event.startDate,
        event.endDate || null,
        event.timeText || null,
        event.venueName,
        event.address || null,
        event.latitude ?? null,
        event.longitude ?? null,
        event.category,
        event.imageUrl || null,
        event.sourceName,
        event.sourceUrl,
        event.language,
        event.confidenceScore,
        event.status,
        event.createdAt,
        event.updatedAt,
      ),
  );

  await db.batch(statements);
  return events.length;
}
