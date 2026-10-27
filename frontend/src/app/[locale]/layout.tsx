import { notFound } from "next/navigation";
import { isLocale, dictionaries } from "@/lib/i18n";
import { Header, Footer } from "@/components/navigation";
import "../globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  applicationName: "RacotaGames",
  icons: { icon: "/favicon.svg" },
};
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = dictionaries[locale];
  return (
    <html lang={locale}>
      <body>
        <a href="#main" className="skip-link">
          {d.skip}
        </a>
        <Header lang={locale} />
        <main id="main">{children}</main>
        <Footer lang={locale} />
      </body>
    </html>
  );
}
