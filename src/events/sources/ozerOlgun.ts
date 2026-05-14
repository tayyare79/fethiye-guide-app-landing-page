import type { EventSource, RawEvent } from "../types";
import { normalizeWhitespace } from "../normalize";

const sourceUrl = "https://gosteri.ozerolgunkulturmerkezi.com/";
const venueName = "Fethiye Belediyesi Ozer Olgun Kultur Merkezi";
const address = "Cumhuriyet Mh. Ataturk Cad. 501/2 Sokak Fethiye/Mugla";

function stripHtml(html: string): string {
  return normalizeWhitespace(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "));
}

function decodeEntities(value: string): string {
  return value
    .replace(/&#8211;/g, "-")
    .replace(/&#8217;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

export function parseOzerOlgunEvents(html: string): RawEvent[] {
  const text = decodeEntities(stripHtml(html));
  if (/No events Found/i.test(text)) {
    return [];
  }

  const upcomingIndex = text.toLocaleLowerCase("tr").indexOf("yaklaşan etkinlikler");
  if (upcomingIndex === -1) {
    return [];
  }

  const eventText = text.slice(upcomingIndex, upcomingIndex + 3000);
  const dateMatch = eventText.match(/(\d{1,2})[./\s-]+(\d{1,2})[./\s-]+(20\d{2})/);
  if (!dateMatch) {
    return [];
  }

  const [, day, month, year] = dateMatch;
  const startDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  const afterDateText = eventText.slice(eventText.indexOf(dateMatch[0]) + dateMatch[0].length);
  const timeMatch = afterDateText.match(/(\d{1,2}[:.]\d{2})/);
  const title = normalizeWhitespace(eventText.replace(/^Yaklaşan Etkinlikler/i, "").split(dateMatch[0])[0] || "");

  if (!title) {
    return [];
  }

  return [
    {
      title,
      description: title,
      startDate,
      timeText: timeMatch ? timeMatch[1].replace(".", ":") : undefined,
      venueName,
      address,
      category: "culture",
      sourceName: "Fethiye Belediyesi Ozer Olgun Kultur Merkezi",
      sourceUrl,
      language: "tr",
    },
  ];
}

export const ozerOlgunSource: EventSource = {
  id: "ozer-olgun-kultur-merkezi",
  name: "Fethiye Belediyesi Ozer Olgun Kultur Merkezi",
  homepageUrl: sourceUrl,
  enabled: true,
  notes: "Public WordPress site. robots.txt allows public pages and disallows only /wp-admin/.",
  async fetchEvents(fetcher, userAgent) {
    const response = await fetcher(sourceUrl, {
      headers: {
        "User-Agent": userAgent,
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return parseOzerOlgunEvents(await response.text());
  },
};
