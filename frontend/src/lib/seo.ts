import type { Metadata } from "next";
import { Locale, locales, dictionaries } from "./i18n";
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export function seo(
  lang: Locale,
  path: string,
  title: string,
  description: string,
  image = "/images/hero.webp",
): Metadata {
  const url = `${siteUrl}/${lang}${path}`;
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: Object.fromEntries([
        ...locales.map((l) => [l, `${siteUrl}/${l}${path}`]),
        ["x-default", `${siteUrl}/az${path}`],
      ]),
    },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "RacotaGames",
      locale: { az: "az_AZ", en: "en_US", ru: "ru_RU" }[lang],
      images: [
        {
          url: new URL(image, siteUrl).href,
          width: 1600,
          height: 900,
          alt: "RacotaGames",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [new URL(image, siteUrl).href],
    },
  };
}
export function sectionSEO(
  lang: Locale,
  section: "home" | "games" | "news" | "about",
) {
  const d = dictionaries[lang];
  return seo(
    lang,
    section === "home" ? "" : `/${section}`,
    section === "home"
      ? "RacotaGames — " + d.eyebrow
      : d[section] + " | RacotaGames",
    section === "home"
      ? d.heroBody
      : section === "games"
        ? d.gamesDescription
        : section === "news"
          ? d.newsDescription
          : d.aboutDescription,
  );
}
export function jsonLD(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
