"use client";
import { useParams } from "next/navigation";
import { dictionaries, isLocale } from "@/lib/i18n";
import { ButtonLink } from "@/components/ui";
export default function NotFound() {
  const params = useParams();
  const locale =
      typeof params.locale === "string" && isLocale(params.locale)
        ? params.locale
        : "az",
    d = dictionaries[locale];
  return (
    <section className="container not-found">
      <span>404 / RACOTAGAMES</span>
      <h1>{d.notFound}</h1>
      <p>{d.notFoundBody}</p>
      <ButtonLink href={`/${locale}`}>{d.homeBack}</ButtonLink>
    </section>
  );
}
