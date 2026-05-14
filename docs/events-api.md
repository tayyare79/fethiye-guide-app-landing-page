# Fethiye Events API

Base URL:

```text
https://fethiye-app.com
```

The API returns only events with `status: "published"`.

## Endpoints

### `GET /api/events`

Returns upcoming published events, ordered by `startDate`.

### `GET /api/events?date=YYYY-MM-DD`

Returns published events whose `startDate` starts with the requested date.

Example:

```text
GET /api/events?date=2026-05-19
```

### `GET /api/events?category=music|market|culture|sports|family|food|other`

Returns published events for the requested category.

Example:

```text
GET /api/events?category=music
```

## Categories

- `music`
- `market`
- `culture`
- `sports`
- `family`
- `food`
- `other`

## Event object

```json
{
  "id": "f347c3872e0a4f1b8f7952cccece462f",
  "title": "Fethiye Caz Konseri",
  "titleLocalized": {
    "tr": "Fethiye Caz Konseri"
  },
  "description": "Fethiye'de halka acik konser etkinligi.",
  "descriptionLocalized": {
    "tr": "Fethiye'de halka acik konser etkinligi."
  },
  "startDate": "2026-05-19",
  "endDate": "2026-05-19",
  "timeText": "20:30",
  "venueName": "Ozer Olgun Kultur Merkezi",
  "address": "Cumhuriyet Mh. Ataturk Cad. 501/2 Sokak Fethiye/Mugla",
  "latitude": 36.621,
  "longitude": 29.116,
  "category": "music",
  "imageUrl": "https://example.com/event.jpg",
  "sourceName": "Fethiye Belediyesi Ozer Olgun Kultur Merkezi",
  "sourceUrl": "https://gosteri.ozerolgunkulturmerkezi.com/",
  "language": "tr",
  "createdAt": "2026-05-14T08:00:00.000Z",
  "updatedAt": "2026-05-14T08:00:00.000Z",
  "confidenceScore": 0.9,
  "status": "published"
}
```

Optional fields may be omitted from the JSON response when unknown:

- `endDate`
- `timeText`
- `address`
- `latitude`
- `longitude`
- `imageUrl`

## Response shape

```json
{
  "data": [
    {
      "id": "f347c3872e0a4f1b8f7952cccece462f",
      "title": "Fethiye Caz Konseri",
      "titleLocalized": {
        "tr": "Fethiye Caz Konseri"
      },
      "description": "Fethiye'de halka acik konser etkinligi.",
      "descriptionLocalized": {
        "tr": "Fethiye'de halka acik konser etkinligi."
      },
      "startDate": "2026-05-19",
      "timeText": "20:30",
      "venueName": "Ozer Olgun Kultur Merkezi",
      "category": "music",
      "sourceName": "Fethiye Belediyesi Ozer Olgun Kultur Merkezi",
      "sourceUrl": "https://gosteri.ozerolgunkulturmerkezi.com/",
      "language": "tr",
      "createdAt": "2026-05-14T08:00:00.000Z",
      "updatedAt": "2026-05-14T08:00:00.000Z",
      "confidenceScore": 0.9,
      "status": "published"
    }
  ],
  "meta": {
    "count": 1,
    "filters": {
      "date": null,
      "category": "music"
    }
  }
}
```

## Error codes

### `400 invalid_date`

The `date` query parameter is not `YYYY-MM-DD`.

```json
{
  "error": {
    "code": "invalid_date",
    "message": "Use date=YYYY-MM-DD."
  }
}
```

### `400 invalid_category`

The `category` query parameter is not one of the supported categories.

### `404 not_found`

The request path is not an API endpoint.

### `405 method_not_allowed`

Only `GET` and `OPTIONS` are supported.

### `500 internal_error`

Unexpected server error.

## Publication safety

Imported events are not blindly published. The importer stores low-confidence events as `draft`. Without an admin system, only events whose `confidenceScore` is greater than or equal to `EVENTS_AUTO_PUBLISH_THRESHOLD` become `published`.
