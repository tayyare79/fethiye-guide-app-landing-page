CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  dedupe_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  title_de TEXT,
  title_en TEXT,
  title_tr TEXT,
  description TEXT NOT NULL,
  description_de TEXT,
  description_en TEXT,
  description_tr TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT,
  time_text TEXT,
  venue_name TEXT NOT NULL,
  address TEXT,
  latitude REAL,
  longitude REAL,
  category TEXT NOT NULL CHECK (
    category IN ('music', 'market', 'culture', 'sports', 'family', 'food', 'other')
  ),
  image_url TEXT,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  language TEXT NOT NULL,
  confidence_score REAL NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_status_start_date ON events (status, start_date);
CREATE INDEX IF NOT EXISTS idx_events_status_category ON events (status, category);
CREATE INDEX IF NOT EXISTS idx_events_source_url ON events (source_url);
