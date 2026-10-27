import { notFound } from "next/navigation";
import { isLocale, dictionaries } from "@/lib/i18n";
import { sectionSEO } from "@/lib/seo";
import { Catalog, normalizeQuery, Query } from "@/components/catalog";
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
        ...sectionSEO(locale, "news"),
        ...(Object.keys(q).length
          ? { robots: { index: false, follow: true } }
          : {}),
      }
    : {};
}
export default async function News({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Query>;
}) {
  const { locale: lang } = await params;
  if (!isLocale(lang)) notFound();
  const d = dictionaries[lang];
  return (
    <>
      <section className="page-intro container">
        <p className="eyebrow">
          <i />
          RACOTAGAMES / {d.news}
        </p>
        <h1>
          {d.news}
          <span className="heading-dot">.</span>
        </h1>
        <div className="intro-bottom">
          <h2>{d.newsIntro}</h2>
          <p>{d.newsDescription}</p>
        </div>
      </section>
      <section className="container news-catalog journal">
        <div className="journal-masthead">
          <span>RG / RACOTAGAMES</span>
          <strong>{d.dispatch}</strong>
          <span>{d.journalSlogan}</span>
        </div>
        <Catalog
          kind="news"
          lang={lang}
          query={normalizeQuery(await searchParams, "news")}
        />
        <div className="journal-bottom">
          <span>{d.journalBottom}</span>
          <span>RG / JOURNAL</span>
        </div>
      </section>
    </>
  );
}
