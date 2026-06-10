import type { DutyPharmacyCity, DutyPharmacyCityConfig } from "./types";

export const dutyPharmacyConfigs: Record<DutyPharmacyCity, DutyPharmacyCityConfig> = {
  fethiye: {
    city: "fethiye",
    label: "Fethiye",
    sources: [
      {
        kind: "eczaneler-gen-tr",
        name: "Eczaneler.gen.tr",
        url: "https://www.eczaneler.gen.tr/nobetci-mugla-fethiye",
      },
      {
        kind: "nobetci-eczaneleri",
        name: "Nöbetçi Eczaneleri",
        url: "https://nobetcieczaneleri.com/mugla/fethiye",
      },
    ],
  },
  bodrum: {
    city: "bodrum",
    label: "Bodrum",
    sources: [
      {
        kind: "eczaneler-gen-tr",
        name: "Eczaneler.gen.tr",
        url: "https://www.eczaneler.gen.tr/nobetci-mugla-bodrum",
      },
      {
        kind: "nobetci-eczaneleri",
        name: "Nöbetçi Eczaneleri",
        url: "https://nobetcieczaneleri.com/mugla/bodrum",
      },
    ],
  },
  marmaris: {
    city: "marmaris",
    label: "Marmaris",
    sources: [
      {
        kind: "eczaneler-gen-tr",
        name: "Eczaneler.gen.tr",
        url: "https://www.eczaneler.gen.tr/nobetci-mugla-marmaris",
      },
      {
        kind: "nobetci-eczaneleri",
        name: "Nöbetçi Eczaneleri",
        url: "https://nobetcieczaneleri.com/mugla/marmaris",
      },
    ],
  },
};

export function isDutyPharmacyCity(value: string | null): value is DutyPharmacyCity {
  return value === "fethiye" || value === "bodrum" || value === "marmaris";
}
