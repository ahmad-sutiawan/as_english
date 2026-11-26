"use client";

import { useState, type ReactNode } from "react";

export type GrammarTab = "mastery" | "referensi";

type Props = {
  initialTab: GrammarTab;
  masteryBadge: string;
  referenceBadge: string;
  masteryContent: ReactNode;
  referenceContent: ReactNode;
};

export function GrammarHub({
  initialTab,
  masteryBadge,
  referenceBadge,
  masteryContent,
  referenceContent,
}: Props) {
  const [activeTab, setActiveTab] = useState<GrammarTab>(initialTab);

  function selectTab(tab: GrammarTab) {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const nextUrl = tab === "mastery" ? "/grammar?tab=mastery" : "/grammar?tab=referensi";
      window.history.replaceState(null, "", nextUrl);
    }
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label="Bagian Grammar"
        className="grid gap-3 sm:grid-cols-2"
      >
        <button
          type="button"
          role="tab"
          id="tab-mastery"
          aria-selected={activeTab === "mastery"}
          aria-controls="panel-mastery"
          onClick={() => selectTab("mastery")}
          className={`flex flex-col rounded-3xl border px-5 py-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
            activeTab === "mastery"
              ? "border-[var(--accent)] bg-[var(--accent-soft)]/70"
              : "border-[var(--border)] bg-[var(--surface)]/60 hover:border-[var(--accent)]/60"
          }`}
        >
          <span className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
              Kurikulum terstruktur
            </span>
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-0.5 text-xs text-[var(--muted)]">
              {masteryBadge}
            </span>
          </span>
          <span className="mt-2 font-display text-2xl text-[var(--ink)]">
            Kurikulum Mastery
          </span>
          <span className="mt-1 text-sm text-[var(--muted)]">
            Fase belajar, modul, lesson bertahap, review, dan ujian.
          </span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-referensi"
          aria-selected={activeTab === "referensi"}
          aria-controls="panel-referensi"
          onClick={() => selectTab("referensi")}
          className={`flex flex-col rounded-3xl border px-5 py-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
            activeTab === "referensi"
              ? "border-[var(--accent)] bg-[var(--accent-soft)]/70"
              : "border-[var(--border)] bg-[var(--surface)]/60 hover:border-[var(--accent)]/60"
          }`}
        >
          <span className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
              Referensi cepat
            </span>
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-0.5 text-xs text-[var(--muted)]">
              {referenceBadge}
            </span>
          </span>
          <span className="mt-2 font-display text-2xl text-[var(--ink)]">
            Referensi Hukum
          </span>
          <span className="mt-1 text-sm text-[var(--muted)]">
            Empat langkah saat buntu, tabel rumus interaktif, dan hukum grammar.
          </span>
        </button>
      </div>

      <div
        role="tabpanel"
        id={activeTab === "mastery" ? "panel-mastery" : "panel-referensi"}
        aria-labelledby={activeTab === "mastery" ? "tab-mastery" : "tab-referensi"}
        className="mt-8"
      >
        {activeTab === "mastery" ? masteryContent : referenceContent}
      </div>
    </div>
  );
}
