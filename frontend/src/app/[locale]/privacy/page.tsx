import { notFound } from "next/navigation";
import { dictionaries, isLocale } from "@/lib/i18n";
import { seo } from "@/lib/seo";
import { Prose } from "@/components/ui";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return isLocale(locale)
    ? seo(
        locale,
        "/privacy",
        dictionaries[locale].privacy + " | RacotaGames",
        dictionaries[locale].privacyTitle,
      )
    : {};
}
export default async function Privacy({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: lang } = await params;
  if (!isLocale(lang)) notFound();
  const d = dictionaries[lang];
  return (
    <section className="container privacy-page">
      <p className="eyebrow">
        <i />
        RACOTAGAMES
      </p>
      <h1>{d.privacyTitle}</h1>
      <Prose text={d.privacyBody} />
    </section>
  );
}
