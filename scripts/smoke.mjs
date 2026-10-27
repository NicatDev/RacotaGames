import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const base = process.argv[2] || "http://127.0.0.1:3001";
let checks = 0;
function check(condition, message) {
  assert.ok(condition, message);
  checks++;
}
for (const lang of ["az", "en", "ru"]) {
  for (const path of [
    "",
    "/games",
    "/news",
    "/about",
    "/privacy",
    "/demo",
    "/login",
  ]) {
    const response = await fetch(`${base}/${lang}${path}`);
    const html = await response.text();
    check(response.status === 200, `${lang}${path}: HTTP 200`);
    check(
      html.includes(`<html lang="${lang}"`),
      `${lang}${path}: server-rendered locale`,
    );
    check(html.includes('rel="canonical"'), `${lang}${path}: canonical`);
    check(html.includes('property="og:title"'), `${lang}${path}: Open Graph`);
    if (path === "/demo" || path === "/login")
      check(html.includes("noindex"), `${lang}${path}: noindex`);
  }
}
const root = await fetch(base, { redirect: "manual" });
check(
  root.status === 307 && root.headers.get("location") === "/az",
  "Root opens AZ home",
);
const filtered = await fetch(
  `${base}/az/games?search=nonexistent&ordering=price`,
);
check((await filtered.text()).includes("noindex"), "Filter pages are noindex");
const sitemap = await fetch(`${base}/sitemap.xml`);
const xml = await sitemap.text();
check(
  sitemap.status === 200 &&
    xml.includes("/az/about") &&
    xml.includes("/en/games") &&
    xml.includes("/ru/news"),
  "Sitemap includes localized pages",
);
check(
  !xml.includes("/login") && !xml.includes("/demo"),
  "Private/form pages excluded from sitemap",
);
const robots = await fetch(`${base}/robots.txt`).then((r) => r.text());
check(
  robots.includes("Disallow: /api/") && robots.includes("sitemap.xml"),
  "Robots excludes API and points to sitemap",
);
const missing = await fetch(`${base}/az/games/does-not-exist-racota-qa`);
check(missing.status === 404, "Missing game returns 404");
const cookies = new Map();
async function request(path, options = {}) {
  const response = await fetch(`${base}/api/backend/${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join("; "),
    },
  });
  for (const value of response.headers.getSetCookie()) {
    const [pair] = value.split(";");
    const index = pair.indexOf("=");
    cookies.set(pair.slice(0, index), pair.slice(index + 1));
  }
  return response;
}
const session = await request("auth/session/");
check(session.status === 200, "Session works through Next proxy");
let token = (await session.json()).csrfToken;
check(!!token && cookies.has("csrftoken"), "Proxy preserves CSRF cookie");
try {
  const credentials = await readFile(
    new URL("../backend/.local-admin.txt", import.meta.url),
    "utf8",
  );
  const username = credentials.match(/Username: (.+)/)[1],
    password = credentials.match(/Password: (.+)/)[1];
  const response = await request("auth/login/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": token,
      Origin: base,
    },
    body: JSON.stringify({ username, password }),
  });
  check(response.status === 200, "Real login works through Next proxy");
  token = (await response.json()).csrfToken;
  const me = await request("auth/session/").then((r) => r.json());
  check(me.user?.username === username, "Session persists after login");
  const logout = await request("auth/logout/", {
    method: "POST",
    headers: { "X-CSRFToken": token, Origin: base },
  });
  check(logout.status === 200, "Logout works through Next proxy");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  console.log(
    "Local admin credentials absent; live admin login check skipped.",
  );
}
const list = await fetch(`${base}/api/backend/games/?page_size=24`).then((r) =>
  r.json(),
);
check(Array.isArray(list.results), "Catalog API proxy works");
if (list.results.length) {
  const game = list.results[0];
  const detail = await fetch(`${base}/az/games/${game.slug}`);
  const html = await detail.text();
  check(
    detail.status === 200 && html.includes(game.title),
    "Published game detail renders",
  );
  const media = new URL(game.cover).pathname;
  const image = await fetch(
    `${base}/media-proxy/${media.replace(/^\/media\//, "")}`,
  );
  check(
    image.status === 200,
    "Uploaded cover is accessible through media proxy",
  );
  const optimization = await fetch(
    `${base}/_next/image?url=${encodeURIComponent("/media-proxy/" + media.replace(/^\/media\//, ""))}&w=640&q=75`,
  );
  check(
    optimization.status === 200,
    "Uploaded cover passes Next Image optimization",
  );
}
console.log(`${checks} live HTTP/SEO/session/media checks passed.`);
