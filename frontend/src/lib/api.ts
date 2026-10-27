import { Locale } from "./i18n";
export type Taxonomy = { id: number; kind: string; slug: string; name: string };
export type Content = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  seo_title: string;
  seo_description: string;
  cover: string;
  published_at: string;
  updated_at: string;
  featured: boolean;
};
export type Game = Content & {
  price: string;
  currency: string;
  status: "development" | "demo" | "released";
  genres: Taxonomy[];
  platforms: Taxonomy[];
  gallery: { image: string; alt: string }[];
  demo_enabled: boolean;
  release_date: string | null;
  trailer_url: string;
};
export type News = Content & { category: Taxonomy | null };
export type SiteCopy = {
  key: string;
  language: string;
  title: string;
  body: string;
};
export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};
const origin = process.env.API_ORIGIN || "http://127.0.0.1:8010";
export async function api<T>(
  path: string,
  lang: Locale,
  query: Record<string, string> = {},
): Promise<T | null> {
  const url = new URL(`/api/${path}`, origin);
  url.searchParams.set("lang", lang);
  Object.entries(query).forEach(([k, v]) => {
    if (v) url.searchParams.set(k, v);
  });
  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}
export async function detail<T>(path: string, lang: Locale): Promise<T | null> {
  const url = new URL(`/api/${path}`, origin);
  url.searchParams.set("lang", lang);
  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Content service unavailable");
  return response.json();
}
export function media(url: string) {
  if (!url) return "/images/hero.webp";
  if (url.startsWith("/media/")) return `/media-proxy/${url.slice(7)}`;
  try {
    const source = new URL(url);
    const publicBackend = process.env.NEXT_PUBLIC_BACKEND_URL || origin;
    if (
      [new URL(origin).origin, new URL(publicBackend).origin].includes(
        source.origin,
      ) &&
      source.pathname.startsWith("/media/")
    ) {
      return `/media-proxy/${source.pathname.slice(7)}${source.search}`;
    }
  } catch {
    /* Preserve relative sources. */
  }
  return url;
}
export function price(game: Game, lang: Locale, free: string) {
  return Number(game.price) === 0
    ? free
    : new Intl.NumberFormat(
        lang === "az" ? "az-AZ" : lang === "ru" ? "ru-RU" : "en-US",
        { style: "currency", currency: game.currency },
      ).format(Number(game.price));
}
export function date(value: string, lang: Locale) {
  return new Intl.DateTimeFormat(
    lang === "az" ? "az-AZ" : lang === "ru" ? "ru-RU" : "en-GB",
    { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Baku" },
  ).format(new Date(value));
}
export async function siteCopy(lang: Locale) {
  const rows = (await api<SiteCopy[]>("content/", lang)) || [];
  return Object.fromEntries(
    rows
      .filter((r) => r.language === "az")
      .concat(rows.filter((r) => r.language === lang))
      .map((r) => [r.key, r]),
  );
}
