"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ArrowUp,
  Menu,
  X,
  Globe,
  UserRound,
  LogOut,
} from "lucide-react";
import { dictionaries, Locale, locales } from "@/lib/i18n";
export function Header({ lang }: { lang: Locale }) {
  const d = dictionaries[lang],
    pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<string | null>(null);
  useEffect(() => {
    setOpen(false);
    fetch("/api/backend/auth/session/")
      .then((r) => r.json())
      .then((r) => setUser(r.user?.username || null))
      .catch(() => {});
  }, [pathname]);
  async function logout() {
    const session = await fetch("/api/backend/auth/session/").then((r) =>
      r.json(),
    );
    const r = await fetch("/api/backend/auth/logout/", {
      method: "POST",
      headers: { "X-CSRFToken": session.csrfToken },
    });
    if (r.ok) setUser(null);
  }
  const links = [
    ["", d.home],
    ["/games", d.games],
    ["/news", d.news],
    ["/about", d.about],
  ] as const;
  return (
    <header className="header">
      <div className="header-inner">
        <Link href={`/${lang}`} className="brand" aria-label="RacotaGames">
          <Image
            src="/images/logo.webp"
            width={48}
            height={48}
            alt=""
            priority
          />
          <span>
            RACOTA<span className="brand-light">GAMES</span>
            <small>{d.brandTagline}</small>
          </span>
        </Link>
        <nav className="desktop-nav" aria-label={d.menu}>
          {links.map(([url, label]) => (
            <Link
              key={url}
              href={`/${lang}${url}`}
              className={
                (
                  url
                    ? pathname.startsWith(`/${lang}${url}`)
                    : pathname === `/${lang}`
                )
                  ? "active"
                  : ""
              }
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <div className="language-picker">
            <Globe size={14} />
            <label className="sr-only" htmlFor="language">
              {d.language}
            </label>
            <select
              id="language"
              value={lang}
              onChange={(e) => {
                location.href =
                  pathname.replace(/^\/(az|en|ru)/, `/${e.target.value}`) +
                  location.search;
              }}
            >
              {locales.map((l) => (
                <option value={l} key={l}>
                  {l.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          {user ? (
            <button
              className="login-link"
              aria-label={d.logout}
              onClick={logout}
              title={user}
            >
              <LogOut size={15} />
              <span>{d.logout}</span>
            </button>
          ) : (
            <Link
              className="login-link"
              aria-label={d.login}
              href={`/${lang}/login`}
            >
              <UserRound size={15} />
              <span>{d.login}</span>
              <ArrowUpRight size={15} />
            </Link>
          )}
          <button
            className="mobile-toggle"
            aria-label={open ? d.close : d.menu}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" className="mobile-nav" aria-label={d.menu}>
          {links.map(([url, label]) => (
            <Link key={url} href={`/${lang}${url}`}>
              {label}
              <ArrowUpRight size={18} />
            </Link>
          ))}
          {user ? (
            <button className="mobile-logout" onClick={logout}>
              {d.logout}
              <LogOut size={18} />
            </button>
          ) : (
            <Link href={`/${lang}/login`}>
              {d.login}
              <UserRound size={18} />
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
export function Footer({ lang }: { lang: Locale }) {
  const d = dictionaries[lang];
  return (
    <footer>
      <div className="footer-main container">
        <Link href={`/${lang}`} className="brand">
          <Image src="/images/logo.webp" width={46} height={46} alt="" />
          <span>
            RACOTA<span className="brand-light">GAMES</span>
            <small>{d.footerLine}</small>
          </span>
        </Link>
        <nav aria-label={d.menu}>
          <Link href={`/${lang}/games`}>{d.games}</Link>
          <Link href={`/${lang}/news`}>{d.news}</Link>
          <Link href={`/${lang}/about`}>{d.about}</Link>
          <Link href={`/${lang}/demo`}>
            {d.request}
            <ArrowUpRight size={14} />
          </Link>
        </nav>
        <a href="#main" className="to-top" aria-label={d.backTop}>
          <ArrowUp size={18} />
        </a>
      </div>
      <div className="footer-bottom container">
        <span>
          © {new Date().getUTCFullYear()} RacotaGames. {d.rights}
        </span>
        <Link href={`/${lang}/privacy`}>{d.privacy}</Link>
        <a href="mailto:info@racotagames.com">info@racotagames.com</a>
        <span className="footer-signal">
          <i /> {d.footerSignal}
        </span>
      </div>
    </footer>
  );
}
