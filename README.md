# Fethiye Guide App Landing Page

Static GitHub Pages landing page for the Fethiye Guide app.

The page uses screenshots and place photos from the local app projects:

- `fethiye-swiftui-guide-rork`
- `fethiye-mugla-guide`

## Local preview

```bash
python3 -m http.server 4173
```

Then open `http://127.0.0.1:4173`.

## Events API backend

This repository also contains a small Cloudflare Worker for daily Fethiye event imports and the public iOS app API.

The static website remains deployable through GitHub Pages. The Worker is scoped to:

```text
https://fethiye-app.com/api/*
```

### Local API development

```bash
npm install
npm run cf:types
npm run typecheck
npm test
npm run dev:api
```

Apply the D1 schema locally:

```bash
npx wrangler d1 migrations apply fethiye_events --local
```

Then test:

```bash
curl "http://127.0.0.1:8787/api/events"
curl "http://127.0.0.1:8787/api/events?date=2026-05-19"
curl "http://127.0.0.1:8787/api/events?category=music"
```

### Cron import

`wrangler.jsonc` defines a daily Cron Trigger:

```text
15 4 * * *
```

Cloudflare runs Cron Triggers in UTC. The Worker calls `scheduled()` and imports enabled public event sources into D1. Imported events are normalized and deduplicated by `title + date + venue/sourceUrl`.

For local cron testing after `wrangler dev` starts:

```bash
curl "http://127.0.0.1:8787/cdn-cgi/handler/scheduled"
```

### D1 setup

Create the production database once:

```bash
npx wrangler d1 create fethiye_events
```

Replace the placeholder `database_id` in `wrangler.jsonc`, then apply migrations:

```bash
npx wrangler d1 migrations apply fethiye_events --remote
```

### Environment variables

Non-secret Worker vars are stored in `wrangler.jsonc`:

- `EVENTS_AUTO_PUBLISH_THRESHOLD`: confidence score needed for automatic `published` status. Default: `0.86`.
- `EVENTS_IMPORT_USER_AGENT`: crawler user-agent sent to public sources.

No secrets are required for the current implementation. If a future source needs credentials, do not hardcode them; use `wrangler secret put`.

### Adding a new event source

Add a source adapter under `src/events/sources/` and register it in `src/events/sources/eventSources.ts`.

Each source should:

- use only public pages with no login,
- check robots.txt and terms before enabling,
- send the configured User-Agent,
- return `RawEvent[]`,
- store `sourceName` and `sourceUrl`,
- keep uncertain parsers disabled with a TODO note until manually reviewed.

### iOS app usage

The iOS app should read only published events from:

```text
GET https://fethiye-app.com/api/events
GET https://fethiye-app.com/api/events?date=YYYY-MM-DD
GET https://fethiye-app.com/api/events?category=music
```

See `docs/events-api.md` for the response shape and error codes.
