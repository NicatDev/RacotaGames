import Image from "next/image";
import { notFound } from "next/navigation";
import { dictionaries, isLocale } from "@/lib/i18n";
import { seo } from "@/lib/seo";
import { LoginForm } from "@/components/forms";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return isLocale(locale)
    ? {
        ...seo(
          locale,
          "/login",
          dictionaries[locale].login + " | RacotaGames",
          dictionaries[locale].loginBody,
        ),
        robots: { index: false, follow: false },
      }
    : {};
}
export default async function Login({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: lang } = await params;
  if (!isLocale(lang)) notFound();
  const d = dictionaries[lang];
  return (
    <section className="login-page">
      <div className="login-art">
        <Image src="/images/hero.webp" fill sizes="50vw" alt="" priority />
        <span>{d.loginArt}</span>
      </div>
      <div className="login-panel">
        <p className="eyebrow">
          <i />
          {d.playerAccess}
        </p>
        <h1>{d.loginTitle}</h1>
        <p>{d.loginBody}</p>
        <LoginForm lang={lang} />
      </div>
    </section>
  );
}
