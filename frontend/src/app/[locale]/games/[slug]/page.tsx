import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Play } from "lucide-react";
import { detail, Game, media, price, date } from "@/lib/api";
import { isLocale, dictionaries } from "@/lib/i18n";
import { seo, jsonLD, siteUrl } from "@/lib/seo";
import { ButtonLink, Prose } from "@/components/ui";
type Props = { params: Promise<{ locale: string; slug: string }> };
export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const g = await detail<Game>(`games/${encodeURIComponent(slug)}/`, locale);
  return g
    ? seo(
        locale,
        `/games/${slug}`,
        g.seo_title || g.title + " | RacotaGames",
        g.seo_description || g.excerpt,
        media(g.cover),
      )
    : { robots: { index: false } };
}
export default async function GameDetail({ params }: Props) {
  const { locale: lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const game = await detail<Game>(`games/${encodeURIComponent(slug)}/`, lang);
  if (!game) notFound();
  const d = dictionaries[lang];
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLD({
            "@context": "https://schema.org",
            "@type": "VideoGame",
            name: game.title,
            description: game.excerpt,
            image: `${siteUrl}${media(game.cover)}`,
            gamePlatform: game.platforms.map((p) => p.name),
            genre: game.genres.map((g) => g.name),
            ...(game.status === "released"
              ? {
                  offers: {
                    "@type": "Offer",
                    price: game.price,
                    priceCurrency: game.currency,
                    url: `${siteUrl}/${lang}/games/${slug}`,
                  },
                }
              : {}),
          }),
        }}
      />
      <section className="detail-hero">
        <Image
          src={media(game.cover)}
          alt={game.title}
          fill
          priority
          sizes="100vw"
        />
        <div className="detail-hero-shade" />
        <div className="container">
          <Link className="text-link" href={`/${lang}/games`}>
            <ArrowLeft size={16} />
            {d.backGames}
          </Link>
          <span className="game-status">
            <i />
            {d[game.status]}
          </span>
          <h1>{game.title}</h1>
          <p>{game.excerpt}</p>
        </div>
      </section>
      <section className="container game-detail-layout">
        <div>
          <p className="eyebrow">
            <i />
            {d.about}
          </p>
          <Prose text={game.body} />
          {game.gallery.length > 0 && (
            <>
              <h2 className="gallery-heading">{d.gallery}</h2>
              <div className="gallery-grid">
                {game.gallery.map((img, i) => (
                  <a
                    key={i}
                    href={media(img.image)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Image
                      src={media(img.image)}
                      width={900}
                      height={600}
                      sizes="(max-width: 700px) 100vw, 33vw"
                      alt={img.alt}
                    />
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
        <aside className="game-info">
          <div className="game-price">
            <span>{d.price}</span>
            <strong>{price(game, lang, d.free)}</strong>
          </div>
          <dl>
            <dt>{d.genre}</dt>
            <dd>{game.genres.map((g) => g.name).join(", ") || "—"}</dd>
            <dt>{d.platform}</dt>
            <dd>{game.platforms.map((p) => p.name).join(", ") || "—"}</dd>
            <dt>{d.release}</dt>
            <dd>{game.release_date ? date(game.release_date, lang) : d.tba}</dd>
          </dl>
          {game.demo_enabled && (
            <ButtonLink href={`/${lang}/demo?game=${game.slug}`}>
              {d.request}
            </ButtonLink>
          )}
          {game.trailer_url && (
            <a
              href={game.trailer_url}
              target="_blank"
              rel="noreferrer"
              className="text-link"
            >
              <Play size={16} />
              {d.trailer}
            </a>
          )}
        </aside>
      </section>
    </>
  );
}
