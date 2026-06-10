export const dutyPharmacyCities = ["fethiye", "bodrum", "marmaris"] as const;

export type DutyPharmacyCity = (typeof dutyPharmacyCities)[number];

export type DutyPharmacySourceKind = "eczaneler-gen-tr" | "nobetci-eczaneleri";

export interface DutyPharmacySource {
  kind: DutyPharmacySourceKind;
  name: string;
  url: string;
}

export interface DutyPharmacyCityConfig {
  city: DutyPharmacyCity;
  label: string;
  sources: DutyPharmacySource[];
}

export interface PublicDutyPharmacy {
  name: string;
  address: string;
  phone: string;
  area: string;
  sourceName: string;
  sourceURL: string;
}

export interface DutyPharmacySnapshot {
  city: DutyPharmacyCity;
  fetchedAt: string;
  stale: boolean;
  pharmacies: PublicDutyPharmacy[];
}

export interface DutyPharmacyScrapeSummary {
  cityCount: number;
  updatedCount: number;
  staleCount: number;
  emptyCount: number;
  errors: Array<{ city: DutyPharmacyCity; source?: string; message: string }>;
}
