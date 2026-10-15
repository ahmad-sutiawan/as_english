"use client";

import { useState } from "react";
import type { PublicExercise } from "@/types/mastery";

type Result = { exerciseId: string; correct: boolean; feedback: string };

const ring =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

export function ExerciseRunner({
  title,
  lessonId,
  exercises,
  endpoint,
  submitLabel,
}: {
  title: string;
  lessonId: string;
  exercises: PublicExercise[];
  endpoint: string;
  submitLabel: string;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [summary, setSummary] = useState("");

  const current = exercises[index];
  if (!current) return null;

  async function onSubmit() {
    if (pending || results) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, answers }),
      });
      const body = (await response.json()) as {
        error?: string;
        percent?: number;
        passed?: boolean;
        threshold?: number;
        results?: Result[];
      };
      if (!response.ok || !body.results) {
        setError(body.error ?? "Jawaban tidak dapat diperiksa.");
        return;
      }
      setResults(body.results);
      if (typeof body.percent === "number" && typeof body.threshold === "number") {
        setSummary(
          body.passed
            ? `Nilai ${body.percent}%. Ambang penguasaan ${body.threshold}% terpenuhi.`
            : `Nilai ${body.percent}%. Ambang ${body.threshold}% belum terpenuhi. Ulangi bagian yang masih salah. Riwayat penguasaan sebelumnya tetap tersimpan.`,
        );
      } else if (typeof body.percent === "number") {
        setSummary(`Latihan tersimpan. Perkiraan ketepatan pada set ini ${body.percent}%.`);
      }
    } catch {
      setError("Jaringan bermasalah. Coba lagi.");
    } finally {
      setPending(false);
    }
  }

  const result = results?.find((item) => item.exerciseId === current.id);

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)]/70 p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl text-[var(--ink)]">{title}</h2>
        <p className="text-sm text-[var(--muted)]">
          {index + 1} / {exercises.length}
        </p>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
        <div
          className="h-full bg-[var(--accent)]"
          style={{ width: `${((index + 1) / exercises.length) * 100}%` }}
        />
      </div>
      <form
        className="mt-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (index < exercises.length - 1) setIndex(index + 1);
          else void onSubmit();
        }}
      >
        <Question
          exercise={current}
          value={answers[current.id] ?? ""}
          disabled={Boolean(results) || pending}
          onChange={(value) => setAnswers((prev) => ({ ...prev, [current.id]: value }))}
        />
        {result ? (
          <p
            className={`mt-4 rounded-2xl border px-4 py-3 text-sm leading-relaxed ${
              result.correct
                ? "border-[var(--border)] bg-[var(--surface-2)]"
                : "border-[var(--border)] bg-[var(--surface-2)]"
            }`}
            role="status"
          >
            <span className="font-medium text-[var(--ink)]">{result.correct ? "Tepat. " : "Belum tepat. "}</span>
            {result.feedback}
          </p>
        ) : null}
        {error ? (
          <p className="mt-4 text-sm text-[var(--ink)]" role="alert">
            {error}
          </p>
        ) : null}
        {summary ? <p className="mt-4 text-sm text-[var(--ink)]">{summary}</p> : null}
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            className={`inline-flex h-10 items-center rounded-full border border-[var(--border)] px-4 text-sm ${ring}`}
            onClick={() => setIndex(Math.max(0, index - 1))}
            disabled={index === 0}
          >
            Sebelumnya
          </button>
          {index < exercises.length - 1 ? (
            <button type="submit" className={`inline-flex h-10 items-center rounded-full bg-[var(--accent)] px-4 text-sm text-white ${ring}`}>
              Berikutnya
            </button>
          ) : (
            <button
              type="submit"
              className={`inline-flex h-10 items-center rounded-full bg-[var(--accent)] px-4 text-sm text-white disabled:opacity-60 ${ring}`}
              disabled={pending || Boolean(results)}
            >
              {pending ? "Memeriksa..." : submitLabel}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

function Question({
  exercise,
  value,
  onChange,
  disabled,
}: {
  exercise: PublicExercise;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  const inputClass = `mt-3 w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-3 py-3 text-sm text-[var(--ink)] ${ring}`;
  return (
    <fieldset>
      <legend className="text-base font-medium text-[var(--ink)]">{exercise.prompt}</legend>
      {exercise.promptId ? <p className="mt-2 text-sm text-[var(--muted)]">{exercise.promptId}</p> : null}
      {exercise.context ? <p className="mt-2 text-sm text-[var(--muted)]">{exercise.context}</p> : null}
      {exercise.type === "mcq" || exercise.type === "choose" ? (
        <div className="mt-3 grid gap-2">
          {exercise.options?.map((option) => (
            <label key={option.key} className="flex items-start gap-3 rounded-2xl border border-[var(--border)] px-3 py-3 text-sm">
              <input
                type="radio"
                name={exercise.id}
                value={option.key}
                checked={value === option.key}
                onChange={() => onChange(option.key)}
                disabled={disabled}
                className="mt-1"
              />
              <span>
                {option.key}. {option.text}
              </span>
            </label>
          ))}
        </div>
      ) : exercise.type === "writing" ? (
        <>
          {exercise.rubricLabels?.length ? (
            <ul className="mt-3 list-disc pl-5 text-sm text-[var(--muted)]">
              {exercise.rubricLabels.map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
          ) : null}
          <p className="mt-2 text-xs text-[var(--muted)]">
            Penilaian otomatis memeriksa pola wajib, bukan seluruh variasi kalimat yang benar.
          </p>
          <textarea
            className={inputClass}
            rows={4}
            value={value}
            aria-label={exercise.prompt}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
          />
        </>
      ) : (
        <>
          {exercise.words ? (
            <p className="mt-3 text-sm text-[var(--muted)]">Kata: {exercise.words.join(" / ")}</p>
          ) : null}
          <label className="mt-3 block text-sm text-[var(--muted)]" htmlFor={exercise.id}>
            Jawaban
            <input
              id={exercise.id}
              className={inputClass}
              value={value}
              disabled={disabled}
              onChange={(event) => onChange(event.target.value)}
              autoComplete="off"
            />
          </label>
        </>
      )}
    </fieldset>
  );
}
