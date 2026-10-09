"use client";

import { useState } from "react";
import Link from "next/link";
import { lobbyCard } from "@/components/lobby-frame";
import { ThemeSearch, themeMatches } from "@/components/theme-search";

type Row = {
  key: string;
  href: string;
  moduleTitleId: string;
  prompt: string;
  promptId: string;
  reasonId: string;
  wrongCount: number;
};

export function ReviewQueueList({ items }: { items: Row[] }) {
  const [query, setQuery] = useState("");
  const visible = items.filter((item) =>
    themeMatches(query, [item.moduleTitleId, item.prompt, item.promptId, item.reasonId]),
  );

  return (
    <>
      <ThemeSearch
        value={query}
        onChange={setQuery}
        shown={visible.length}
        total={items.length}
      />
      {visible.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--muted)]">
          Tidak ada tema yang cocok dengan pencarian itu.
        </p>
      ) : (
        <ol className="mt-4 grid gap-3">
          {visible.map((item, idx) => (
            <li key={item.key}>
              <Link href={item.href} className={lobbyCard}>
                <span className="flex items-start justify-between gap-4">
                  <span className="min-w-0">
                    <span className="text-xs uppercase tracking-[0.16em] text-[var(--accent)]">
                      {String(idx + 1).padStart(2, "0")} · {item.moduleTitleId}
                    </span>
                    <span className="mt-2 block text-base text-[var(--ink)]">{item.prompt}</span>
                    <span className="mt-1 block text-sm text-[var(--muted)]">{item.promptId}</span>
                    <span className="mt-3 block text-xs text-[var(--accent)]">
                      {item.reasonId}
                      {item.wrongCount > 0 ? ` · salah ${item.wrongCount}x` : ""}
                    </span>
                  </span>
                  <span className="inline-flex h-10 shrink-0 items-center rounded-full border border-[var(--border)] px-4 text-sm text-[var(--ink)] group-hover:border-[var(--accent)] group-hover:text-[var(--accent)]">
                    Latih
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
