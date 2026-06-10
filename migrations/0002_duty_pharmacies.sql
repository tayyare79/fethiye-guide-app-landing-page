CREATE TABLE IF NOT EXISTS duty_pharmacy_snapshots (
  city TEXT PRIMARY KEY CHECK (city IN ('fethiye', 'bodrum', 'marmaris')),
  fetched_at TEXT NOT NULL,
  stale INTEGER NOT NULL DEFAULT 0 CHECK (stale IN (0, 1)),
  pharmacies_json TEXT NOT NULL,
  last_attempt_at TEXT,
  last_error TEXT,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_duty_pharmacy_snapshots_stale ON duty_pharmacy_snapshots (stale);
