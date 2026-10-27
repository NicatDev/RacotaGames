import { notFound } from "next/navigation";
import { isLocale, dictionaries } from "@/lib/i18n";
import { sectionSEO } from "@/lib/seo";
import { Catalog, normalizeQuery, Query } from "@/components/catalog";
import { CTA } from "@/components/ui";
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Query>;
}) {
  const { locale } = await params;
  const q = await searchParams;
  return isLocale(locale)
    ? {
        ...sectionSEO(locale, "games"),
        ...(Object.keys(q).length
          ? { robots: { index: false, follow: true } }
          : {}),
      }
    : {};
}
export default async function Games({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Query>;
}) {
  const { locale: lang } = await params;
  if (!isLocale(lang)) notFound();
  const d = dictionaries[lang],
    query = normalizeQuery(await searchParams, "games");
  return (
    <>
      <section className="page-intro container">
        <p className="eyebrow">
          <i />
          RACOTAGAMES / {d.games}
        </p>
        <h1>
          {d.games}
          <span className="heading-dot">.</span>
        </h1>
        <div className="intro-bottom">
          <h2>{d.gamesIntro}</h2>
          <p>{d.gamesDescription}</p>
        </div>
      </section>
      <section className="catalog-section container">
        <Catalog kind="games" lang={lang} query={query} />
      </section>
      <CTA lang={lang} />
    </>
  );
}
