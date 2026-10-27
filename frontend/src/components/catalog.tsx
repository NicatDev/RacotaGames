import Link from "next/link";
import { ArrowLeft, ArrowRight, Search, SlidersHorizontal } from "lucide-react";
import { dictionaries, Locale } from "@/lib/i18n";
import { api, Paginated, Game, News, Taxonomy } from "@/lib/api";
import { GameCard, NewsCard, EmptyState } from "./ui";
export type Query = Record<string, string | string[] | undefined>;
export function normalizeQuery(input: Query, kind: "games" | "news") {
  const query: Record<string, string> = {};
  for (const key of [
    "search",
    "page",
    "ordering",
    ...(kind === "games"
      ? ["genres__slug", "platforms__slug", "status"]
      : ["category__slug"]),
  ]) {
    const value = input[key];
    if (typeof value === "string") query[key] = value.slice(0, 200);
  }
  if (query.page && !/^\d+$/.test(query.page)) delete query.page;
  const allowed =
    kind === "games"
      ? ["-published_at", "published_at", "price", "-price"]
      : ["-published_at", "published_at"];
  if (query.ordering && !allowed.includes(query.ordering))
    delete query.ordering;
  return query;
}
export async function Catalog({
  kind,
  lang,
  query,
}: {
  kind: "games" | "news";
  lang: Locale;
  query: Record<string, string>;
}) {
  const d = dictionaries[lang],
    isGames = kind === "games";
  const [content, taxonomies] = await Promise.all([
    api<Paginated<Game | News>>(`${kind}/`, lang, query),
    api<Taxonomy[]>("taxonomies/", lang),
  ]);
  const filtered = Object.entries(query).some(
    ([k, v]) => v && k !== "page" && k !== "ordering",
  );
  function pageUrl(page: number) {
    const s = new URLSearchParams(query);
    s.set("page", String(page));
    return `/${lang}/${kind}?${s}`;
  }
  const current = Math.max(1, Number(query.page) || 1),
    pages = Math.ceil((content?.count || 0) / 6);
  return (
    <>
      <form className="catalog-filters" action={`/${lang}/${kind}`}>
        <div className="search-field">
          <Search size={17} />
          <label className="sr-only" htmlFor="search">
            {d.search}
          </label>
          <input
            type="search"
            id="search"
            name="search"
            placeholder={d.searchPlaceholder}
            defaultValue={query.search || ""}
            maxLength={200}
          />
        </div>
        {(isGames
          ? [
              ["genre", "genres__slug", "genre"],
              ["platform", "platforms__slug", "platform"],
            ]
          : [["category", "category__slug", "category"]]
        ).map(([kind, key, label]) => (
          <div className="select-field" key={key}>
            <label htmlFor={key}>
              {d[label as "genre" | "platform" | "category"]}
            </label>
            <select id={key} name={key} defaultValue={query[key] || ""}>
              <option value="">{d.all}</option>
              {taxonomies
                ?.filter((t) => t.kind === kind)
                .map((t) => (
                  <option value={t.slug} key={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>
          </div>
        ))}
        <div className="select-field">
          <label htmlFor="ordering">{d.order}</label>
          <select
            id="ordering"
            name="ordering"
            defaultValue={query.ordering || "-published_at"}
          >
            <option value="-published_at">{d.newest}</option>
            <option value="published_at">{d.oldest}</option>
            {isGames && (
              <>
                <option value="price">{d.priceLow}</option>
                <option value="-price">{d.priceHigh}</option>
              </>
            )}
          </select>
        </div>
        <button className="filter-apply" type="submit">
          <SlidersHorizontal size={17} />
          <span>{d.apply}</span>
        </button>
      </form>
      <div className="catalog-summary">
        <span>
          {content?.count ?? "—"} {d.results}
        </span>
        {filtered && <Link href={`/${lang}/${kind}`}>{d.reset} ×</Link>}
      </div>
      {!content ? (
        <EmptyState
          title={d.unavailable}
          body={d.unavailableBody}
          href={`/${lang}/${kind}`}
          label={d.retry}
        />
      ) : content.results.length === 0 ? (
        <EmptyState
          title={filtered ? d.noResults : isGames ? d.emptyGames : d.newsEmpty}
          body={
            filtered
              ? d.noResultsBody
              : isGames
                ? d.emptyGamesBody
                : d.newsEmptyBody
          }
          news={!isGames}
          href={filtered ? `/${lang}/${kind}` : undefined}
          label={d.reset}
        />
      ) : (
        <div className={isGames ? "game-grid" : "news-grid"}>
          {content.results.map((item) =>
            isGames ? (
              <GameCard key={item.id} game={item as Game} lang={lang} />
            ) : (
              <NewsCard key={item.id} article={item as News} lang={lang} />
            ),
          )}
        </div>
      )}
      {pages > 1 && (
        <nav className="pagination" aria-label={d.pagination}>
          {current > 1 ? (
            <Link href={pageUrl(current - 1)}>
              <ArrowLeft size={16} />
              {d.prev}
            </Link>
          ) : (
            <span aria-disabled="true">{d.prev}</span>
          )}
          <span>
            {d.page} {current} / {pages}
          </span>
          {current < pages ? (
            <Link href={pageUrl(current + 1)}>
              {d.next}
              <ArrowRight size={16} />
            </Link>
          ) : (
            <span aria-disabled="true">{d.next}</span>
          )}
        </nav>
      )}
    </>
  );
}
