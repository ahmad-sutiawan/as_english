"use client";

import { useState } from "react";
import type { PublicGovExercise } from "@/types/governance";

type Result = {
  exerciseId: string;
  correct: boolean;
  feedback: string;
  correctAnswer: string;
};

type Props = {
  title: string;
  subtitle?: string;
  moduleId?: string;
  exercises: PublicGovExercise[];
  endpoint: string;
  submitLabel: string;
};

const ring =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

export function GovQuizRunner({
  title,
  subtitle,
  moduleId,
  exercises,
  endpoint,
  submitLabel,
}: Props) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [summary, setSummary] = useState<{ text: string; passed?: boolean } | null>(null);

  const current = exercises[index];
  if (!current) return null;

  const currentResult = results?.find((item) => item.exerciseId === current.id);

  async function onSubmit() {
    if (pending || results) return;
    setPending(true);
    setError("");
    try {
      const payload = moduleId ? { moduleId, answers } : { answers };
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as {
        error?: string;
        percent?: number;
        score?: number;
        passed?: boolean;
        threshold?: number;
        passingScore?: number;
        results?: Result[];
      };
      if (!response.ok || !body.results) {
        setError(body.error ?? "Jawaban belum dapat diperiksa.");
        return;
      }
      setResults(body.results);
      const pct = typeof body.score === "number" ? body.score : body.percent;
      const threshold = body.threshold ?? body.passingScore;
      if (typeof pct === "number" && typeof threshold === "number") {
        setSummary({
          passed: Boolean(body.passed),
          text: body.passed
            ? `Skor ${pct}%. Lulus ambang penguasaan ${threshold}%.`
            : `Skor ${pct}%. Belum mencapai ambang ${threshold}%. Periksa soal bertanda merah lalu klik Ulangi.`,
        });
      } else if (typeof pct === "number") {
        setSummary({
          passed: pct >= 80,
          text: `Latihan tersimpan. Ketepatan Anda pada set ini ${pct}%.`,
        });
      }
    } catch {
      setError("Koneksi bermasalah. Coba lagi.");
    } finally {
      setPending(false);
    }
  }

  function resetQuiz() {
    setAnswers({});
    setResults(null);
    setSummary(null);
    setError("");
    setIndex(0);
  }

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)]/70 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-[var(--ink)]">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p> : null}
        </div>
        <p className="text-sm text-[var(--muted)]">
          Soal {index + 1} / {exercises.length}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Peta nomor soal">
        {exercises.map((ex, i) => {
          const res = results?.find((r) => r.exerciseId === ex.id);
          const answered = Boolean(answers[ex.id]?.trim());
          const active = i === index;
          let tone = "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]";
          if (res) {
            tone = res.correct
              ? "border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-ink)]"
              : "border-[var(--danger-border)] bg-[var(--danger-bg)] text-[var(--danger)]";
          } else if (answered) {
            tone = "border-[var(--accent)]/60 bg-[var(--accent-soft)] text-[var(--ink)]";
          }
          return (
            <button
              key={ex.id}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-8 min-w-8 rounded-full border px-2.5 text-xs font-medium transition ${tone} ${
                active ? "ring-2 ring-[var(--accent)]" : ""
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <form
        className="mt-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (index < exercises.length - 1) setIndex(index + 1);
          else void onSubmit();
        }}
      >
        <p className="text-xs uppercase tracking-[0.16em] text-[var(--accent)]">{current.topic}</p>
        {current.context ? (
          <div className="mt-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/70 px-4 py-3 text-sm leading-relaxed text-[var(--muted)]">
            <span className="font-medium text-[var(--ink)]">Skenario: </span>
            {current.context}
          </div>
        ) : null}

        <fieldset className="mt-3">
          <legend className="text-base font-medium leading-relaxed text-[var(--ink)]">
            {current.prompt}
          </legend>

          {current.type === "mcq" || current.type === "scenario" ? (
            <div className="mt-3 grid gap-2">
              {current.options?.map((option) => {
                const selected = (answers[current.id] ?? "") === option.key;
                return (
                  <label
                    key={option.key}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                      selected
                        ? "border-[var(--accent)] bg-[var(--accent-soft)]/50 text-[var(--ink)]"
                        : "border-[var(--border)] bg-[var(--background)]/50 text-[var(--ink)] hover:border-[var(--accent)]/60"
                    }`}
                  >
                    <input
                      type="radio"
                      name={current.id}
                      value={option.key}
                      checked={selected}
                      onChange={() =>
                        setAnswers((prev) => ({ ...prev, [current.id]: option.key }))
                      }
                      disabled={Boolean(results) || pending}
                      className="mt-1"
                    />
                    <span className="leading-relaxed">
                      <span className="font-medium">{option.key}.</span> {option.text}
                    </span>
                  </label>
                );
              })}
            </div>
          ) : (
            <input
              type="text"
              value={answers[current.id] ?? ""}
              onChange={(event) =>
                setAnswers((prev) => ({ ...prev, [current.id]: event.target.value }))
              }
              disabled={Boolean(results) || pending}
              placeholder="Ketik jawaban singkat Anda di sini"
              className={`mt-3 w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--ink)] ${ring}`}
            />
          )}
        </fieldset>

        {currentResult ? (
          <div
            role="status"
            className={`mt-4 rounded-2xl border px-4 py-3 text-sm leading-relaxed ${
              currentResult.correct
                ? "border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-ink)]"
                : "border-[var(--danger-border)] bg-[var(--danger-bg)] text-[var(--ink)]"
            }`}
          >
            {currentResult.feedback}
          </div>
        ) : null}

        {error ? (
          <p className="mt-4 text-sm text-[var(--danger)]" role="alert">
            {error}
          </p>
        ) : null}

        {summary ? (
          <div
            className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-medium ${
              summary.passed
                ? "border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-ink)]"
                : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--ink)]"
            }`}
          >
            {summary.text}
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setIndex(Math.max(0, index - 1))}
            disabled={index === 0}
            className={`inline-flex h-10 items-center rounded-full border border-[var(--border)] px-4 text-sm text-[var(--ink)] disabled:opacity-40 ${ring}`}
          >
            Sebelumnya
          </button>

          {index < exercises.length - 1 ? (
            <button
              type="submit"
              className={`inline-flex h-10 items-center rounded-full bg-[var(--accent)] px-4 text-sm font-medium text-[#06221e] hover:bg-[var(--accent-hover)] ${ring}`}
            >
              Berikutnya
            </button>
          ) : !results ? (
            <button
              type="submit"
              disabled={pending}
              className={`inline-flex h-10 items-center rounded-full bg-[var(--accent)] px-5 text-sm font-medium text-[#06221e] hover:bg-[var(--accent-hover)] disabled:opacity-60 ${ring}`}
            >
              {pending ? "Memeriksa..." : submitLabel}
            </button>
          ) : null}

          {results ? (
            <button
              type="button"
              onClick={resetQuiz}
              className={`inline-flex h-10 items-center rounded-full border border-[var(--accent)] px-4 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent-soft)] ${ring}`}
            >
              Ulangi
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}
