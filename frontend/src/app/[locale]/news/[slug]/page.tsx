import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { detail, News, media, date } from "@/lib/api";
import { isLocale, dictionaries } from "@/lib/i18n";
import { seo, jsonLD, siteUrl } from "@/lib/seo";
import { Prose } from "@/components/ui";
type Props = { params: Promise<{ locale: string; slug: string }> };
export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const n = await detail<News>(`news/${encodeURIComponent(slug)}/`, locale);
  return n
    ? {
        ...seo(
          locale,
          `/news/${slug}`,
          n.seo_title || n.title + " | RacotaGames",
          n.seo_description || n.excerpt,
          media(n.cover),
        ),
        openGraph: {
          ...seo(locale, `/news/${slug}`, n.title, n.excerpt, media(n.cover))
            .openGraph,
          type: "article",
          publishedTime: n.published_at,
          modifiedTime: n.updated_at,
        },
      }
    : { robots: { index: false } };
}
export default async function NewsDetail({ params }: Props) {
  const { locale: lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const n = await detail<News>(`news/${encodeURIComponent(slug)}/`, lang);
  if (!n) notFound();
  const d = dictionaries[lang];
  return (
    <article className="container article-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLD({
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            headline: n.title,
            description: n.excerpt,
            datePublished: n.published_at,
            dateModified: n.updated_at,
            image: new URL(media(n.cover), siteUrl).href,
            author: {
              "@type": "Organization",
              name: "RacotaGames",
              url: siteUrl,
            },
            publisher: {
              "@type": "Organization",
              name: "RacotaGames",
              logo: {
                "@type": "ImageObject",
                url: `${siteUrl}/images/logo.webp`,
              },
            },
          }),
        }}
      />
      <Link className="text-link" href={`/${lang}/news`}>
        <ArrowLeft size={16} />
        {d.backNews}
      </Link>
      <header className="article-heading">
        <p className="eyebrow">
          <i />
          {n.category?.name || d.dispatch}
        </p>
        <h1>{n.title}</h1>
        <p>{n.excerpt}</p>
        <time dateTime={n.published_at}>{date(n.published_at, lang)}</time>
      </header>
      <div className="article-cover">
        <Image
          src={media(n.cover)}
          alt={n.title}
          width={1400}
          height={850}
          priority
          sizes="(max-width: 1100px) 100vw, 1100px"
        />
      </div>
      <Prose text={n.body} />
    </article>
  );
}
