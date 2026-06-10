import { eventCategories } from "./events/types";
import { isEventCategory } from "./events/normalize";
import { listPublishedEvents } from "./storage/eventsRepository";
import { dutyPharmacyCities } from "./pharmacies/types";
import { isDutyPharmacyCity } from "./pharmacies/cities";
import { getDutyPharmacySnapshot, listDutyPharmacyHealth } from "./storage/dutyPharmacyRepository";

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
};

function jsonResponse(body: unknown, status = 200, extraHeaders: HeadersInit = {}): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      ...jsonHeaders,
      ...extraHeaders,
    },
  });
}

function errorResponse(code: string, message: string, status: number): Response {
  return jsonResponse({ error: { code, message } }, status);
}

function isIsoDate(value: string | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

async function handleEventsRequest(url: URL, env: Env): Promise<Response> {
  const date = url.searchParams.get("date");
  const category = url.searchParams.get("category");

  if (date && !isIsoDate(date)) {
    return errorResponse("invalid_date", "Use date=YYYY-MM-DD.", 400);
  }

  if (category && !isEventCategory(category)) {
    return errorResponse(
      "invalid_category",
      `Use one of: ${eventCategories.join(", ")}.`,
      400,
    );
  }

  const categoryFilter = category && isEventCategory(category) ? category : undefined;
  const events = await listPublishedEvents(env.EVENTS_DB, {
    date: date || undefined,
    category: categoryFilter,
  });

  return jsonResponse({
    data: events,
    meta: {
      count: events.length,
      filters: {
        date: date || null,
        category: category || null,
      },
    },
  });
}

async function handleDutyPharmaciesRequest(url: URL, env: Env): Promise<Response> {
  const city = url.searchParams.get("city");

  if (!isDutyPharmacyCity(city)) {
    return errorResponse("invalid_city", `Use one of: ${dutyPharmacyCities.join(", ")}.`, 400);
  }

  const snapshot = await getDutyPharmacySnapshot(env.EVENTS_DB, city);
  if (!snapshot || snapshot.pharmacies.length === 0) {
    return jsonResponse({ error: `No duty-pharmacy data is available for ${city} yet.` }, 503, {
      "Cache-Control": "no-store",
    });
  }

  return jsonResponse(snapshot, 200, {
    "Cache-Control": "public, max-age=300",
  });
}

async function handleHealthRequest(env: Env): Promise<Response> {
  const rows = await listDutyPharmacyHealth(env.EVENTS_DB);
  const rowsByCity = new Map(rows.map((row) => [row.city, row]));

  return jsonResponse({
    ok: true,
    dutyPharmacies: dutyPharmacyCities.map((city) => {
      const row = rowsByCity.get(city);
      return {
        city,
        lastSuccessfulScrapeAt: row?.lastSuccessfulScrapeAt || null,
        stale: row?.stale || false,
        lastAttemptAt: row?.lastAttemptAt || null,
        lastError: row?.lastError || null,
      };
    }),
  });
}

export async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: jsonHeaders });
  }

  if (request.method !== "GET") {
    return errorResponse("method_not_allowed", "Only GET is supported.", 405);
  }

  if (url.pathname === "/api/events") {
    return handleEventsRequest(url, env);
  }

  if (url.pathname === "/api/duty-pharmacies") {
    return handleDutyPharmaciesRequest(url, env);
  }

  if (url.pathname === "/api/health") {
    return handleHealthRequest(env);
  }

  return errorResponse("not_found", "Endpoint not found.", 404);
}
