import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const siteUrl = "https://tayyare79.github.io/fethiye-guide-app-landing-page";
const languages = ["de", "en", "tr", "ru", "zh"];
const languageNames = { de: "DE", en: "EN", tr: "TR", ru: "RU", zh: "中文" };
const localeCodes = { de: "de_DE", en: "en_GB", tr: "tr_TR", ru: "ru_RU", zh: "zh_CN" };
const titles = {
  de: "Fethiye Guide App - Reiseführer für Strände, Routen und Orte",
  en: "Fethiye Guide App - Beaches, Routes and Local Places",
  tr: "Fethiye Guide App - Fethiye Rehberi, Plajlar ve Rotalar",
  ru: "Fethiye Guide App - пляжи, маршруты и места Фетхие",
  zh: "Fethiye Guide App - 费特希耶海滩、路线和地点指南",
};
const ogDescriptions = {
  de: "Entdecke Fethiye mit kuratierten Orten, Tagesrouten, Karte und echten App-Fotos.",
  en: "Explore Fethiye with curated places, day routes, maps and real app photos.",
  tr: "Fethiye'yi seçilmiş yerler, günlük rotalar, harita ve gerçek uygulama fotoğraflarıyla keşfet.",
  ru: "Откройте Фетхие с подборками мест, маршрутами на день, картой и реальными фото из приложения.",
  zh: "通过精选地点、一日路线、地图和真实应用照片探索费特希耶。",
};
const langPaths = Object.fromEntries(languages.map((lang) => [lang, `${siteUrl}/${lang}/`]));

const indexHtml = await readFile(path.join(root, "templates/base.html"), "utf8");
const script = await readFile(path.join(root, "script.js"), "utf8");
const match = script.match(/const translations = ([\s\S]*?);\n\nconst languageButtons/);

if (!match) {
  throw new Error("Could not extract translations from script.js");
}

const translations = Function(`"use strict"; return (${match[1]});`)();

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function languageLinks(currentLang, prefix = "") {
  return languages
    .map((lang) => {
      const active = lang === currentLang ? " active" : "";
      const pressed = lang === currentLang ? "true" : "false";
      return `<a class="lang-button${active}" href="${prefix}${lang}/" data-lang-option="${lang}" aria-pressed="${pressed}">${languageNames[lang]}</a>`;
    })
    .join("\n          ");
}

function hrefLangTags(currentUrl) {
  const alternates = languages
    .map(
      (lang) =>
        `<link rel="alternate" hreflang="${lang}" href="${langPaths[lang]}" />`,
    )
    .join("\n    ");
  return `<link rel="canonical" href="${currentUrl}" />\n    ${alternates}\n    <link rel="alternate" hreflang="x-default" href="${langPaths.en}" />`;
}

function rootHrefLangTags() {
  const alternates = languages
    .map(
      (lang) =>
        `<link rel="alternate" hreflang="${lang}" href="${langPaths[lang]}" />`,
    )
    .join("\n    ");
  return `<link rel="canonical" href="${siteUrl}/" />\n    ${alternates}\n    <link rel="alternate" hreflang="x-default" href="${siteUrl}/" />`;
}

function structuredData(lang, currentUrl) {
  const dict = translations[lang];
  return JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "MobileApplication",
      name: "Fethiye Guide",
      applicationCategory: "TravelApplication",
      operatingSystem: "iOS, Android",
      inLanguage: lang,
      description: dict.metaDescription,
      url: currentUrl,
      image: `${siteUrl}/assets/images/fethiye-promenade.jpg`,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "EUR",
      },
      areaServed: [
        { "@type": "City", name: "Fethiye" },
        { "@type": "AdministrativeArea", name: "Muğla" },
      ],
      about: ["Fethiye", "Ölüdeniz", "Kayaköy", "Muğla", "Turkish Riviera"],
    },
    null,
    2,
  );
}

function renderLanguagePage(lang) {
  const dict = translations[lang];
  const prefix = "../";
  const currentUrl = langPaths[lang];
  let html = indexHtml;

  html = html.replace('<html lang="de">', `<html lang="${lang}">`);
  html = html.replace("<title>Fethiye Guide App</title>", `<title>${escapeHtml(titles[lang])}</title>`);
  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
    `<meta name="description" content="${escapeHtml(dict.metaDescription)}" />`,
  );
  html = html.replace(
    /<meta property="og:title" content="[^"]*" \/>/,
    `<meta property="og:title" content="${escapeHtml(titles[lang])}" />`,
  );
  html = html.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:description" content="${escapeHtml(ogDescriptions[lang])}" />`,
  );
  html = html.replace(
    '<meta property="og:image" content="assets/images/fethiye-promenade.jpg" />',
    `<meta property="og:image" content="${siteUrl}/assets/images/fethiye-promenade.jpg" />\n    <meta property="og:url" content="${currentUrl}" />\n    <meta property="og:type" content="website" />\n    <meta property="og:locale" content="${localeCodes[lang]}" />`,
  );
  html = html.replace(
    '<link rel="icon" href="assets/images/app-icon.png" />',
    `${hrefLangTags(currentUrl)}\n    <link rel="icon" href="${prefix}assets/images/app-icon.png" />`,
  );
  html = html.replace('href="styles.css"', `href="${prefix}styles.css"`);
  html = html.replace('src="script.js"', `src="${prefix}script.js"`);
  html = html.replaceAll('src="assets/', `src="${prefix}assets/`);
  html = html.replaceAll('href="#', `href="./#`);
  html = html.replace(/<button class="lang-button[\s\S]*?中文<\/button>/, languageLinks(lang, "../"));

  for (const [key, value] of Object.entries(dict)) {
    if (key === "metaDescription") continue;
    const pattern = new RegExp(`(<[^>]+data-i18n="${key.replaceAll(".", "\\.")}"[^>]*>)([\\s\\S]*?)(<\\/[^>]+>)`, "g");
    html = html.replace(pattern, `$1${escapeHtml(value)}$3`);
  }

  html = html.replace(
    "</head>",
    `    <script type="application/ld+json">\n${structuredData(lang, currentUrl)}\n    </script>\n  </head>`,
  );

  return html;
}

function renderRootPage() {
  let html = indexHtml;
  html = html.replace("<title>Fethiye Guide App</title>", `<title>${escapeHtml(titles.de)}</title>`);
  html = html.replace(
    '<meta property="og:image" content="assets/images/fethiye-promenade.jpg" />',
    `<meta property="og:image" content="${siteUrl}/assets/images/fethiye-promenade.jpg" />\n    <meta property="og:url" content="${siteUrl}/" />\n    <meta property="og:type" content="website" />\n    <meta property="og:locale" content="de_DE" />`,
  );
  html = html.replace(
    '<link rel="icon" href="assets/images/app-icon.png" />',
    `${rootHrefLangTags()}\n    <link rel="icon" href="assets/images/app-icon.png" />`,
  );
  html = html.replace(/<button class="lang-button[\s\S]*?中文<\/button>/, languageLinks("de", ""));
  html = html.replace(
    "</head>",
    `    <script type="application/ld+json">\n${structuredData("de", langPaths.de)}\n    </script>\n  </head>`,
  );
  return html;
}

function renderSitemap() {
  const now = new Date().toISOString().slice(0, 10);
  const urls = [siteUrl + "/", ...languages.map((lang) => langPaths[lang])];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map(
      (url) => `  <url>\n    <loc>${url}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${url.endsWith("/fethiye-guide-app-landing-page/") ? "1.0" : "0.9"}</priority>\n  </url>`,
    )
    .join("\n")}\n</urlset>\n`;
}

function renderRobots() {
  return `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
}

await writeFile(path.join(root, "index.html"), renderRootPage());
for (const lang of languages) {
  const dir = path.join(root, lang);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "index.html"), renderLanguagePage(lang));
}
await writeFile(path.join(root, "sitemap.xml"), renderSitemap());
await writeFile(path.join(root, "robots.txt"), renderRobots());
