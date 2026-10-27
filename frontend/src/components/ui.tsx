import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  ArrowRight,
  Gamepad2,
  Newspaper,
  MoveUpRight,
} from "lucide-react";
import { Locale, dictionaries } from "@/lib/i18n";
import { Game, News, media, price, date } from "@/lib/api";
export function ButtonLink({
  href,
  children,
  secondary = false,
}: {
  href: string;
  children: React.ReactNode;
  secondary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`button ${secondary ? "button-secondary" : ""}`}
    >
      {children}
      <ArrowUpRight size={17} />
    </Link>
  );
}
export function SectionHeading({
  eyebrow,
  title,
  body,
  link,
  href,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  link?: string;
  href?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">
          <i />
          {eyebrow}
        </p>
        <h2>{title}</h2>
        {body && <p className="section-description">{body}</p>}
      </div>
      {href && (
        <Link className="text-link" href={href}>
          {link}
          <ArrowUpRight size={18} />
        </Link>
      )}
    </div>
  );
}
export function EmptyState({
  title,
  body,
  href,
  label,
  news = false,
}: {
  title: string;
  body: string;
  href?: string;
  label?: string;
  news?: boolean;
}) {
  return (
    <div className={`empty-state ${news ? "paper-empty" : ""}`}>
      {news ? (
        <Newspaper size={32} strokeWidth={1} />
      ) : (
        <Gamepad2 size={38} strokeWidth={1} />
      )}
      <h3>{title}</h3>
      <p>{body}</p>
      {href && (
        <Link className="text-link" href={href}>
          {label}
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}
export function GameCard({ game, lang }: { game: Game; lang: Locale }) {
  const d = dictionaries[lang];
  return (
    <article className="game-card">
      <Link href={`/${lang}/games/${game.slug}`} className="game-card-art">
        <Image
          src={media(game.cover)}
          alt={game.title}
          fill
          sizes="(max-width: 650px) 100vw, (max-width: 1000px) 50vw, 33vw"
        />
        <span className="game-status">
          <i />
          {d[game.status]}
        </span>
        <span className="card-explore">
          <MoveUpRight size={27} />
        </span>
        <div className="scan-line" />
      </Link>
      <div className="game-card-meta">
        <span>{game.genres.map((g) => g.name).join(" / ")}</span>
        <span>{game.platforms.map((g) => g.name).join(" · ")}</span>
      </div>
      <div className="game-card-title">
        <h3>
          <Link href={`/${lang}/games/${game.slug}`}>{game.title}</Link>
        </h3>
        <strong>{price(game, lang, d.free)}</strong>
      </div>
      <p>{game.excerpt}</p>
    </article>
  );
}
export function NewsCard({ article, lang }: { article: News; lang: Locale }) {
  const d = dictionaries[lang];
  return (
    <article className="news-card">
      <Link href={`/${lang}/news/${article.slug}`} className="news-image">
        <Image
          src={media(article.cover)}
          fill
          sizes="(max-width: 650px) 100vw, 33vw"
          alt={article.title}
        />
        <span className="paper-stamp">{d.dispatch}</span>
      </Link>
      <div className="news-meta">
        <span>{article.category?.name || d.dispatch}</span>
        <time dateTime={article.published_at}>
          {date(article.published_at, lang)}
        </time>
      </div>
      <h3>
        <Link href={`/${lang}/news/${article.slug}`}>{article.title}</Link>
      </h3>
      <p>{article.excerpt}</p>
      <Link
        href={`/${lang}/news/${article.slug}`}
        className="news-read"
        aria-label={article.title}
      >
        <ArrowUpRight size={23} />
      </Link>
    </article>
  );
}
export function CTA({ lang }: { lang: Locale }) {
  const d = dictionaries[lang];
  return (
    <section className="cta-section container">
      <div className="cta-orbit" />
      <p className="eyebrow">
        <i />
        {d.pressStart}
      </p>
      <div className="cta-content">
        <h2>{d.ctaTitle}</h2>
        <div>
          <p>{d.ctaBody}</p>
          <ButtonLink href={`/${lang}/demo`}>{d.request}</ButtonLink>
        </div>
      </div>
    </section>
  );
}
export function Prose({ text }: { text: string }) {
  return (
    <div className="prose">
      {text.split("\n\n").map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}
