"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { themeMatches } from "@/components/theme-search";
import type { GrammarBook, GrammarChartExample } from "@/types/grammar";

type OpenRow = {
  subject: string;
  context: string;
  examples: GrammarChartExample[];
};

export function GrammarReference({ book }: { book: GrammarBook }) {
  const [query, setQuery] = useState("");
  const [queued, setQueued] = useState<string | null>(null);
  const [openRow, setOpenRow] = useState<OpenRow | null>(null);
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const total = book.chapters.reduce((sum, chapter) => sum + chapter.laws.length, 0);

  const visible = useMemo(
    () =>
      book.chapters
        .map((chapter) => ({
          ...chapter,
          laws: chapter.laws.filter((law) =>
            themeMatches(query, [
              chapter.titleId,
              law.titleId,
              law.whenId,
              law.formula,
              law.mistake.whyId,
              ...law.examples.flatMap((example) => [example.en, example.id]),
            ]),
          ),
        }))
        .filter((chapter) => chapter.laws.length > 0),
    [book.chapters, query],
  );

  const shown = visible.reduce((sum, chapter) => sum + chapter.laws.length, 0);

  function queueSentence(body: Record<string, string | number>) {
    void fetch("/api/grammar/queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) setQueued(data.label ?? "Kalimat masuk latihan.");
      })
      .catch(() => undefined);
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!openRow) return;
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenRow(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openRow]);

  useEffect(() => {
    if (openRow) return;
    triggerRef.current?.focus();
  }, [openRow]);

  const visibleCharts = useMemo(
    () =>
      book.charts.filter((chart) =>
        themeMatches(query, [
          chart.titleId,
          chart.noteId,
          "Tabel rumus",
          ...chart.tables.flatMap((table) => [
            table.titleId,
            ...table.headers,
            ...table.rows.flatMap((row) => [
              row.subject,
              ...row.cells,
              ...row.examples.flatMap((example) => [example.form, example.en, example.id]),
            ]),
          ]),
        ]),
      ),
    [book.charts, query],
  );

  return (
    <div className="lg:grid lg:grid-cols-[16rem_1fr] lg:gap-8">
      <aside className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
        <label className="block">
          <span className="text-xs font-medium text-[var(--muted)]">Cari hukum</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ketik rumus, contoh, atau nama hukum"
            className="mt-1 block w-full rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--ink)] outline-none ring-[var(--accent)] placeholder:text-[var(--muted)] focus:ring-2"
          />
        </label>
        {queued ? (
          <p className="mt-2 text-xs text-[var(--accent)]">{queued} masuk antrian latihan.</p>
        ) : null}
        {query.trim() ? (
          <p className="mt-2 text-xs text-[var(--muted)]">
            {shown} dari {total} hukum
          </p>
        ) : null}
        <nav aria-label="Daftar isi" className="mt-4">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Daftar isi</p>
          <ul className="mt-2 flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible">
            <li className="shrink-0">
              <a
                href="#tabel-rumus"
                className="inline-flex rounded-full px-3 py-1.5 text-sm font-medium text-[var(--accent)] hover:bg-[var(--surface-2)] lg:flex"
              >
                Tabel rumus
              </a>
            </li>
            {book.chapters.map((chapter) => (
              <li key={chapter.id} className="shrink-0">
                <a
                  href={`#${chapter.id}`}
                  className="inline-flex rounded-full px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)] lg:flex"
                >
                  {chapter.titleId}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="mt-8 space-y-10 lg:mt-0">
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)]/70 p-5">
          <h2 className="font-display text-3xl text-[var(--ink)]">Kalau buntu, ikuti empat langkah</h2>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2">
            {book.steps.map((step, index) => (
              <li key={step.titleId} className="rounded-2xl border border-[var(--border)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--accent)]">
                  {String(index + 1).padStart(2, "0")} · {step.titleId}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{step.bodyId}</p>
              </li>
            ))}
          </ol>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {book.decisions.map((decision) => (
              <li key={decision.id}>
                <a
                  href={`#${decision.lawId}`}
                  className="block rounded-2xl border border-[var(--border)] px-4 py-3 hover:border-[var(--accent)]"
                >
                  <span className="block text-sm font-medium text-[var(--ink)]">{decision.titleId}</span>
                  <span className="mt-1 block font-mono text-xs text-[var(--accent)]">{decision.formula}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        {visibleCharts.length > 0 ? (
          <section id="tabel-rumus" className="scroll-mt-24 space-y-4">
            <h2 className="font-display text-3xl text-[var(--ink)]">Tabel rumus</h2>
            {visibleCharts.map((chart) => (
              <article
                key={chart.id}
                id={chart.id}
                className="scroll-mt-24 rounded-3xl border border-[var(--border)] bg-[var(--surface)]/60 p-5"
              >
                <h3 className="text-lg font-semibold text-[var(--ink)]">{chart.titleId}</h3>
                <div className={`mt-4 grid gap-4 ${chart.tables.length > 1 ? "lg:grid-cols-3" : ""}`}>
                  {chart.tables.map((table, tableIndex) => (
                    <div key={table.titleId} className="overflow-x-auto">
                      {chart.tables.length > 1 ? (
                        <p className="mb-2 text-sm font-medium text-[var(--accent)]">{table.titleId}</p>
                      ) : null}
                      <table className="w-full min-w-[16rem] border-collapse text-sm">
                        <thead>
                          <tr>
                            <th className="border-b border-[var(--border)] px-2 py-2 text-left text-xs font-medium text-[var(--muted)]">
                              Subjek
                            </th>
                            {table.headers.map((header) => (
                              <th
                                key={header}
                                className="border-b border-[var(--border)] px-2 py-2 text-left text-xs font-medium text-[var(--accent)]"
                              >
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {table.rows.map((row, rowIndex) => (
                            <tr
                              key={row.subject}
                              className="cursor-pointer hover:bg-[var(--surface-2)]"
                              onClick={(event) => {
                                triggerRef.current = event.currentTarget.querySelector("button");
                                setOpenRow({
                                  subject: row.subject,
                                  context: chart.tables.length > 1 ? table.titleId : chart.titleId,
                                  examples: row.examples,
                                });
                                queueSentence({
                                  kind: "chart",
                                  chartId: chart.id,
                                  tableIndex,
                                  rowIndex,
                                });
                              }}
                            >
                              <th className="border-b border-[var(--border)] px-2 py-2 text-left font-medium text-[var(--ink)]">
                                <button
                                  type="button"
                                  className="w-full cursor-pointer text-left font-medium text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                                  aria-haspopup="dialog"
                                >
                                  {row.subject}
                                </button>
                              </th>
                              {row.cells.map((cell, index) => (
                                <td
                                  key={`${row.subject}-${table.headers[index]}`}
                                  className="border-b border-[var(--border)] px-2 py-2 text-[var(--ink)]"
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{chart.noteId}</p>
              </article>
            ))}
          </section>
        ) : null}

        {visible.length === 0 && visibleCharts.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Tidak ada hukum yang cocok dengan pencarian itu.</p>
        ) : null}

        {visible.map((chapter) => (
          <section key={chapter.id} id={chapter.id} className="scroll-mt-24">
            <h2 className="font-display text-3xl text-[var(--ink)]">{chapter.titleId}</h2>
            <div className="mt-4 space-y-4">
              {chapter.laws.map((law) => (
                <article
                  key={law.id}
                  id={law.id}
                  className="scroll-mt-24 rounded-3xl border border-[var(--border)] bg-[var(--surface)]/60 p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-lg font-semibold text-[var(--ink)]">{law.titleId}</h3>
                    <button
                      type="button"
                      onClick={() => queueSentence({ kind: "law", lawId: law.id })}
                      className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--ink)] hover:border-[var(--accent)]"
                    >
                      Masukkan ke latihan
                    </button>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{law.whenId}</p>
                  <p className="mt-3 rounded-2xl bg-[var(--surface-2)] px-3 py-2 font-mono text-sm text-[var(--accent)]">
                    {law.formula}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {law.examples.map((example) => (
                      <li key={example.en}>
                        <p className="text-sm text-[var(--ink)]">{example.en}</p>
                        <p className="text-xs text-[var(--muted)]">{example.id}</p>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-bg)] px-4 py-3 text-sm">
                    <p className="text-[var(--danger)] line-through">{law.mistake.wrong}</p>
                    <p className="mt-1 text-[var(--ink)]">{law.mistake.right}</p>
                    <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">{law.mistake.whyId}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
      {mounted && openRow
        ? createPortal(
            <div
              className="fixed inset-0 z-50 bg-black/55 px-4"
              onClick={() => setOpenRow(null)}
            >
              <div className="grid h-full place-items-center">
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby={titleId}
                  className="max-h-[min(32rem,calc(100vh-2rem))] w-full max-w-lg overflow-y-auto rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl"
                  onClick={(event) => event.stopPropagation()}
                >
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--accent)]">
                    {openRow.context}
                  </p>
                  <h2 id={titleId} className="mt-2 font-display text-3xl text-[var(--ink)]">
                    {openRow.subject}
                  </h2>
                  <ul className="mt-4 space-y-3">
                    {openRow.examples.map((example) => (
                      <li key={`${example.form}-${example.en}`} className="rounded-2xl border border-[var(--border)] px-4 py-3">
                        <p className="font-mono text-xs text-[var(--accent)]">{example.form}</p>
                        <p className="mt-1 text-sm text-[var(--ink)]">{example.en}</p>
                        <p className="mt-1 text-xs text-[var(--muted)]">{example.id}</p>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 flex justify-end">
                    <button
                      ref={closeRef}
                      type="button"
                      className="inline-flex h-11 items-center rounded-full bg-[var(--accent)] px-4 text-sm font-medium text-[#06221e] hover:bg-[var(--accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                      onClick={() => setOpenRow(null)}
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
