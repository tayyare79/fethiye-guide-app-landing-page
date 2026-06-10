import type { DutyPharmacyCity, DutyPharmacySnapshot, PublicDutyPharmacy } from "../pharmacies/types";

interface DutyPharmacySnapshotRow {
  city: DutyPharmacyCity;
  fetched_at: string;
  stale: number;
  pharmacies_json: string;
  last_attempt_at: string | null;
  last_error: string | null;
  updated_at: string;
}

export interface DutyPharmacyHealthRow {
  city: DutyPharmacyCity;
  lastSuccessfulScrapeAt: string | null;
  stale: boolean;
  lastAttemptAt: string | null;
  lastError: string | null;
}

function toSnapshot(row: DutyPharmacySnapshotRow): DutyPharmacySnapshot {
  return {
    city: row.city,
    fetchedAt: row.fetched_at,
    stale: row.stale === 1,
    pharmacies: JSON.parse(row.pharmacies_json) as PublicDutyPharmacy[],
  };
}

export async function getDutyPharmacySnapshot(db: D1Database, city: DutyPharmacyCity): Promise<DutyPharmacySnapshot | null> {
  const row = await db
    .prepare("SELECT * FROM duty_pharmacy_snapshots WHERE city = ?")
    .bind(city)
    .first<DutyPharmacySnapshotRow>();
  return row ? toSnapshot(row) : null;
}

export async function listDutyPharmacyHealth(db: D1Database): Promise<DutyPharmacyHealthRow[]> {
  const result = await db
    .prepare("SELECT city, fetched_at, stale, last_attempt_at, last_error, updated_at FROM duty_pharmacy_snapshots ORDER BY city")
    .all<DutyPharmacySnapshotRow>();

  return (result.results || []).map((row) => ({
    city: row.city,
    lastSuccessfulScrapeAt: row.fetched_at,
    stale: row.stale === 1,
    lastAttemptAt: row.last_attempt_at,
    lastError: row.last_error,
  }));
}

export async function saveDutyPharmacySnapshot(
  db: D1Database,
  city: DutyPharmacyCity,
  fetchedAt: string,
  pharmacies: PublicDutyPharmacy[],
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO duty_pharmacy_snapshots (
        city, fetched_at, stale, pharmacies_json, last_attempt_at, last_error, updated_at
      ) VALUES (?, ?, 0, ?, ?, NULL, ?)
      ON CONFLICT(city) DO UPDATE SET
        fetched_at = excluded.fetched_at,
        stale = 0,
        pharmacies_json = excluded.pharmacies_json,
        last_attempt_at = excluded.last_attempt_at,
        last_error = NULL,
        updated_at = excluded.updated_at`,
    )
    .bind(city, fetchedAt, JSON.stringify(pharmacies), fetchedAt, fetchedAt)
    .run();
}

export async function markDutyPharmacySnapshotStale(
  db: D1Database,
  city: DutyPharmacyCity,
  attemptedAt: string,
  error: string,
): Promise<void> {
  await db
    .prepare(
      `UPDATE duty_pharmacy_snapshots
      SET stale = 1, last_attempt_at = ?, last_error = ?, updated_at = ?
      WHERE city = ?`,
    )
    .bind(attemptedAt, error.slice(0, 500), attemptedAt, city)
    .run();
}
