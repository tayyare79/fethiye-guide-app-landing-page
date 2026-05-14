import { normalizeEvent } from "./normalize";
import { eventSources } from "./sources/eventSources";
import type { ImportSummary, NormalizedEvent } from "./types";
import { upsertEvents } from "../storage/eventsRepository";

interface ImportEnv {
  EVENTS_DB: D1Database;
  EVENTS_AUTO_PUBLISH_THRESHOLD?: string;
  EVENTS_IMPORT_USER_AGENT?: string;
}

const defaultUserAgent = "FethiyeGuideBot/0.1 (+https://fethiye-app.com/support/)";

function getThreshold(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : 0.86;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function importEvents(env: ImportEnv, fetcher: typeof fetch = fetch): Promise<ImportSummary> {
  const nowIso = new Date().toISOString();
  const threshold = getThreshold(env.EVENTS_AUTO_PUBLISH_THRESHOLD);
  const userAgent = env.EVENTS_IMPORT_USER_AGENT || defaultUserAgent;
  const summary: ImportSummary = {
    sourceCount: eventSources.length,
    fetchedCount: 0,
    normalizedCount: 0,
    upsertedCount: 0,
    skippedCount: 0,
    errors: [],
  };
  const normalizedEvents: NormalizedEvent[] = [];

  for (const source of eventSources) {
    if (!source.enabled) {
      continue;
    }

    try {
      const rawEvents = await source.fetchEvents(fetcher, userAgent);
      summary.fetchedCount += rawEvents.length;
      for (const rawEvent of rawEvents) {
        const normalized = await normalizeEvent(rawEvent, nowIso, threshold);
        if (normalized) {
          normalizedEvents.push(normalized);
          summary.normalizedCount += 1;
        } else {
          summary.skippedCount += 1;
        }
      }
    } catch (error) {
      summary.errors.push({
        source: source.name,
        message: error instanceof Error ? error.message : "Unknown import error",
      });
    }

    await wait(750);
  }

  summary.upsertedCount = await upsertEvents(env.EVENTS_DB, normalizedEvents);
  return summary;
}
