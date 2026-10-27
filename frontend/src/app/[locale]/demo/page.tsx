import { notFound } from "next/navigation";
import { ArrowDownRight } from "lucide-react";
import { dictionaries, isLocale } from "@/lib/i18n";
import { seo } from "@/lib/seo";
import { api, Game, Paginated } from "@/lib/api";
import { DemoForm } from "@/components/forms";
type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ game?: string }>;
};
export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return isLocale(locale)
    ? {
        ...seo(
          locale,
          "/demo",
          dictionaries[locale].request + " | RacotaGames",
          dictionaries[locale].demoBody,
        ),
        robots: { index: false, follow: true },
      }
    : {};
}
export default async function Demo({ params, searchParams }: Props) {
  const { locale: lang } = await params;
  if (!isLocale(lang)) notFound();
  const d = dictionaries[lang],
    { game: selected } = await searchParams;
  const data = await api<Paginated<Game>>("games/", lang, { page_size: "24" });
  let games = data?.results.filter((g) => g.demo_enabled) || [];
  if (selected && !games.some((g) => g.slug === selected)) {
    const g = await api<Game>(`games/${encodeURIComponent(selected)}/`, lang);
    if (g?.demo_enabled) games = [g, ...games];
  }
  return (
    <section className="form-page container">
      <div className="form-page-intro">
        <p className="eyebrow">
          <i />
          RACOTAGAMES / DEMO
        </p>
        <h1>{d.demoTitle}</h1>
        <p>{d.demoBody}</p>
        <ArrowDownRight size={78} strokeWidth={1} />
      </div>
      <DemoForm lang={lang} games={games} selected={selected} />
    </section>
  );
}
