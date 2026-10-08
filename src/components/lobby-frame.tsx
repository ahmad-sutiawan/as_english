import Link from "next/link";
import type { ReactNode } from "react";

const ring =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

export function LobbyFrame({
  kicker,
  title,
  lede,
  children,
}: {
  kicker: string;
  title: string;
  lede: string;
  children: ReactNode;
}) {
  return (
    <div className="dash-shell min-h-[calc(100vh-4rem)]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <Link
          href="/dashboard"
          className={`inline-flex h-10 items-center rounded-full border border-[var(--border)] bg-[var(--surface)]/70 px-4 text-sm text-[var(--muted)] hover:text-[var(--ink)] ${ring}`}
        >
          ← Dashboard
        </Link>
        <header className="dash-rise mt-8 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--accent)]">{kicker}</p>
          <h1 className="mt-3 font-display text-4xl tracking-tight text-[var(--ink)] sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[var(--muted)]">{lede}</p>
        </header>
        <div className="dash-rise dash-rise-2 mt-8">{children}</div>
      </div>
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/70 px-4 py-4">
      <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 font-display text-3xl text-[var(--ink)]">{value}</p>
      {hint ? <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p> : null}
    </article>
  );
}

export const lobbyCard =
  "group flex flex-col rounded-3xl border border-[var(--border)] bg-[var(--surface)]/60 p-5 transition duration-300 hover:-translate-y-0.5 hover:border-[var(--accent)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";
