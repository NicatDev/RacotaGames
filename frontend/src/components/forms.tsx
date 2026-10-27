"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, LoaderCircle, ArrowRight } from "lucide-react";
import { dictionaries, Locale } from "@/lib/i18n";
async function csrf() {
  const r = await fetch("/api/backend/auth/session/");
  if (!r.ok) throw new Error();
  return (await r.json()).csrfToken as string;
}
export function DemoForm({
  lang,
  games,
  selected,
}: {
  lang: Locale;
  games: { id: number; slug: string; title: string }[];
  selected?: string;
}) {
  const d = dictionaries[lang];
  const [status, setStatus] = useState<
      "idle" | "pending" | "success" | "error"
    >("idle"),
    [error, setError] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) return;
    setStatus("pending");
    setError("");
    const data = new FormData(form);
    try {
      const token = await csrf();
      const game = data.get("game");
      const r = await fetch("/api/backend/demo-requests/", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRFToken": token },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          game: game ? Number(game) : null,
          message: data.get("message"),
          consent: data.get("consent") === "on",
          language: lang,
          website: data.get("website"),
        }),
      });
      if (!r.ok) {
        setError(r.status === 429 ? d.rateError : d.formError);
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch {
      setError(d.formError);
      setStatus("error");
    }
  }
  if (status === "success")
    return (
      <div className="form-success" role="status">
        <span>
          <Check size={35} />
        </span>
        <h2>{d.successTitle}</h2>
        <p>{d.successBody}</p>
        <Link className="text-link" href={`/${lang}/games`}>
          {d.games}
          <ArrowRight size={17} />
        </Link>
      </div>
    );
  return (
    <form className="studio-form" onSubmit={submit}>
      <div className="form-row">
        <label>
          {d.name}
          <input
            name="name"
            required
            minLength={2}
            maxLength={120}
            autoComplete="name"
            placeholder={d.name}
          />
        </label>
        <label>
          {d.email}
          <input
            type="email"
            name="email"
            required
            maxLength={254}
            autoComplete="email"
            placeholder="you@example.com"
          />
        </label>
      </div>
      <label>
        {d.selectGame}
        <select
          name="game"
          defaultValue={games.find((g) => g.slug === selected)?.id || ""}
        >
          <option value="">{d.general}</option>
          {games.map((g) => (
            <option value={g.id} key={g.id}>
              {g.title}
            </option>
          ))}
        </select>
      </label>
      <label>
        {d.message}
        <textarea
          name="message"
          required
          minLength={20}
          maxLength={5000}
          rows={6}
          placeholder={d.messageHint}
        />
      </label>
      <div className="honeypot" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label className="consent">
        <input type="checkbox" name="consent" required />
        <span>
          {d.consent} <Link href={`/${lang}/privacy`}>{d.privacy} ↗</Link>
        </span>
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="button" disabled={status === "pending"}>
        {status === "pending" ? d.sending : d.send}
        {status === "pending" ? (
          <LoaderCircle className="spin" size={17} />
        ) : (
          <ArrowUpRight size={17} />
        )}
      </button>
    </form>
  );
}
export function LoginForm({ lang }: { lang: Locale }) {
  const d = dictionaries[lang];
  const [pending, setPending] = useState(false),
    [error, setError] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setPending(true);
    setError("");
    try {
      const token = await csrf();
      const r = await fetch("/api/backend/auth/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRFToken": token },
        body: JSON.stringify({
          username: data.get("username"),
          password: data.get("password"),
        }),
      });
      if (r.ok) {
        location.href = `/${lang}`;
        return;
      }
      setError(r.status === 429 ? d.rateError : d.loginError);
    } catch {
      setError(d.unavailable);
    }
    setPending(false);
  }
  return (
    <form className="studio-form" onSubmit={submit}>
      <label>
        {d.username}
        <input
          name="username"
          required
          autoComplete="username"
          maxLength={150}
        />
      </label>
      <label>
        {d.password}
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          maxLength={256}
        />
      </label>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <button type="submit" className="button" disabled={pending}>
        {pending ? (
          <LoaderCircle className="spin" size={17} />
        ) : (
          <>
            {d.login}
            <ArrowUpRight size={17} />
          </>
        )}
      </button>
      <p className="form-note">{d.loginNote}</p>
    </form>
  );
}
