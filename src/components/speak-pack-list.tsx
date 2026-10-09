"use client";

import { useState } from "react";
import { ThemeSearch, themeMatches } from "@/components/theme-search";

type Pack = {
  id: string;
  title: string;
  titleId: string;
  itemCount: number;
};

export function SpeakPackList({ packs }: { packs: Pack[] }) {
  const [query, setQuery] = useState("");
  const visible = packs.filter((pack) =>
    themeMatches(query, [pack.titleId, pack.title, pack.id]),
  );

  return (
    <>
      <ThemeSearch
        value={query}
        onChange={setQuery}
        shown={visible.length}
        total={packs.length}
      />
      {visible.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--muted)]">
          Tidak ada tema yang cocok dengan pencarian itu.
        </p>
      ) : (
        <ul className="mt-4 flex flex-wrap gap-2">
          {visible.map((pack) => (
            <li
              key={pack.id}
              className="rounded-full border border-[var(--border)] bg-[var(--surface)]/70 px-3 py-1.5 text-xs text-[var(--muted)]"
            >
              <span className="text-[var(--ink)]">{pack.titleId}</span>
              <span className="ml-2 text-[var(--accent)]">{pack.itemCount}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
