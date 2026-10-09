"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Difficulty, DifficultyMix, ModuleMeta } from "@/types/content";
import {
  DIFFICULTY_LABEL_ID,
  DIFFICULTY_ORDER,
} from "@/types/content";
import { ThemeSearch, themeMatches } from "@/components/theme-search";

type ProgressMap = Record<string, { done: number }>;

type SortKey =
  | "level-asc"
  | "level-desc"
  | "name"
  | "progress-desc"
  | "progress-asc";

type Props = {
  modules: ModuleMeta[];
  progressByModule: ProgressMap;
};

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "level-asc", label: "Level dominan: Pemula → Senior" },
  { value: "level-desc", label: "Level dominan: Senior → Pemula" },
  { value: "name", label: "Nama A–Z" },
  { value: "progress-desc", label: "Progres tertinggi" },
  { value: "progress-asc", label: "Progres terendah" },
];

const FILTERS: { value: "all" | Difficulty; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "junior", label: "Punya Pemula" },
  { value: "mid", label: "Punya Menengah" },
  { value: "senior", label: "Punya Senior" },
];

function formatMix(mix?: DifficultyMix): string {
  if (!mix) return "";
  const parts: string[] = [];
  if (mix.junior) parts.push(`Pemula ${mix.junior}`);
  if (mix.mid) parts.push(`Menengah ${mix.mid}`);
  if (mix.senior) parts.push(`Senior ${mix.senior}`);
  return parts.join(" · ");
}

export function ModuleCatalog({ modules, progressByModule }: Props) {
  const [sort, setSort] = useState<SortKey>("level-asc");
  const [filter, setFilter] = useState<"all" | Difficulty>("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    let list = modules.filter((m) => m.status === "ready");
    list = list.filter((m) =>
      themeMatches(query, [m.titleId, m.title, m.description, m.id]),
    );
    if (filter !== "all") {
      // "has items of this level" — not "module dominant level equals"
      list = list.filter((m) => (m.levelMix?.[filter] ?? 0) > 0);
    }

    const withProgress = list.map((m) => ({
      mod: m,
      done: progressByModule[m.id]?.done ?? 0,
      pct:
        m.itemCount > 0
          ? (progressByModule[m.id]?.done ?? 0) / m.itemCount
          : 0,
      level: m.level ?? "mid",
    }));

    withProgress.sort((a, b) => {
      switch (sort) {
        case "level-asc":
          return (
            DIFFICULTY_ORDER[a.level] - DIFFICULTY_ORDER[b.level] ||
            a.mod.titleId.localeCompare(b.mod.titleId)
          );
        case "level-desc":
          return (
            DIFFICULTY_ORDER[b.level] - DIFFICULTY_ORDER[a.level] ||
            a.mod.titleId.localeCompare(b.mod.titleId)
          );
        case "name":
          return a.mod.titleId.localeCompare(b.mod.titleId);
        case "progress-desc":
          return b.pct - a.pct || a.mod.titleId.localeCompare(b.mod.titleId);
        case "progress-asc":
          return a.pct - b.pct || a.mod.titleId.localeCompare(b.mod.titleId);
        default:
          return 0;
      }
    });

    return withProgress;
  }, [modules, progressByModule, sort, filter, query]);

  return (
    <section className="mt-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
            Semua modul
          </h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Filter = modul yang punya soal level itu. Badge = level dominan +
            mix soal.
          </p>
        </div>
        <label className="block text-xs text-[var(--muted)]">
          Urutkan
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="mt-1 block w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] outline-none ring-[var(--accent)] focus:ring-2 sm:w-64"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ThemeSearch
        value={query}
        onChange={setQuery}
        shown={visible.length}
        total={modules.filter((m) => m.status === "ready").length}
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--muted)]">
          Tidak ada tema yang cocok dengan pencarian atau filter level ini.
        </p>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {visible.map(({ mod, done, pct }) => {
            const level = mod.level ?? "mid";
            const pctLabel = Math.round(pct * 100);
            const mixLabel = formatMix(mod.levelMix);
            const deepLink =
              filter === "all"
                ? `/learn/${mod.id}`
                : `/learn/${mod.id}?level=${filter}`;

            return (
              <li
                key={mod.id}
                className="border-b border-[var(--border)] pb-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded border border-[var(--border)] bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent)]">
                        Dominan: {DIFFICULTY_LABEL_ID[level]}
                      </span>
                      <span className="text-xs uppercase tracking-wide text-[var(--muted)]">
                        Siap dilatih
                      </span>
                    </div>
                    {mixLabel ? (
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        Mix: {mixLabel}
                      </p>
                    ) : null}
                    <h3 className="mt-1 text-lg font-semibold text-[var(--ink)]">
                      {mod.titleId}
                    </h3>
                    <p className="text-xs text-[var(--muted)]">{mod.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
                      {mod.description}
                    </p>
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      Progres: {done}/{mod.itemCount} ({pctLabel}%)
                    </p>
                  </div>
                  <Link
                    href={deepLink}
                    className="shrink-0 rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-[#06221e] hover:bg-[var(--accent-hover)]"
                  >
                    {done > 0 ? "Lanjut" : "Mulai"}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
