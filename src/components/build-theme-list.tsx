"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { lobbyCard } from "@/components/lobby-frame";
import { ThemeSearch, themeMatches } from "@/components/theme-search";

type ThemeCard = {
  id: string;
  titleId: string;
  description: string;
  count: number;
};

export function BuildThemeList({
  featured,
  themes,
  locked,
}: {
  featured: ThemeCard;
  themes: ThemeCard[];
  locked: boolean;
}) {
  const [query, setQuery] = useState("");
  const all = useMemo(() => [featured, ...themes], [featured, themes]);
  const visible = all.filter((theme) =>
    themeMatches(query, [theme.titleId, theme.description, theme.id]),
  );
  const featuredVisible = visible.some((theme) => theme.id === featured.id);
  const rest = visible.filter((theme) => theme.id !== featured.id);

  return (
    <>
      <ThemeSearch
        value={query}
        onChange={setQuery}
        shown={visible.length}
        total={all.length}
      />
      {visible.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--muted)]">
          Tidak ada tema yang cocok dengan pencarian itu.
        </p>
      ) : null}
      {featuredVisible ? (
        <Link
          href={
            locked && featured.id !== "dasar"
              ? "/placement"
              : `/build/play?theme=${featured.id}`
          }
          className={`${lobbyCard} mt-4 bg-[var(--accent-soft)] sm:flex-row sm:items-center sm:justify-between`}
        >
          <span>
            <span className="block font-display text-3xl text-[var(--ink)]">
              {featured.titleId}
            </span>
            <span className="mt-2 block max-w-xl text-sm leading-relaxed text-[var(--muted)]">
              {featured.description}
            </span>
          </span>
          <span className="mt-4 inline-flex h-10 items-center rounded-full bg-[var(--accent)] px-4 text-sm font-medium text-[#06221e] sm:mt-0">
            {featured.count} pola
          </span>
        </Link>
      ) : null}
      <ul className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rest.map((theme) => (
          <li key={theme.id}>
            {locked && theme.id !== "dasar" ? (
              <div className={`${lobbyCard} h-full opacity-60`}>
                <span className="font-display text-2xl text-[var(--ink)]">{theme.titleId}</span>
                <span className="mt-2 block text-sm text-[var(--muted)]">
                  Terkunci sampai penempatan dasar lulus.
                </span>
              </div>
            ) : (
              <Link href={`/build/play?theme=${theme.id}`} className={`${lobbyCard} h-full`}>
                <span className="flex items-start justify-between gap-3">
                  <span className="font-display text-2xl text-[var(--ink)]">{theme.titleId}</span>
                  <span className="text-sm font-medium text-[var(--accent)]">{theme.count}</span>
                </span>
                <span className="mt-2 block flex-1 text-sm leading-relaxed text-[var(--muted)]">
                  {theme.description}
                </span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
