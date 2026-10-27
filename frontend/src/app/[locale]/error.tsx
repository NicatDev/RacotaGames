"use client";
import { useParams } from "next/navigation";
import { dictionaries, isLocale } from "@/lib/i18n";
export default function ErrorPage({ reset }: { reset: () => void }) {
  const params = useParams();
  const lang =
    typeof params.locale === "string" && isLocale(params.locale)
      ? params.locale
      : "az";
  const d = dictionaries[lang];
  return (
    <section className="container not-found">
      <h1>{d.unavailable}</h1>
      <p>{d.unavailableBody}</p>
      <button className="button" onClick={reset}>
        {d.retry}
      </button>
    </section>
  );
}
