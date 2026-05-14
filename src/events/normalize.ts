import { eventCategories, type EventCategory, type NormalizedEvent, type RawEvent } from "./types";

const categoryKeywords: Array<[EventCategory, string[]]> = [
  ["music", ["konser", "müzik", "music", "concert", "festival"]],
  ["market", ["pazar", "market", "bazaar"]],
  ["culture", ["tiyatro", "sergi", "söyleşi", "sanat", "kültür", "exhibition", "theatre"]],
  ["sports", ["spor", "koşu", "bisiklet", "football", "race"]],
  ["family", ["çocuk", "aile", "family", "kids", "children"]],
  ["food", ["yemek", "lezzet", "food", "gastronomi"]],
];

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function isEventCategory(value: string | null): value is EventCategory {
  return Boolean(value && eventCategories.includes(value as EventCategory));
}

export function inferCategory(title: string, description = ""): EventCategory {
  const haystack = `${title} ${description}`.toLocaleLowerCase("tr");
  for (const [category, keywords] of categoryKeywords) {
    if (keywords.some((keyword) => haystack.includes(keyword))) {
      return category;
    }
  }
  return "other";
}

export function makeDedupeKey(event: Pick<RawEvent, "title" | "startDate" | "venueName" | "sourceUrl">): string {
  const key = [event.title, event.startDate.slice(0, 10), event.venueName || event.sourceUrl]
    .map((part) => normalizeWhitespace(part).toLocaleLowerCase("tr"))
    .join("|");
  return key;
}

export async function makeEventId(dedupeKey: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(dedupeKey));
  const bytes = [...new Uint8Array(digest)].slice(0, 16);
  return bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function calculateConfidence(event: RawEvent): number {
  let score = 0.45;
  if (event.title.length >= 5) score += 0.12;
  if (/^\d{4}-\d{2}-\d{2}/.test(event.startDate)) score += 0.16;
  if (event.venueName.length >= 3) score += 0.1;
  if (event.sourceUrl.startsWith("https://")) score += 0.08;
  if (event.description && event.description.length >= 20) score += 0.06;
  if (event.category) score += 0.03;
  return Math.min(0.99, Number(score.toFixed(2)));
}

export async function normalizeEvent(
  event: RawEvent,
  nowIso: string,
  autoPublishThreshold: number,
): Promise<NormalizedEvent | null> {
  const title = normalizeWhitespace(event.title);
  const venueName = normalizeWhitespace(event.venueName);
  const startDate = event.startDate.trim();

  if (!title || !venueName || !/^\d{4}-\d{2}-\d{2}/.test(startDate)) {
    return null;
  }

  const description = normalizeWhitespace(event.description || title);
  const category = event.category || inferCategory(title, description);
  const confidenceScore = calculateConfidence({ ...event, title, description, venueName, category });
  const dedupeKey = makeDedupeKey({ ...event, title, startDate, venueName });

  return {
    id: await makeEventId(dedupeKey),
    dedupeKey,
    title,
    titleLocalized: {
      ...event.titleLocalized,
      [event.language]: event.titleLocalized?.[event.language as keyof typeof event.titleLocalized] || title,
    },
    description,
    descriptionLocalized: {
      ...event.descriptionLocalized,
      [event.language]:
        event.descriptionLocalized?.[event.language as keyof typeof event.descriptionLocalized] || description,
    },
    startDate,
    endDate: event.endDate,
    timeText: event.timeText ? normalizeWhitespace(event.timeText) : undefined,
    venueName,
    address: event.address ? normalizeWhitespace(event.address) : undefined,
    latitude: event.latitude,
    longitude: event.longitude,
    category,
    imageUrl: event.imageUrl,
    sourceName: event.sourceName,
    sourceUrl: event.sourceUrl,
    language: event.language,
    createdAt: nowIso,
    updatedAt: nowIso,
    confidenceScore,
    status: confidenceScore >= autoPublishThreshold ? "published" : "draft",
  };
}
