import { dutyPharmacyConfigs } from "./cities";
import { dedupePharmacies, parseDutyPharmacies } from "./parser";
import type { DutyPharmacyCityConfig, DutyPharmacyScrapeSummary, PublicDutyPharmacy } from "./types";
import { markDutyPharmacySnapshotStale, saveDutyPharmacySnapshot } from "../storage/dutyPharmacyRepository";

interface PharmacyImportEnv {
  EVENTS_DB: D1Database;
  PHARMACY_IMPORT_USER_AGENT?: string;
}

const defaultUserAgent = "FethiyeGuideBot/0.1 (+https://fethiye-app.com/support/)";

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchHtml(fetcher: typeof fetch, url: string, userAgent: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort("timeout"), 15_000);

  try {
    const response = await fetcher(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": userAgent,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function scrapeCity(config: DutyPharmacyCityConfig, fetcher: typeof fetch, userAgent: string): Promise<PublicDutyPharmacy[]> {
  const collected: PublicDutyPharmacy[] = [];
  const errors: string[] = [];

  for (const source of config.sources) {
    try {
      const html = await fetchHtml(fetcher, source.url, userAgent);
      const parsed = parseDutyPharmacies(html, config, source);
      if (parsed.length === 0) {
        const message = "No pharmacies parsed from source page.";
        errors.push(`${source.name}: ${message}`);
        console.error(JSON.stringify({ message: "duty_pharmacy_scrape_failure", city: config.city, source: source.name, sourceUrl: source.url, error: message }));
      }
      collected.push(...parsed);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown scrape error";
      errors.push(`${source.name}: ${message}`);
      console.error(JSON.stringify({ message: "duty_pharmacy_scrape_failure", city: config.city, source: source.name, sourceUrl: source.url, error: message }));
    }

    await wait(500);
  }

  const deduped = dedupePharmacies(collected);
  if (deduped.length === 0 && errors.length > 0) {
    throw new Error(errors.join("; "));
  }
  return deduped;
}

export async function importDutyPharmacies(env: PharmacyImportEnv, fetcher: typeof fetch = fetch): Promise<DutyPharmacyScrapeSummary> {
  const userAgent = env.PHARMACY_IMPORT_USER_AGENT || defaultUserAgent;
  const summary: DutyPharmacyScrapeSummary = {
    cityCount: Object.keys(dutyPharmacyConfigs).length,
    updatedCount: 0,
    staleCount: 0,
    emptyCount: 0,
    errors: [],
  };

  for (const config of Object.values(dutyPharmacyConfigs)) {
    const attemptedAt = new Date().toISOString();

    try {
      const pharmacies = await scrapeCity(config, fetcher, userAgent);
      if (pharmacies.length === 0) {
        summary.emptyCount += 1;
        await markDutyPharmacySnapshotStale(env.EVENTS_DB, config.city, attemptedAt, "No pharmacies parsed from source pages.");
        summary.errors.push({ city: config.city, message: "No pharmacies parsed from source pages." });
        continue;
      }

      await saveDutyPharmacySnapshot(env.EVENTS_DB, config.city, attemptedAt, pharmacies);
      summary.updatedCount += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown scrape error";
      await markDutyPharmacySnapshotStale(env.EVENTS_DB, config.city, attemptedAt, message);
      summary.staleCount += 1;
      summary.errors.push({ city: config.city, message });
      console.error(JSON.stringify({ message: "duty_pharmacy_city_failure", city: config.city, error: message }));
    }
  }

  return summary;
}
