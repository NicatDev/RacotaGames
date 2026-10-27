import Image from "next/image";
import { Sparkles, Gamepad2, Users, ArrowDownRight } from "lucide-react";
import { notFound } from "next/navigation";
import { isLocale, dictionaries } from "@/lib/i18n";
import { siteCopy } from "@/lib/api";
import { sectionSEO } from "@/lib/seo";
import { CTA, Prose } from "@/components/ui";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return isLocale(locale) ? sectionSEO(locale, "about") : {};
}
export default async function About({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: lang } = await params;
  if (!isLocale(lang)) notFound();
  const d = dictionaries[lang],
    copy = await siteCopy(lang);
  return (
    <>
      <section className="page-intro container">
        <p className="eyebrow">
          <i />
          RACOTAGAMES / {d.about}
        </p>
        <h1>
          {(copy.about_intro?.title || d.aboutIntro).replace(/[.]+$/, "")}
          <span className="heading-dot">.</span>
        </h1>
        <div className="intro-bottom">
          <p>{copy.about_intro?.body || d.aboutDescription}</p>
          <ArrowDownRight size={50} strokeWidth={1} />
        </div>
      </section>
      <div className="about-panorama">
        <Image
          src="/images/island.webp"
          alt={d.islandTitle}
          fill
          sizes="100vw"
          priority
        />
        <div className="container">
          <span>{d.concept}</span>
          <span>{d.heroNote}</span>
        </div>
      </div>
      <section className="container story-section">
        <p className="eyebrow">
          <i />
          01 / {d.about}
        </p>
        <div>
          <h2>{copy.about_story?.title || d.aboutStoryTitle}</h2>
          <Prose text={copy.about_story?.body || d.aboutStory} />
        </div>
      </section>
      <section className="principles container">
        <p className="eyebrow">
          <i />
          {d.principles}
        </p>
        <h2>{d.principlesTitle}</h2>
        <div className="principles-grid">
          {[
            [Sparkles, d.value1, d.value1Body],
            [Gamepad2, d.value2, d.value2Body],
            [Users, d.value3, d.value3Body],
          ].map(([Icon, title, body], i) => {
            const I = Icon as typeof Sparkles;
            return (
              <article key={i}>
                <span className="principle-number">0{i + 1}</span>
                <I size={32} />
                <h3>{title as string}</h3>
                <p>{body as string}</p>
              </article>
            );
          })}
        </div>
      </section>
      <CTA lang={lang} />
    </>
  );
}
