"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { lobbyCard } from "@/components/lobby-frame";

export type GovSearchParagraph = {
  id: string;
  kind: string;
  label: string;
  text: string;
};

export type GovCatalogCard = {
  id: string;
  slug: string;
  order: number;
  frameworkTag: string;
  title: string;
  subtitle: string;
  level: string;
  estimatedMinutes: number;
  questionCount: number;
  statusText: string;
  bestScore: number | null;
  paragraphs: GovSearchParagraph[];
};

const QUICK_KEYWORDS = [
  "IT Manager",
  "COBIT 2019",
  "EDM03",
  "Design Factors",
  "ITIL 4",
  "Change Enablement",
  "Watermelon SLA",
  "Bus Factor",
  "FinOps",
  "SOC 2",
  "AI Governance",
  "UU PDP",
] as const;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightText(text: string, phrase: string, tokens: string[]): ReactNode {
  const lower = text.toLowerCase();
  const terms = lower.includes(phrase) ? [phrase] : tokens;
  if (terms.length === 0) return text;

  const pattern = new RegExp(`(${terms.map(escapeRegex).join("|")})`, "gi");
  const parts = text.split(pattern);

  return parts.map((part, idx) =>
    idx % 2 === 1 ? (
      <mark
        key={idx}
        className="rounded bg-[var(--accent-soft)] px-1 py-0.5 font-medium text-[var(--accent)]"
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

type ParagraphHit = {
  key: string;
  moduleOrder: number;
  moduleSlug: string;
  moduleTitle: string;
  frameworkTag: string;
  kind: string;
  label: string;
  text: string;
};

export function GovModuleCatalog({ modules }: { modules: GovCatalogCard[] }) {
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase().replace(/\s+/g, " ");
  const tokens = useMemo(
    () => (normalizedQuery ? normalizedQuery.split(" ").filter(Boolean) : []),
    [normalizedQuery],
  );

  const paragraphHits = useMemo(() => {
    if (!normalizedQuery) return [] as ParagraphHit[];

    const exactHits: ParagraphHit[] = [];
    const allTokenHits: ParagraphHit[] = [];

    for (const mod of modules) {
      for (const item of mod.paragraphs) {
        const hay = `${item.label} ${item.text}`.toLowerCase();
        if (hay.includes(normalizedQuery)) {
          exactHits.push({
            key: `${mod.id}-${item.id}`,
            moduleOrder: mod.order,
            moduleSlug: mod.slug,
            moduleTitle: mod.title,
            frameworkTag: mod.frameworkTag,
            kind: item.kind,
            label: item.label,
            text: item.text,
          });
        } else if (tokens.length > 1 && tokens.every((token) => hay.includes(token))) {
          allTokenHits.push({
            key: `${mod.id}-${item.id}`,
            moduleOrder: mod.order,
            moduleSlug: mod.slug,
            moduleTitle: mod.title,
            frameworkTag: mod.frameworkTag,
            kind: item.kind,
            label: item.label,
            text: item.text,
          });
        }
      }
    }

    return exactHits.length > 0 ? exactHits : allTokenHits;
  }, [modules, normalizedQuery, tokens]);

  const matchedModuleCount = useMemo(
    () => new Set(paragraphHits.map((hit) => hit.moduleSlug)).size,
    [paragraphHits],
  );

  return (
    <section className="mt-8">
      <div>
        <h2 className="font-display text-3xl text-[var(--ink)]">
          Kurikulum {modules.length} Modul (SMB → Unicorn Track)
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          Ketik kata kunci apa saja untuk langsung menampilkan seluruh paragraf materi yang
          membahas istilah tersebut lintas semua {modules.length} modul.
        </p>
      </div>

      <div className="mt-5 rounded-3xl border border-[var(--border)] bg-[var(--surface)]/70 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="gov-search" className="sr-only">
            Cari materi dan kata kunci IT Governance
          </label>
          <input
            id="gov-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ketik kata kunci: IT Manager, EDM03, RACI, Watermelon SLA, Bus Factor, ISO 42001, SOC 2..."
            className="min-w-[16rem] flex-1 rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--ink)] outline-none ring-[var(--accent)] placeholder:text-[var(--muted)] focus:ring-2"
          />
          {normalizedQuery ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="inline-flex h-10 items-center rounded-full border border-[var(--border)] px-4 text-xs font-medium text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--ink)]"
            >
              Reset
            </button>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5" aria-label="Kata kunci cepat">
          {QUICK_KEYWORDS.map((keyword) => {
            const active = normalizedQuery === keyword.toLowerCase();
            return (
              <button
                key={keyword}
                type="button"
                onClick={() => setQuery(active ? "" : keyword)}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  active
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] font-medium text-[var(--accent)]"
                    : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent)]/60 hover:text-[var(--ink)]"
                }`}
              >
                {keyword}
              </button>
            );
          })}
        </div>

        {normalizedQuery ? (
          <p className="mt-3 text-xs text-[var(--muted)]">
            Ditemukan{" "}
            <span className="font-medium text-[var(--ink)]">{paragraphHits.length} paragraf</span>{" "}
            di{" "}
            <span className="font-medium text-[var(--ink)]">{matchedModuleCount} modul</span> untuk{" "}
            <span className="font-medium text-[var(--accent)]">&ldquo;{query.trim()}&rdquo;</span>.
          </p>
        ) : null}
      </div>

      {normalizedQuery ? (
        paragraphHits.length === 0 ? (
          <div className="mt-5 rounded-3xl border border-[var(--border)] bg-[var(--surface)]/50 p-6 text-center">
            <p className="text-sm text-[var(--ink)]">
              Tidak ada paragraf yang mengandung &ldquo;{query.trim()}&rdquo;.
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Coba kata kunci lain atau pilih salah satu tombol kata kunci cepat di atas.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3" aria-label="Hasil pencarian paragraf">
            {paragraphHits.map((hit) => (
              <article
                key={hit.key}
                className="rounded-3xl border border-[var(--border)] bg-[var(--surface)]/75 p-5 transition hover:border-[var(--accent)]/70"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 font-medium text-[var(--accent)]">
                      Modul {hit.moduleOrder} · {hit.frameworkTag}
                    </span>
                    <span className="rounded-full border border-[var(--border)] px-2.5 py-0.5 text-[var(--muted)]">
                      {hit.kind}
                    </span>
                  </div>
                  <Link
                    href={`/governance/${hit.moduleSlug}`}
                    className="text-xs font-medium text-[var(--accent)] underline hover:opacity-80"
                  >
                    Buka Modul {hit.moduleOrder} →
                  </Link>
                </div>

                <h3 className="mt-2.5 text-sm font-semibold text-[var(--ink)]">
                  {highlightText(hit.label, normalizedQuery, tokens)}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink)]/90">
                  {highlightText(hit.text, normalizedQuery, tokens)}
                </p>
                <p className="mt-2 text-xs text-[var(--muted)]">{hit.moduleTitle}</p>
              </article>
            ))}
          </div>
        )
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {modules.map((mod) => (
            <Link key={mod.id} href={`/governance/${mod.slug}`} className={lobbyCard}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs uppercase tracking-[0.16em] text-[var(--accent)]">
                  Modul {mod.order} · {mod.frameworkTag}
                </span>
                <span className="rounded-full border border-[var(--border)] px-2.5 py-0.5 text-xs text-[var(--muted)]">
                  {mod.statusText}
                </span>
              </div>
              <h3 className="mt-3 font-display text-2xl text-[var(--ink)] group-hover:text-[var(--accent)]">
                {mod.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--muted)]">
                {mod.subtitle}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]">
                <span>
                  {mod.level} · {mod.estimatedMinutes} menit · {mod.questionCount} soal
                </span>
                {mod.bestScore ? (
                  <span className="font-medium text-[var(--ink)]">
                    Skor terbaik {mod.bestScore}%
                  </span>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
