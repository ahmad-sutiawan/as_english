"use client";

import { useState } from "react";
import Link from "next/link";
import { lobbyCard } from "@/components/lobby-frame";
import { ThemeSearch, themeMatches } from "@/components/theme-search";

type ModuleCard = {
  id: string;
  titleId: string;
  description: string;
  itemCount: number;
};

export function GuideModuleList({ modules }: { modules: ModuleCard[] }) {
  const [query, setQuery] = useState("");
  const visible = modules.filter((mod) =>
    themeMatches(query, [mod.titleId, mod.description, mod.id]),
  );

  return (
    <>
      <ThemeSearch
        value={query}
        onChange={setQuery}
        shown={visible.length}
        total={modules.length}
      />
      {visible.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--muted)]">
          Tidak ada tema yang cocok dengan pencarian itu.
        </p>
      ) : (
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {visible.map((mod) => (
            <li key={mod.id}>
              <Link href={`/learn/${mod.id}`} className={`${lobbyCard} h-full`}>
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-display text-2xl text-[var(--ink)]">{mod.titleId}</span>
                  <span className="shrink-0 text-xs text-[var(--accent)]">{mod.itemCount} soal</span>
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-[var(--muted)]">
                  {mod.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
