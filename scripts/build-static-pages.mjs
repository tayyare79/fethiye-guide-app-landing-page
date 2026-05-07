import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const siteUrl = "https://fethiye-app.com";
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
const utilityTitles = {
  privacy: {
    de: "Datenschutz - Fethiye Guide App",
    en: "Privacy Policy - Fethiye Guide App",
    tr: "Gizlilik Politikası - Fethiye Guide App",
    ru: "Политика конфиденциальности - Fethiye Guide App",
    zh: "隐私政策 - Fethiye Guide App",
  },
  support: {
    de: "Support - Fethiye Guide App",
    en: "Support - Fethiye Guide App",
    tr: "Destek - Fethiye Guide App",
    ru: "Поддержка - Fethiye Guide App",
    zh: "支持 - Fethiye Guide App",
  },
};
const utilityNav = {
  de: { app: "App", places: "Orte", routes: "Routen", privacy: "Datenschutz", support: "Support" },
  en: { app: "App", places: "Places", routes: "Routes", privacy: "Privacy Policy", support: "Support" },
  tr: { app: "Uygulama", places: "Yerler", routes: "Rotalar", privacy: "Gizlilik Politikası", support: "Destek" },
  ru: { app: "Приложение", places: "Места", routes: "Маршруты", privacy: "Конфиденциальность", support: "Поддержка" },
  zh: { app: "应用", places: "地点", routes: "路线", privacy: "隐私政策", support: "支持" },
};
const utilityCopy = {
  privacy: {
    de: {
      eyebrow: "APP DATENSCHUTZ",
      lead:
        "Diese Datenschutzseite beschreibt, wie Fethiye Guide mit Daten umgeht. Stand: 7. Mai 2026.",
      sections: [
        ["Kurzfassung", "Fethiye Guide nutzt kein Konto, keine Werbung, kein Tracking und keine eigene Analyse-Infrastruktur."],
        ["Lokale Daten", "Favoriten und Notizen werden lokal auf deinem Gerät gespeichert. Diese Daten werden nicht an uns übertragen."],
        ["Karten und externe Dienste", "Die App nutzt Apple Kartenfunktionen und kann Orte in Apple Maps öffnen. Dabei können Apple oder der jeweilige Kartendienst technische Daten gemäß den eigenen Datenschutzbedingungen verarbeiten."],
        ["Standort", "Die aktuelle App-Version fragt keine dauerhafte Standortfreigabe ab. Falls du Karten- oder Routenfunktionen des Systems nutzt, gelten die Einstellungen und Datenschutzregeln von iOS und Apple Maps."],
        ["Kontakt", "Bei Fragen zur App oder zum Datenschutz nutze bitte die Support-Seite."],
      ],
    },
    en: {
      eyebrow: "APP PRIVACY",
      lead:
        "This privacy page explains how Fethiye Guide handles data. Last updated: May 7, 2026.",
      sections: [
        ["Summary", "Fethiye Guide does not use accounts, advertising, tracking or its own analytics infrastructure."],
        ["Local data", "Favorites and notes are stored locally on your device. This data is not sent to us."],
        ["Maps and external services", "The app uses Apple map features and can open places in Apple Maps. Apple or the relevant map service may process technical data under their own privacy terms."],
        ["Location", "The current app version does not request persistent location permission. If you use system map or route features, iOS and Apple Maps settings and privacy terms apply."],
        ["Contact", "For app or privacy questions, please use the support page."],
      ],
    },
    tr: {
      eyebrow: "UYGULAMA GİZLİLİĞİ",
      lead:
        "Bu gizlilik sayfası Fethiye Guide uygulamasının verileri nasıl ele aldığını açıklar. Son güncelleme: 7 Mayıs 2026.",
      sections: [
        ["Kısa özet", "Fethiye Guide hesap, reklam, takip veya bize ait analiz altyapısı kullanmaz."],
        ["Yerel veriler", "Favoriler ve notlar cihazında yerel olarak saklanır. Bu veriler bize gönderilmez."],
        ["Haritalar ve dış servisler", "Uygulama Apple harita özelliklerini kullanır ve yerleri Apple Maps içinde açabilir. Apple veya ilgili harita servisi teknik verileri kendi gizlilik koşullarına göre işleyebilir."],
        ["Konum", "Mevcut uygulama sürümü kalıcı konum izni istemez. Sistem harita veya rota özelliklerini kullanırsan iOS ve Apple Maps ayarları ile gizlilik kuralları geçerli olur."],
        ["İletişim", "Uygulama veya gizlilik soruları için lütfen destek sayfasını kullan."],
      ],
    },
    ru: {
      eyebrow: "КОНФИДЕНЦИАЛЬНОСТЬ",
      lead:
        "Эта страница объясняет, как Fethiye Guide обрабатывает данные. Обновлено: 7 мая 2026 г.",
      sections: [
        ["Кратко", "Fethiye Guide не использует аккаунты, рекламу, трекинг или собственную аналитику."],
        ["Локальные данные", "Избранное и заметки хранятся локально на вашем устройстве. Эти данные не передаются нам."],
        ["Карты и внешние сервисы", "Приложение использует функции карт Apple и может открывать места в Apple Maps. Apple или соответствующий картографический сервис могут обрабатывать технические данные по своим правилам конфиденциальности."],
        ["Геолокация", "Текущая версия приложения не запрашивает постоянный доступ к геолокации. При использовании системных карт или маршрутов действуют настройки iOS и правила Apple Maps."],
        ["Контакт", "По вопросам приложения или конфиденциальности используйте страницу поддержки."],
      ],
    },
    zh: {
      eyebrow: "应用隐私",
      lead:
        "本页说明 Fethiye Guide 如何处理数据。最后更新：2026 年 5 月 7 日。",
      sections: [
        ["摘要", "Fethiye Guide 不使用账户、广告、跟踪或自有分析系统。"],
        ["本地数据", "收藏和备注会保存在你的设备本地，不会发送给我们。"],
        ["地图和外部服务", "应用使用 Apple 地图功能，并可在 Apple Maps 中打开地点。Apple 或相关地图服务可能会按照其隐私条款处理技术数据。"],
        ["位置", "当前应用版本不会请求持续的位置权限。如果你使用系统地图或路线功能，则适用 iOS 和 Apple Maps 的设置及隐私规则。"],
        ["联系", "有关应用或隐私的问题，请使用支持页面。"],
      ],
    },
  },
  support: {
    de: {
      eyebrow: "APP SUPPORT",
      lead:
        "Hilfe zur Fethiye Guide App: Orte, Karte, Routen, gespeicherte Favoriten und App-Store-Fragen.",
      sections: [
        ["Schnelle Hilfe", "Aktualisiere die App, starte sie neu und prüfe, ob iOS Karten und Internetzugriff erlaubt."],
        ["Gespeicherte Orte", "Favoriten und Notizen liegen lokal auf deinem Gerät. Wenn die App gelöscht wird, können diese lokalen Daten verloren gehen."],
        ["Karten und Routen", "Die App zeigt kuratierte Orte und kann Apple Maps für Navigation oder Routen öffnen."],
        ["Feedback", "Feedback zu fehlenden Orten, Bildern oder Texten hilft, den Guide besser zu machen. Nutze dafür die Kontaktmöglichkeiten im App Store Eintrag."],
      ],
    },
    en: {
      eyebrow: "APP SUPPORT",
      lead:
        "Help for the Fethiye Guide app: places, map, routes, saved favorites and App Store questions.",
      sections: [
        ["Quick help", "Update the app, restart it and check that iOS allows Maps and internet access."],
        ["Saved places", "Favorites and notes are stored locally on your device. If the app is deleted, this local data may be lost."],
        ["Maps and routes", "The app shows curated places and can open Apple Maps for navigation or routes."],
        ["Feedback", "Feedback about missing places, images or text helps improve the guide. Please use the contact options on the App Store listing."],
      ],
    },
    tr: {
      eyebrow: "UYGULAMA DESTEĞİ",
      lead:
        "Fethiye Guide uygulaması için yardım: yerler, harita, rotalar, kayıtlı favoriler ve App Store soruları.",
      sections: [
        ["Hızlı yardım", "Uygulamayı güncelle, yeniden başlat ve iOS'ta Haritalar ile internet erişiminin açık olduğunu kontrol et."],
        ["Kayıtlı yerler", "Favoriler ve notlar cihazında yerel olarak saklanır. Uygulama silinirse bu yerel veriler kaybolabilir."],
        ["Haritalar ve rotalar", "Uygulama seçilmiş yerleri gösterir ve navigasyon veya rota için Apple Maps'i açabilir."],
        ["Geri bildirim", "Eksik yerler, görseller veya metinler hakkındaki geri bildirim guide'i iyileştirmeye yardım eder. Bunun için App Store kaydındaki iletişim seçeneklerini kullan."],
      ],
    },
    ru: {
      eyebrow: "ПОДДЕРЖКА",
      lead:
        "Помощь по приложению Fethiye Guide: места, карта, маршруты, избранное и вопросы App Store.",
      sections: [
        ["Быстрая помощь", "Обновите приложение, перезапустите его и проверьте, что iOS разрешает доступ к картам и интернету."],
        ["Сохраненные места", "Избранное и заметки хранятся локально на устройстве. При удалении приложения эти данные могут быть потеряны."],
        ["Карты и маршруты", "Приложение показывает подобранные места и может открывать Apple Maps для навигации или маршрутов."],
        ["Отзывы", "Отзывы о недостающих местах, изображениях или текстах помогают улучшать гид. Используйте варианты связи в карточке App Store."],
      ],
    },
    zh: {
      eyebrow: "应用支持",
      lead:
        "Fethiye Guide 应用帮助：地点、地图、路线、收藏以及 App Store 相关问题。",
      sections: [
        ["快速帮助", "请更新应用、重新打开应用，并检查 iOS 是否允许地图和网络访问。"],
        ["已保存地点", "收藏和备注保存在你的设备本地。如果删除应用，这些本地数据可能会丢失。"],
        ["地图和路线", "应用展示精选地点，并可打开 Apple Maps 进行导航或路线规划。"],
        ["反馈", "关于缺少地点、图片或文字的反馈有助于改进指南。请使用 App Store 页面中的联系选项。"],
      ],
    },
  },
};

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

function utilityLanguageLinks(page, currentLang, prefix = "") {
  return languages
    .map((lang) => {
      const active = lang === currentLang ? " active" : "";
      const pressed = lang === currentLang ? "true" : "false";
      return `<a class="lang-button${active}" href="${prefix}${lang}/${page}/" aria-pressed="${pressed}">${languageNames[lang]}</a>`;
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
  const urls = [
    siteUrl + "/",
    `${siteUrl}/privacy/`,
    `${siteUrl}/support/`,
    ...languages.flatMap((lang) => [
      langPaths[lang],
      `${langPaths[lang]}privacy/`,
      `${langPaths[lang]}support/`,
    ]),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map(
      (url) => `  <url>\n    <loc>${url}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${url === `${siteUrl}/` ? "1.0" : "0.9"}</priority>\n  </url>`,
    )
    .join("\n")}\n</urlset>\n`;
}

function renderRobots() {
  return `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
}

function renderUtilityPage(page, lang, rootPrefix, currentUrl) {
  const copy = utilityCopy[page][lang];
  const nav = utilityNav[lang];
  const homeUrl = currentUrl === `${langPaths[lang]}${page}/` ? "../" : rootPrefix || "./";
  const title = utilityTitles[page][lang];
  const sectionHtml = copy.sections
    .map(
      ([heading, text]) =>
        `<article class="legal-card">\n              <h2>${escapeHtml(heading)}</h2>\n              <p>${escapeHtml(text)}</p>\n            </article>`,
    )
    .join("\n            ");

  return `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(copy.lead)}" />
    <meta name="theme-color" content="#0d5f73" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(copy.lead)}" />
    <meta property="og:image" content="${siteUrl}/assets/images/fethiye-promenade.jpg" />
    <meta property="og:url" content="${currentUrl}" />
    <meta property="og:type" content="website" />
    <link rel="canonical" href="${currentUrl}" />
    <link rel="icon" href="${rootPrefix}assets/images/app-icon.png" />
    <link rel="stylesheet" href="${rootPrefix}styles.css" />
  </head>
  <body>
    <header class="site-header" aria-label="Navigation">
      <a class="brand" href="${homeUrl}" aria-label="Fethiye Guide home">
        <img src="${rootPrefix}assets/images/app-icon.png" alt="" />
        <span>Fethiye Guide</span>
      </a>
      <div class="header-actions">
        <nav aria-label="Page navigation">
          <a href="${homeUrl}#app">${escapeHtml(nav.app)}</a>
          <a href="${homeUrl}#orte">${escapeHtml(nav.places)}</a>
          <a href="${homeUrl}#routen">${escapeHtml(nav.routes)}</a>
        </nav>
        <div class="language-switcher" aria-label="Choose language">
          ${utilityLanguageLinks(page, lang, rootPrefix)}
        </div>
      </div>
    </header>
    <main class="legal-page">
      <section class="legal-hero">
        <p class="eyebrow">${escapeHtml(copy.eyebrow)}</p>
        <h1>${escapeHtml(title.replace(" - Fethiye Guide App", ""))}</h1>
        <p class="lead">${escapeHtml(copy.lead)}</p>
      </section>
      <section class="legal-grid" aria-label="${escapeHtml(title)}">
        ${sectionHtml}
      </section>
    </main>
    <footer class="site-footer" aria-label="App information">
      <span>Fethiye Guide App</span>
      <a href="../privacy/">${escapeHtml(nav.privacy)}</a>
      <a href="../support/">${escapeHtml(nav.support)}</a>
    </footer>
  </body>
</html>
`;
}

await writeFile(path.join(root, "index.html"), renderRootPage());
for (const page of ["privacy", "support"]) {
  const dir = path.join(root, page);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "index.html"), renderUtilityPage(page, "en", "../", `${siteUrl}/${page}/`));
}
for (const lang of languages) {
  const dir = path.join(root, lang);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "index.html"), renderLanguagePage(lang));
  for (const page of ["privacy", "support"]) {
    const pageDir = path.join(dir, page);
    await mkdir(pageDir, { recursive: true });
    await writeFile(path.join(pageDir, "index.html"), renderUtilityPage(page, lang, "../../", `${langPaths[lang]}${page}/`));
  }
}
await writeFile(path.join(root, "sitemap.xml"), renderSitemap());
await writeFile(path.join(root, "robots.txt"), renderRobots());
