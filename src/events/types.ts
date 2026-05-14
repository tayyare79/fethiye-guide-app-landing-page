export const eventCategories = [
  "music",
  "market",
  "culture",
  "sports",
  "family",
  "food",
  "other",
] as const;

export type EventCategory = (typeof eventCategories)[number];
export type EventStatus = "draft" | "published";
export type EventLanguage = "de" | "en" | "tr" | "ru" | "zh" | "unknown";

export interface LocalizedText {
  de?: string;
  en?: string;
  tr?: string;
}

export interface RawEvent {
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  timeText?: string;
  venueName: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  category?: EventCategory;
  imageUrl?: string;
  sourceName: string;
  sourceUrl: string;
  language: EventLanguage;
  titleLocalized?: LocalizedText;
  descriptionLocalized?: LocalizedText;
}

export interface NormalizedEvent {
  id: string;
  dedupeKey: string;
  title: string;
  titleLocalized: LocalizedText;
  description: string;
  descriptionLocalized: LocalizedText;
  startDate: string;
  endDate?: string;
  timeText?: string;
  venueName: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  category: EventCategory;
  imageUrl?: string;
  sourceName: string;
  sourceUrl: string;
  language: EventLanguage;
  createdAt: string;
  updatedAt: string;
  confidenceScore: number;
  status: EventStatus;
}

export interface PublicEvent {
  id: string;
  title: string;
  titleLocalized: LocalizedText;
  description: string;
  descriptionLocalized: LocalizedText;
  startDate: string;
  endDate?: string;
  timeText?: string;
  venueName: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  category: EventCategory;
  imageUrl?: string;
  sourceName: string;
  sourceUrl: string;
  language: EventLanguage;
  createdAt: string;
  updatedAt: string;
  confidenceScore: number;
  status: EventStatus;
}

export interface EventSource {
  id: string;
  name: string;
  homepageUrl: string;
  enabled: boolean;
  notes: string;
  fetchEvents(fetcher: typeof fetch, userAgent: string): Promise<RawEvent[]>;
}

export interface ImportSummary {
  sourceCount: number;
  fetchedCount: number;
  normalizedCount: number;
  upsertedCount: number;
  skippedCount: number;
  errors: Array<{ source: string; message: string }>;
}
