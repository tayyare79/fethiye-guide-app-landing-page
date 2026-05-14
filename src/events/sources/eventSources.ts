import type { EventSource } from "../types";
import { ozerOlgunSource } from "./ozerOlgun";

const muglaMunicipalitySource: EventSource = {
  id: "mugla-buyuksehir-etkinlik",
  name: "Mugla Buyuksehir Belediyesi Etkinlikler",
  homepageUrl: "https://www.mugla.bel.tr/etkinlik/",
  enabled: false,
  notes:
    "TODO: Manual approval needed. The event page is relevant, but robots.txt currently redirects to itself and could not be verified safely.",
  async fetchEvents() {
    return [];
  },
};

const fethiyeMunicipalitySource: EventSource = {
  id: "fethiye-belediyesi",
  name: "Fethiye Belediyesi",
  homepageUrl: "https://fethiye.bel.tr/",
  enabled: false,
  notes:
    "TODO: Manual approval needed. Use only after finding a stable public event/announcement endpoint and verifying robots.txt/terms.",
  async fetchEvents() {
    return [];
  },
};

export const eventSources: EventSource[] = [
  ozerOlgunSource,
  muglaMunicipalitySource,
  fethiyeMunicipalitySource,
];
