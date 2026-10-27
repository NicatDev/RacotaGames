import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  Plus,
  Gamepad2,
  Sparkles,
  Users,
  MoveUpRight,
} from "lucide-react";
import { isLocale, dictionaries } from "@/lib/i18n";
import { api, Game, News, Paginated, siteCopy } from "@/lib/api";
import { sectionSEO, jsonLD, siteUrl } from "@/lib/seo";
import {
  ButtonLink,
  SectionHeading,
  EmptyState,
  GameCard,
  NewsCard,
  CTA,
} from "@/components/ui";
import { notFound } from "next/navigation";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return isLocale(locale) ? sectionSEO(locale, "home") : {};
}
export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: lang } = await params;
  if (!isLocale(lang)) notFound();
  const d = dictionaries[lang];
  const [games, news, copy] = await Promise.all([
    api<Paginated<Game>>("games/", lang, { featured: "true", page_size: "3" }),
    api<Paginated<News>>("news/", lang, { page_size: "3" }),
    siteCopy(lang),
  ]);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLD({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "RacotaGames",
            url: siteUrl,
            logo: `${siteUrl}/images/logo.webp`,
            description: d.studioBody,
          }),
        }}
      />
      <section className="hero">
        <Image
          src="/images/hero.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          quality={85}
          className="hero-image"
        />
        <div className="hero-shade" />
        <div className="hero-grid" />
        <div className="hero-content container">
          <p className="eyebrow">
            <i />
            {d.eyebrow}
          </p>
          <h1>
            {copy.home_intro?.title ? (
              <span>{copy.home_intro.title}</span>
            ) : (
              <>
                <span>{d.hero1}</span>
                <span>{d.hero2}</span>
                <span className="outline-word">
                  {d.hero3}
                  <b className="red-dot">↗</b>
                </span>
              </>
            )}
          </h1>
          <p className="hero-description">
            {copy.home_intro?.body || d.heroBody}
          </p>
          <div className="hero-buttons">
            <ButtonLink href={`/${lang}/games`}>{d.explore}</ButtonLink>
            <Link href={`/${lang}/about`} className="hero-about">
              {d.meet}
              <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
        <div className="hero-bottom container">
          <a href="#worlds" className="scroll-cue">
            <span>
              <ArrowDown size={16} />
            </span>
            {d.scroll}
          </a>
          <div className="hero-coordinate">
            <span>RG—001</span>
            <span>{d.heroCaption}</span>
          </div>
        </div>
        <div className="hero-side">{d.heroSide}</div>
      </section>
      <div className="ticker" aria-hidden="true">
        <div>
          {[0, 1].map((n) => (
            <span key={n}>
              {d.ticker1}
              <Plus />
              {d.ticker2}
              <Plus />
              {d.ticker3}
              <Plus />
              RACOTAGAMES
              <Plus />
            </span>
          ))}
        </div>
      </div>
      <section id="worlds" className="worlds-section container">
        <SectionHeading
          eyebrow={d.worldsEyebrow}
          title={d.worldsTitle}
          body={d.worldsBody}
          link={d.allGames}
          href={`/${lang}/games`}
        />
        {games && games.results.length > 0 ? (
          <div className="game-grid">
            {games.results.map((g) => (
              <GameCard key={g.id} game={g} lang={lang} />
            ))}
          </div>
        ) : (
          <>
            <div className="concept-grid">
              <Link
                href={`/${lang}/games`}
                className="concept-card portal-card"
              >
                <Image
                  src="/images/hero.webp"
                  alt={d.portalTitle}
                  fill
                  sizes="(max-width: 700px) 100vw, 60vw"
                />
                <span className="concept-label">
                  <i />
                  {d.concept} / 01
                </span>
                <div className="concept-card-content">
                  <div>
                    <p>{d.portalTag}</p>
                    <h3>{d.portalTitle}</h3>
                    <span>{d.portalBody}</span>
                  </div>
                  <span className="circle-arrow">
                    <MoveUpRight />
                  </span>
                </div>
              </Link>
              <Link
                href={`/${lang}/games`}
                className="concept-card island-card"
              >
                <Image
                  src="/images/island.webp"
                  alt={d.islandTitle}
                  fill
                  sizes="(max-width: 700px) 100vw, 40vw"
                />
                <span className="concept-label">
                  <i />
                  {d.concept} / 02
                </span>
                <div className="concept-card-content">
                  <div>
                    <p>{d.islandTag}</p>
                    <h3>{d.islandTitle}</h3>
                    <span>{d.islandBody}</span>
                  </div>
                  <span className="circle-arrow">
                    <MoveUpRight />
                  </span>
                </div>
              </Link>
            </div>
            <p className="concept-disclaimer">
              <Plus size={12} />
              {d.conceptNote}
            </p>
          </>
        )}
      </section>
      <section className="studio-section">
        <div className="container studio-layout">
          <div className="studio-art">
            <div className="studio-art-grid" />
            <Image
              src="/images/logo.webp"
              width={400}
              height={400}
              alt="RacotaGames"
            />
            <span className="studio-art-label">{d.studioArt}</span>
            <span className="art-corner tl">+</span>
            <span className="art-corner br">+</span>
            <div className="orbit-ring" />
          </div>
          <div className="studio-copy">
            <p className="eyebrow">
              <i />
              {d.studioEyebrow}
            </p>
            <h2>{copy.home_studio?.title || d.studioTitle}</h2>
            <p>{copy.home_studio?.body || d.studioBody}</p>
            <Link className="text-link" href={`/${lang}/about`}>
              {d.studioLink}
              <ArrowUpRight size={18} />
            </Link>
            <div className="studio-values">
              {[
                [Sparkles, d.value1],
                [Gamepad2, d.value2],
                [Users, d.value3],
              ].map(([Icon, label], i) => {
                const I = Icon as typeof Sparkles;
                return (
                  <div key={i}>
                    <I size={20} />
                    <span>{label as string}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
      <section className="journal-section container">
        <SectionHeading
          eyebrow={d.newsEyebrow}
          title={d.newsTitle}
          link={d.allNews}
          href={`/${lang}/news`}
        />
        <div className="journal">
          <div className="journal-masthead">
            <span>RG / RACOTAGAMES</span>
            <strong>{d.dispatch}</strong>
            <span>{d.journalSlogan}</span>
          </div>
          {news?.results.length ? (
            <div className="news-grid">
              {news.results.map((n) => (
                <NewsCard key={n.id} article={n} lang={lang} />
              ))}
            </div>
          ) : (
            <EmptyState news title={d.newsEmpty} body={d.newsEmptyBody} />
          )}
          <div className="journal-bottom">
            <span>{d.journalBottom}</span>
            <Plus size={14} />
          </div>
        </div>
      </section>
      <CTA lang={lang} />
    </>
  );
}
