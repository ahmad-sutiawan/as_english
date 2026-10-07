"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Difficulty } from "@/types/content";
import {
  DIFFICULTY_LABEL_ID,
  DIFFICULTY_ORDER,
} from "@/types/content";

type ItemRow = {
  id: string;
  difficulty: Difficulty;
  prompt: string;
  promptId: string;
  promptStructure: string;
  done: boolean;
};

type Props = {
  moduleId: string;
  items: ItemRow[];
  initialLevel?: Difficulty | "all";
};

type SortKey = "level-asc" | "level-desc" | "default" | "todo-first";

const FILTERS: { value: "all" | Difficulty; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "junior", label: "Pemula" },
  { value: "mid", label: "Menengah" },
  { value: "senior", label: "Senior" },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "level-asc", label: "Level: Pemula → Senior" },
  { value: "level-desc", label: "Level: Senior → Pemula" },
  { value: "todo-first", label: "Belum dikuasai dulu" },
  { value: "default", label: "Urutan asli" },
];

export function ModuleItemList({
  moduleId,
  items,
  initialLevel = "all",
}: Props) {
  const [filter, setFilter] = useState<"all" | Difficulty>(initialLevel);
  const [sort, setSort] = useState<SortKey>(
    initialLevel === "all" ? "level-asc" : "todo-first",
  );

  const counts = useMemo(() => {
    const c = { junior: 0, mid: 0, senior: 0, done: 0 };
    for (const item of items) {
      c[item.difficulty] += 1;
      if (item.done) c.done += 1;
    }
    return c;
  }, [items]);

  const visible = useMemo(() => {
    let list = [...items];
    if (filter !== "all") {
      list = list.filter((i) => i.difficulty === filter);
    }

    list.sort((a, b) => {
      switch (sort) {
        case "level-asc":
          return (
            DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty] ||
            a.prompt.localeCompare(b.prompt)
          );
        case "level-desc":
          return (
            DIFFICULTY_ORDER[b.difficulty] - DIFFICULTY_ORDER[a.difficulty] ||
            a.prompt.localeCompare(b.prompt)
          );
        case "todo-first":
          return (
            Number(a.done) - Number(b.done) ||
            DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty]
          );
        default:
          return 0;
      }
    });

    // For "default", restore original order among filtered
    if (sort === "default") {
      const order = new Map(items.map((it, idx) => [it.id, idx]));
      list.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    }

    return list;
  }, [items, filter, sort]);

  const firstTodo = visible.find((i) => !i.done) ?? visible[0];

  return (
    <div className="mt-8">
      <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <p className="text-xs text-[var(--muted)]">
          Mix soal: Pemula {counts.junior} · Menengah {counts.mid} · Senior{" "}
          {counts.senior} · Dikuasai {counts.done}/{items.length}
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const active = filter === f.value;
              const count =
                f.value === "all"
                  ? items.length
                  : items.filter((i) => i.difficulty === f.value).length;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFilter(f.value)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  {f.label} ({count})
                </button>
              );
            })}
          </div>
          <label className="block text-xs text-[var(--muted)]">
            Urutkan
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="mt-1 block w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--ink)] outline-none ring-[var(--accent)] focus:ring-2 sm:w-56"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {firstTodo ? (
          <div className="mt-3">
            <Link
              href={`/learn/${moduleId}/${firstTodo.id}${
                filter !== "all" ? `?level=${filter}` : ""
              }`}
              className="inline-flex rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-[#06221e] hover:bg-[var(--accent-hover)]"
            >
              Lanjut dari sini ({DIFFICULTY_LABEL_ID[firstTodo.difficulty]})
            </Link>
          </div>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--muted)]">
          Tidak ada soal untuk filter level ini.
        </p>
      ) : (
        <ol className="mt-6 space-y-3">
          {visible.map((item, idx) => (
            <li key={item.id}>
              <Link
                href={`/learn/${moduleId}/${item.id}${
                  filter !== "all" ? `?level=${filter}` : ""
                }`}
                className="flex items-center justify-between gap-3 border-b border-[var(--border)] py-3 text-sm hover:bg-[var(--surface)]/60"
              >
                <span className="min-w-0">
                  <span className="text-[var(--ink)]">
                    <span className="mr-2 text-[var(--muted)]">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    {item.prompt.slice(0, 72)}
                    {item.prompt.length > 72 ? "…" : ""}
                  </span>
                  <span className="mt-1 block truncate text-xs text-[var(--muted)]">
                    {item.promptId}
                  </span>
                  <span className="mt-0.5 block truncate font-mono text-[10px] text-[var(--accent)]">
                    {item.promptStructure}
                  </span>
                </span>
                <span className="shrink-0 text-right text-xs uppercase tracking-wide text-[var(--muted)]">
                  <span className="block text-[var(--accent)]">
                    {DIFFICULTY_LABEL_ID[item.difficulty]}
                  </span>
                  {item.done ? "Dikuasai" : "Belum"}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

