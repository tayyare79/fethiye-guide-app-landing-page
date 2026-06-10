# Duty Pharmacies API

Base URL:

```text
https://fethiye-app.com
```

The Worker scrapes public duty-pharmacy pages on a schedule, stores the last good result in D1, and serves only the stored snapshot from HTTP requests. Requests never scrape upstream sites directly.

## Endpoint

```text
GET /api/duty-pharmacies?city=fethiye|bodrum|marmaris
```

Unknown city slugs return `400 invalid_city`.

Successful response:

```json
{
  "city": "fethiye",
  "fetchedAt": "2026-06-10T05:30:00.000Z",
  "stale": false,
  "pharmacies": [
    {
      "name": "Altay Eczanesi",
      "address": "Tuzla Mahallesi, Sadi Pekin Caddesi, No:16 Fethiye / Muğla",
      "phone": "+902526123105",
      "area": "Fethiye",
      "sourceName": "Eczaneler.gen.tr",
      "sourceURL": "https://www.eczaneler.gen.tr/nobetci-mugla-fethiye"
    }
  ]
}
```

Headers:

```text
Cache-Control: public, max-age=300
Access-Control-Allow-Origin: *
```

If the newest scheduled scrape fails but a previous successful snapshot exists, the API still returns `200` with the previous `fetchedAt` and `stale: true`.

If there is no last-good snapshot for the requested city, the API returns:

```json
{
  "error": "No duty-pharmacy data is available for fethiye yet."
}
```

with status `503`.

## Health

```text
GET /api/health
```

Returns last successful scrape time per city:

```json
{
  "ok": true,
  "dutyPharmacies": [
    {
      "city": "fethiye",
      "lastSuccessfulScrapeAt": "2026-06-10T05:30:00.000Z",
      "stale": false,
      "lastAttemptAt": "2026-06-10T05:30:00.000Z",
      "lastError": null
    }
  ]
}
```

## Sources

Each city merges and deduplicates these public sources:

- Fethiye: `eczaneler.gen.tr/nobetci-mugla-fethiye`, `nobetcieczaneleri.com/mugla/fethiye`
- Bodrum: `eczaneler.gen.tr/nobetci-mugla-bodrum`, `nobetcieczaneleri.com/mugla/bodrum`
- Marmaris: `eczaneler.gen.tr/nobetci-mugla-marmaris`, `nobetcieczaneleri.com/mugla/marmaris`

Deduplication uses normalized `name + phone`. Phone numbers are normalized to `+90...`.

## Schedule

`wrangler.jsonc` defines:

```text
*/30 * * * *
15 4 * * *
```

Cloudflare runs cron triggers in UTC. Every trigger refreshes duty pharmacies. The existing daily event import still runs only on `15 4 * * *`.

The scraper sends the configured `PHARMACY_IMPORT_USER_AGENT`, uses a 15 second timeout per upstream request, and rejects tiny/error/Cloudflare challenge pages before parsing.

## Storage

Last-good snapshots are stored in the existing D1 database binding `EVENTS_DB`, table `duty_pharmacy_snapshots`.

Apply migrations:

```bash
npx wrangler d1 migrations apply fethiye_events --local
npx wrangler d1 migrations apply fethiye_events --remote
```

## Adding a fourth city

1. Add the slug to `dutyPharmacyCities` in `src/pharmacies/types.ts`.
2. Add the city config and source URLs in `src/pharmacies/cities.ts`.
3. Extend the table `CHECK` constraint with a new migration, or relax it if the list will grow often.
4. Add parser fixture coverage for the new city if the source markup differs.
