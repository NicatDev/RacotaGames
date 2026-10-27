import type { MetadataRoute } from "next";
import { api, Paginated, Content } from "@/lib/api";
import { locales } from "@/lib/i18n";
import { siteUrl } from "@/lib/seo";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rows: MetadataRoute.Sitemap = [];
  function add(path: string, updated?: string) {
    for (const l of locales)
      rows.push({
        url: `${siteUrl}/${l}${path}`,
        lastModified: updated ? new Date(updated) : undefined,
        alternates: {
          languages: Object.fromEntries(
            locales.map((k) => [k, `${siteUrl}/${k}${path}`]),
          ),
        },
      });
  }
  for (const p of ["", "/games", "/news", "/about", "/privacy"]) add(p);
  for (const kind of ["games", "news"]) {
    let page = 1;
    while (true) {
      const data = await api<Paginated<Content>>(`${kind}/`, "az", {
        page_size: "24",
        page: String(page),
      });
      if (!data)
        throw new Error("Content service unavailable; retry sitemap later");
      for (const item of data.results)
        add(`/${kind}/${item.slug}`, item.updated_at);
      if (!data.next) break;
      page++;
    }
  }
  return rows;
}
