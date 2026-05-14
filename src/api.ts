import { eventCategories } from "./events/types";
import { isEventCategory } from "./events/normalize";
import { listPublishedEvents } from "./storage/eventsRepository";

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: jsonHeaders,
  });
}

function errorResponse(code: string, message: string, status: number): Response {
  return jsonResponse({ error: { code, message } }, status);
}

function isIsoDate(value: string | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: jsonHeaders });
  }

  if (request.method !== "GET") {
    return errorResponse("method_not_allowed", "Only GET is supported.", 405);
  }

  if (url.pathname !== "/api/events") {
    return errorResponse("not_found", "Endpoint not found.", 404);
  }

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
