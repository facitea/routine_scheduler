import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, "..");
const dist = join(root, "dist");

const siteOrigin = "https://ilhagisiro.co.kr";
const staticEntries = ["styles.css", "app.js", "src", "ads.txt", "robots.txt"];
const seoRoutes = [
  {
    path: "/",
    title: "직장인 도구 모음 - 무료 실무 계산기",
    description: "루틴 스케줄러, 금융 계산기, 급여 계산기, 날짜 계산기, 나이 계산기 등 직장인이 자주 쓰는 무료 실무 도구 모음입니다.",
    type: "WebSite",
  },
  {
    path: "/routine",
    title: "루틴 스케줄러 - 반복 일정 관리",
    description: "평일, 주말, 요일별 반복 일정과 완료 체크, 날짜 색칠, Google 로그인 동기화를 지원하는 루틴 스케줄러입니다.",
    type: "WebApplication",
  },
  {
    path: "/interest",
    title: "금융 계산기 - 대출이자 예금 적금 카드 할부",
    description: "대출이자, 예금과 적금, 카드 할부 금액을 월별 표와 함께 계산하는 무료 금융 계산기입니다.",
    type: "WebApplication",
  },
  {
    path: "/salary",
    title: "급여 계산기 - 실수령액 연차 퇴직금 실업급여",
    description: "실수령액, 연차와 근속연수, 퇴직금, 실업급여를 한 번에 계산하는 직장인 급여 계산기입니다.",
    type: "WebApplication",
  },
  {
    path: "/date-tools",
    title: "날짜 계산기 - 일수 주수 개월 수 계산",
    description: "시작일과 종료일을 입력해 일수, 주수, 개월 수, 연월일 차이를 계산하는 날짜 계산기입니다.",
    type: "WebApplication",
  },
  {
    path: "/age",
    title: "나이 계산기 - 만 나이 연나이 띠 계산",
    description: "출생일과 기준일로 만 나이, 연나이, 경과 기간, 입춘 기준 띠를 계산하는 나이 계산기입니다.",
    type: "WebApplication",
  },
  {
    path: "/pdf",
    title: "PDF 변환기 - PDF 합치기 나누기 용량 줄이기",
    description: "브라우저에서 PDF 합치기, 나누기, 용량 줄이기를 처리하는 무료 PDF 변환 도구입니다.",
    type: "WebApplication",
  },
  {
    path: "/image",
    title: "이미지 도구 - 리사이징 포맷 변환 용량 줄이기",
    description: "이미지 리사이징, 포맷 변환, 용량 줄이기를 브라우저에서 처리하는 이미지 도구입니다.",
    type: "WebApplication",
  },
  {
    path: "/video",
    title: "동영상 도구 - 포맷 변환 용량 줄이기",
    description: "MOV, MP4, MKV, AVI, WMV 동영상의 포맷 변환과 용량 줄이기를 브라우저에서 처리하는 동영상 도구입니다.",
    type: "WebApplication",
  },
  {
    path: "/writing",
    title: "글 교정기 - 글자수 계산 맞춤법 검사",
    description: "글자수 계산, 공백 제외 글자수, 단어 수, 기본 맞춤법 검사 기능을 제공하는 글 교정기입니다.",
    type: "WebApplication",
  },
  {
    path: "/expense",
    title: "생활비 계산기 - 카드 현금 지출 계산",
    description: "월급에서 카드 지출과 현금 지출을 나누어 생활비와 남는 금액을 계산하는 생활비 계산기입니다.",
    type: "WebApplication",
  },
];

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

for (const entry of staticEntries) {
  const from = join(root, entry);
  const to = join(dist, entry);
  if (!existsSync(from)) {
    throw new Error(`Missing build entry: ${entry}`);
  }
  cpSync(from, to, { recursive: true });
}

const faviconSource = join(root, "src", "fav.ico");
if (existsSync(faviconSource)) {
  cpSync(faviconSource, join(dist, "favicon.ico"));
}

const baseHtml = readFileSync(join(root, "index.html"), "utf8");

for (const route of seoRoutes) {
  const outputDir = route.path === "/" ? dist : join(dist, route.path.slice(1));
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, "index.html"), renderHtml(route), "utf8");
}

writeFileSync(join(dist, "sitemap.xml"), renderSitemap(), "utf8");
writeFileSync(join(dist, "rss.xml"), renderRss(), "utf8");

console.log(`Built static site into ${dist}`);

function renderHtml(route) {
  const url = `${siteOrigin}${route.path}`;
  const jsonLd =
    route.type === "WebSite"
      ? {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "직장인 도구 모음",
          url,
          description: route.description,
          inLanguage: "ko-KR",
        }
      : {
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: route.title.replace(" - 직장인 도구 모음", ""),
          url,
          description: route.description,
          applicationCategory: "UtilitiesApplication",
          operatingSystem: "Web",
          inLanguage: "ko-KR",
          isAccessibleForFree: true,
        };

  let html = baseHtml
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(route.title)}</title>`)
    .replace(linkPattern("canonical"), `<link rel="canonical" href="${url}" />`);

  html = replaceMeta(html, "name", "description", route.description);
  html = replaceMeta(html, "property", "og:title", route.title);
  html = replaceMeta(html, "property", "og:description", route.description);
  html = replaceMeta(html, "property", "og:url", url);
  html = replaceMeta(html, "name", "twitter:title", route.title);
  html = replaceMeta(html, "name", "twitter:description", route.description);

  return html.replace(
    "</head>",
    `    <script type="application/ld+json">${JSON.stringify(jsonLd).replaceAll("<", "\\u003c")}</script>\n  </head>`,
  );
}

function renderSitemap() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${seoRoutes
  .map(
    (route) => `  <url>
    <loc>${siteOrigin}${route.path}</loc>
  </url>`,
  )
  .join("\n")}
</urlset>
`;
}

function renderRss() {
  const now = new Date().toUTCString();
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>직장인 도구 모음</title>
    <link>${siteOrigin}/</link>
    <description>직장인이 자주 쓰는 무료 실무 계산기와 업무 도구 업데이트입니다.</description>
    <language>ko-KR</language>
    <lastBuildDate>${now}</lastBuildDate>
${seoRoutes
  .map(
    (route) => `    <item>
      <title>${escapeXml(route.title)}</title>
      <link>${siteOrigin}${route.path}</link>
      <guid>${siteOrigin}${route.path}</guid>
      <description>${escapeXml(route.description)}</description>
      <pubDate>${now}</pubDate>
    </item>`,
  )
  .join("\n")}
  </channel>
</rss>
`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeXml(value) {
  return escapeHtml(value).replaceAll("'", "&apos;");
}

function replaceMeta(html, attribute, name, content) {
  return html.replace(
    metaPattern(attribute, name),
    `<meta ${attribute}="${name}" content="${escapeHtml(content)}" />`,
  );
}

function metaPattern(attribute, name) {
  return new RegExp(`<meta\\b(?=[^>]*\\b${attribute}="${escapeRegExp(name)}")[^>]*>`, "i");
}

function linkPattern(rel) {
  return new RegExp(`<link\\b(?=[^>]*\\brel="${escapeRegExp(rel)}")[^>]*>`, "i");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
