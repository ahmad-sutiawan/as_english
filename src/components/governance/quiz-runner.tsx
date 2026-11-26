"use client";

import { useEffect, useRef, useState } from "react";
import type { PublicGovExercise } from "@/types/governance";

type Result = {
  exerciseId: string;
  correct: boolean;
  feedback: string;
  correctAnswer: string;
};

type CheckState = {
  correct: boolean;
  feedback: string;
  correctAnswer: string;
  explanation: string;
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
  const [checkedById, setCheckedById] = useState<Record<string, CheckState>>({});
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [validating, setValidating] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [summary, setSummary] = useState<{ text: string; passed?: boolean } | null>(null);
  const [correctPopup, setCorrectPopup] = useState<{ explanation: string } | null>(null);
  const advanceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current !== null) {
        window.clearTimeout(advanceTimerRef.current);
      }
    };
  }, []);

  const current = exercises[index];
  if (!current) return null;

  const currentCheck = checkedById[current.id];
  const currentResult = results?.find((item) => item.exerciseId === current.id);
  const isRevealed = Boolean(revealedIds[current.id]);

  async function submitFinal(finalAnswers: Record<string, string>) {
    if (pending || results) return;
    setPending(true);
    setError("");
    try {
      const payload = moduleId ? { moduleId, answers: finalAnswers } : { answers: finalAnswers };
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
        setError(body.error ?? "Jawaban belum dapat disimpan.");
        return;
      }
      setResults(body.results);
      const pct = typeof body.score === "number" ? body.score : body.percent;
      const threshold = body.threshold ?? body.passingScore;
      if (typeof pct === "number" && typeof threshold === "number") {
        setSummary({
          passed: Boolean(body.passed),
          text: body.passed
            ? `Selesai! Skor ${pct}%. Lulus ambang penguasaan ${threshold}%.`
            : `Skor ${pct}%. Belum mencapai ambang ${threshold}%. Periksa soal bertanda merah lalu klik Ulangi.`,
        });
      } else if (typeof pct === "number") {
        setSummary({
          passed: pct >= 80,
          text: `Latihan selesai & tersimpan. Ketepatan Anda pada set ini ${pct}%.`,
        });
      }
    } catch {
      setError("Koneksi bermasalah. Coba lagi.");
    } finally {
      setPending(false);
    }
  }

  async function validateAndAdvance() {
    if (validating || pending || results) return;
    const answer = (answers[current.id] ?? "").trim();
    if (!answer) {
      setError("Pilih atau isi jawaban terlebih dahulu sebelum melanjutkan.");
      return;
    }

    setValidating(true);
    setError("");
    try {
      const response = await fetch("/api/governance/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId,
          exerciseId: current.id,
          answer,
        }),
      });
      const body = (await response.json()) as {
        error?: string;
        correct?: boolean;
        feedback?: string;
        correctAnswer?: string;
        explanation?: string;
      };
      if (!response.ok || typeof body.correct !== "boolean") {
        setError(body.error ?? "Gagal memeriksa jawaban. Coba lagi.");
        return;
      }

      const nextCheck: CheckState = {
        correct: body.correct,
        feedback: body.feedback ?? "",
        correctAnswer: body.correctAnswer ?? "",
        explanation: body.explanation ?? "",
      };

      setCheckedById((prev) => ({ ...prev, [current.id]: nextCheck }));

      if (body.correct) {
        setCorrectPopup({ explanation: nextCheck.explanation });
        const isLast = index >= exercises.length - 1;
        const snapshotAnswers = { ...answers, [current.id]: answer };
        advanceTimerRef.current = window.setTimeout(() => {
          setCorrectPopup(null);
          if (isLast) {
            void submitFinal(snapshotAnswers);
          } else {
            setIndex((prev) => Math.min(exercises.length - 1, prev + 1));
          }
        }, 900);
      }
    } catch {
      setError("Koneksi bermasalah. Coba lagi.");
    } finally {
      setValidating(false);
    }
  }

  function updateAnswer(value: string) {
    setAnswers((prev) => ({ ...prev, [current.id]: value }));
    setError("");
    if (checkedById[current.id] && !checkedById[current.id].correct) {
      setCheckedById((prev) => {
        const next = { ...prev };
        delete next[current.id];
        return next;
      });
    }
  }

  function resetQuiz() {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    setAnswers({});
    setCheckedById({});
    setRevealedIds({});
    setResults(null);
    setSummary(null);
    setCorrectPopup(null);
    setError("");
    setIndex(0);
  }

  return (
    <section className="relative rounded-3xl border border-[var(--border)] bg-[var(--surface)]/70 p-5">
      {correctPopup ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-4"
        >
          <div className="w-full max-w-md rounded-3xl border border-[var(--success-border)] bg-[var(--surface)] p-6 text-center shadow-2xl">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--success-bg)] text-2xl font-bold text-[var(--success-ink)]">
              ✓
            </div>
            <h3 className="mt-3 font-display text-2xl text-[var(--success-ink)]">
              Jawaban Benar!
            </h3>
            {correctPopup.explanation ? (
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                {correctPopup.explanation}
              </p>
            ) : null}
            <p className="mt-3 text-xs font-medium text-[var(--accent)]">
              {index < exercises.length - 1
                ? "Lanjut ke soal berikutnya…"
                : "Menyimpan hasil akhir…"}
            </p>
          </div>
        </div>
      ) : null}

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
          const finalRes = results?.find((r) => r.exerciseId === ex.id);
          const check = checkedById[ex.id];
          const answered = Boolean(answers[ex.id]?.trim());
          const active = i === index;
          let tone = "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]";
          if (finalRes) {
            tone = finalRes.correct
              ? "border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-ink)]"
              : "border-[var(--danger-border)] bg-[var(--danger-bg)] text-[var(--danger)]";
          } else if (check) {
            tone = check.correct
              ? "border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-ink)]"
              : "border-[var(--danger-border)] bg-[var(--danger-bg)] text-[var(--danger)]";
          } else if (answered) {
            tone = "border-[var(--accent)]/60 bg-[var(--accent-soft)] text-[var(--ink)]";
          }
          return (
            <button
              key={ex.id}
              type="button"
              onClick={() => {
                setError("");
                setIndex(i);
              }}
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
          void validateAndAdvance();
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
                      onChange={() => updateAnswer(option.key)}
                      disabled={Boolean(results) || validating || pending}
                      className="mt-1"
                    />
                    <span className="leading-relaxed">
                      <span className="font-medium">{option.key}.</span> {option.text}
                    </span>
                  </label>
                );
              })}
            </div>
          ) : current.type === "writing" ? (
            <div className="mt-3 space-y-2">
              {current.rubricLabels && current.rubricLabels.length > 0 ? (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/60 px-4 py-3 text-xs text-[var(--muted)]">
                  <p className="font-medium text-[var(--ink)]">
                    Elemen wajib dalam jawaban (bahasa Indonesia atau Inggris):
                  </p>
                  <ul className="mt-1.5 list-disc space-y-1 pl-4">
                    {current.rubricLabels.map((label) => (
                      <li key={label}>{label}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <textarea
                rows={4}
                value={answers[current.id] ?? ""}
                onChange={(event) => updateAnswer(event.target.value)}
                disabled={Boolean(results) || validating || pending}
                placeholder="Tulis memo / respons eksekutif Anda secara ringkas dan terstruktur..."
                className={`w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--ink)] ${ring}`}
              />
            </div>
          ) : (
            <input
              type="text"
              value={answers[current.id] ?? ""}
              onChange={(event) => updateAnswer(event.target.value)}
              disabled={Boolean(results) || validating || pending}
              placeholder="Ketik jawaban singkat Anda di sini"
              className={`mt-3 w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--ink)] ${ring}`}
            />
          )}
        </fieldset>

        {!results && currentCheck && !currentCheck.correct ? (
          <div
            role="alert"
            className="mt-4 rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-bg)] px-4 py-3.5 text-sm"
          >
            <p className="font-semibold text-[var(--danger)]">
              ✗ Jawaban Anda salah. Silakan coba lagi atau lihat jawaban benar.
            </p>
            {!isRevealed ? (
              <button
                type="button"
                onClick={() => setRevealedIds((prev) => ({ ...prev, [current.id]: true }))}
                className={`mt-3 inline-flex h-9 items-center rounded-full border border-[var(--danger-border)] bg-[var(--surface)] px-3.5 text-xs font-medium text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)] ${ring}`}
              >
                Lihat jawaban benar
              </button>
            ) : (
              <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]/90 px-3.5 py-3 text-xs leading-relaxed text-[var(--ink)]">
                <p>
                  <span className="font-semibold text-[var(--accent)]">Jawaban benar: </span>
                  {currentCheck.correctAnswer}
                </p>
                {currentCheck.explanation ? (
                  <p className="mt-1.5 text-[var(--muted)]">
                    <span className="font-medium text-[var(--ink)]">Pembahasan: </span>
                    {currentCheck.explanation}
                  </p>
                ) : null}
              </div>
            )}
          </div>
        ) : null}

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
            onClick={() => {
              setError("");
              setIndex(Math.max(0, index - 1));
            }}
            disabled={index === 0 || validating || pending}
            className={`inline-flex h-10 items-center rounded-full border border-[var(--border)] px-4 text-sm text-[var(--ink)] disabled:opacity-40 ${ring}`}
          >
            Sebelumnya
          </button>

          {!results ? (
            <button
              type="submit"
              disabled={validating || pending}
              className={`inline-flex h-10 items-center rounded-full bg-[var(--accent)] px-5 text-sm font-medium text-[#06221e] hover:bg-[var(--accent-hover)] disabled:opacity-60 ${ring}`}
            >
              {validating
                ? "Memeriksa…"
                : pending
                  ? "Menyimpan…"
                  : index < exercises.length - 1
                    ? "Periksa & Lanjut"
                    : submitLabel}
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
