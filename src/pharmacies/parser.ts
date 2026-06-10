import type { DutyPharmacyCityConfig, DutyPharmacySource, PublicDutyPharmacy } from "./types";

const knownAreas = [
  "Göcek",
  "Hisarönü",
  "Ölüdeniz",
  "Karaçulha",
  "Esenköy",
  "Patlangıç",
  "Taşyaka",
  "Akarca",
  "Tuzla",
  "Cumhuriyet",
  "Yeni Mahalle",
  "Pazaryeri",
  "Merkez",
  "Çalıca",
  "İçmeler",
  "Turunç",
  "Bitez",
  "Gümbet",
  "Yalıkavak",
  "Turgutreis",
  "Ortakent",
];

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function decodeEntities(value: string): string {
  const named = value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&rarr;/g, "->")
    .replace(/&raquo;/g, "»");

  return named.replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number(code)));
}

function stripHtml(value: string): string {
  return normalizeWhitespace(
    decodeEntities(
      value
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "\n"),
    ),
  );
}

function htmlToLines(html: string): string[] {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "\n"),
  )
    .split(/\n+/)
    .map(normalizeWhitespace)
    .filter(Boolean);
}

function isChallengeOrErrorPage(html: string, minLength: number): boolean {
  const lower = html.toLocaleLowerCase("tr");
  return (
    html.length < minLength ||
    lower.includes("just a moment") ||
    lower.includes("attention required") ||
    lower.includes("cloudflare")
  );
}

export function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D+/g, "");
  if (!digits) {
    return "";
  }
  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }
  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  if (!digits.startsWith("90")) {
    digits = `90${digits}`;
  }
  return `+${digits}`;
}

function phoneFromText(value: string): string {
  const match = value.match(/0\s*\(?252\)?[\s-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}|0\s*5\d{2}[\s-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}|\+?90\s*\d{3}\s*\d{3}\s*\d{2}\s*\d{2}/);
  return match ? normalizePhone(match[0]) : "";
}

function cityDefaultArea(config: DutyPharmacyCityConfig): string {
  return config.label;
}

function areaFromAddress(address: string, config: DutyPharmacyCityConfig): string {
  return knownAreas.find((area) => address.toLocaleLowerCase("tr").includes(area.toLocaleLowerCase("tr"))) || cityDefaultArea(config);
}

function normalizeArea(area: string, config: DutyPharmacyCityConfig): string {
  return normalizeWhitespace(area.replace(/\(İcap Nöbeti\)/gi, "").replace(/»/g, "")) || cityDefaultArea(config);
}

function makePharmacy(
  config: DutyPharmacyCityConfig,
  source: DutyPharmacySource,
  name: string,
  address: string,
  phone: string,
  area: string,
): PublicDutyPharmacy | null {
  const normalizedName = normalizeWhitespace(decodeEntities(name));
  const normalizedAddress = normalizeWhitespace(decodeEntities(address));
  const normalizedPhone = normalizePhone(phone);

  if (!normalizedName || !normalizedAddress || !normalizedPhone) {
    return null;
  }

  return {
    name: normalizedName,
    address: normalizedAddress,
    phone: normalizedPhone,
    area: normalizeArea(decodeEntities(area), config),
    sourceName: source.name,
    sourceURL: source.url,
  };
}

export function dedupePharmacies(pharmacies: PublicDutyPharmacy[]): PublicDutyPharmacy[] {
  const seen = new Set<string>();
  return pharmacies.filter((pharmacy) => {
    const key = `${pharmacy.name.toLocaleLowerCase("tr")}|${pharmacy.phone}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function parseEczanelerCards(html: string, config: DutyPharmacyCityConfig, source: DutyPharmacySource): PublicDutyPharmacy[] {
  const firstSection = html.match(/alert alert-warning[\s\S]*?(?=<\/table><\/div>\s*<div class="container|<\/table><\/div>\s*<br>|$)/i)?.[0] || html;
  const cardPattern = /<span class=["']isim["']>([\s\S]*?)<\/span>[\s\S]*?<div class=['"]col-lg-6['"]>([\s\S]*?)<\/div>\s*<div class=['"]col-lg-3 py-lg-2['"]>([\s\S]*?)<\/div>/gi;
  const rows: PublicDutyPharmacy[] = [];
  let match: RegExpExecArray | null;

  while ((match = cardPattern.exec(firstSection)) !== null) {
    const [, nameHtml, addressHtml, phoneHtml] = match;
    const badge = addressHtml.match(/bg-secondary[^>]*>([\s\S]*?)<\/span>/i)?.[1] || "";
    const address = stripHtml(addressHtml.split(/<div class=["']py-2|<div class=["']py-1|<div class=["']my-2/i)[0] || addressHtml);
    const pharmacy = makePharmacy(config, source, stripHtml(nameHtml), address, stripHtml(phoneHtml), badge || areaFromAddress(address, config));
    if (pharmacy) {
      rows.push(pharmacy);
    }
  }

  return rows;
}

function parseEczanelerLines(html: string, config: DutyPharmacyCityConfig, source: DutyPharmacySource): PublicDutyPharmacy[] {
  const lines = htmlToLines(html);
  const headerIndex = lines.findIndex((line) => line.includes("akşamından") && line.includes("sabahına kadar"));
  if (headerIndex === -1) {
    return [];
  }

  const rows: PublicDutyPharmacy[] = [];
  for (let index = headerIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.includes("akşamından") && line.includes("sabahına kadar")) {
      break;
    }
    if (line.endsWith("Eczanesi") || line.endsWith("Eczane")) {
      const address = lines[index + 1] || "";
      const area = (lines[index + 2] || "").includes("»") ? lines[index + 3] || cityDefaultArea(config) : lines[index + 2] || cityDefaultArea(config);
      const phone = lines.slice(index, index + 7).map(phoneFromText).find(Boolean) || "";
      const pharmacy = makePharmacy(config, source, line, address, phone, area);
      if (pharmacy) {
        rows.push(pharmacy);
      }
    }
  }

  return rows;
}

export function parseEczanelerGenTr(html: string, config: DutyPharmacyCityConfig, source: DutyPharmacySource): PublicDutyPharmacy[] {
  if (isChallengeOrErrorPage(html, 2000)) {
    return [];
  }
  return dedupePharmacies(parseEczanelerCards(html, config, source).concat(parseEczanelerLines(html, config, source)));
}

export function parseNobetciEczaneleri(html: string, config: DutyPharmacyCityConfig, source: DutyPharmacySource): PublicDutyPharmacy[] {
  if (isChallengeOrErrorPage(html, 1500)) {
    return [];
  }

  const rows: PublicDutyPharmacy[] = [];
  const cardPattern = /<h3 class=["']eczane-title["']>([\s\S]*?)<\/h3>[\s\S]*?<p[^>]*>[\s\S]*?<strong>\s*Adres:\s*<\/strong>\s*([\s\S]*?)<\/p>[\s\S]*?<a class=["']phone-link["'][^>]*>\s*([\s\S]*?)\s*<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = cardPattern.exec(html)) !== null) {
    const [, nameHtml, addressHtml, phoneHtml] = match;
    const address = stripHtml(addressHtml);
    const pharmacy = makePharmacy(config, source, stripHtml(nameHtml), address, stripHtml(phoneHtml), areaFromAddress(address, config));
    if (pharmacy) {
      rows.push(pharmacy);
    }
  }

  return dedupePharmacies(rows);
}

export function parseDutyPharmacies(html: string, config: DutyPharmacyCityConfig, source: DutyPharmacySource): PublicDutyPharmacy[] {
  return source.kind === "eczaneler-gen-tr"
    ? parseEczanelerGenTr(html, config, source)
    : parseNobetciEczaneleri(html, config, source);
}
