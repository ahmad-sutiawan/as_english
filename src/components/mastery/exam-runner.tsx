"use client";

import { useState } from "react";
import Link from "next/link";
import type { Competency, PublicExercise } from "@/types/mastery";

const labels: Record<Competency, string> = {
  concept: "Konsep",
  construction: "Bentuk kalimat",
  communication: "Komunikasi",
  writing: "Menulis dan sunting",
};

type ExamResult = {
  score: number;
  passed: boolean;
  sections: Record<Competency, { percent: number }>;
  weakLessons: string[];
  results: { exerciseId: string; correct: boolean; feedback: string }[];
};

export function ExamRunner({
  examId,
  exercises,
}: {
  examId: "foundation" | "final";
  exercises: PublicExercise[];
}) {
  return <ExamForm examId={examId} exercises={exercises} />;
}

function ExamForm({
  examId,
  exercises,
}: {
  examId: "foundation" | "final";
  exercises: PublicExercise[];
}) {
  const [showBank, setShowBank] = useState(true);
  const [result, setResult] = useState<ExamResult | null>(null);

  if (result) {
    return (
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)]/70 p-5">
        <h2 className="font-display text-3xl text-[var(--ink)]">{result.score}%</h2>
        <p className="mt-2 text-sm text-[var(--ink)]">
          {result.passed
            ? "Nilai mencapai ambang 80%. Ini mengukur soal yang tersedia, bukan seluruh kemampuan berbicara."
            : "Nilai belum mencapai 80%. Ulangi lesson yang disarankan, lalu kerjakan ujian lagi."}
        </p>
        <p className="mt-2 text-sm text-[var(--muted)]">Tidak ada penilaian speaking otomatis pada ujian ini.</p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {(Object.keys(labels) as Competency[]).map((key) => (
            <div key={key} className="rounded-2xl border border-[var(--border)] px-3 py-3">
              <dt className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">{labels[key]}</dt>
              <dd className="mt-1 text-lg text-[var(--ink)]">{result.sections[key]?.percent ?? 0}%</dd>
            </div>
          ))}
        </dl>
        {result.weakLessons.length > 0 ? (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-[var(--ink)]">Lesson yang perlu dilihat lagi</h3>
            <ul className="mt-2 grid gap-2">
              {result.weakLessons.map((slug) => (
                <li key={slug}>
                  <Link className="text-sm text-[var(--accent)] underline" href={`/mastery/lesson/${slug}`}>
                    {slug}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-4 text-sm text-[var(--ink)]">Tidak ada soal yang salah pada percobaan ini.</p>
        )}
        <button
          type="button"
          className="mt-5 inline-flex h-10 items-center rounded-full bg-[var(--accent)] px-4 text-sm text-white"
          onClick={() => {
            setResult(null);
            setShowBank(true);
          }}
        >
          Ulangi ujian
        </button>
      </section>
    );
  }

  if (!showBank) return null;

  return (
    <ExamQuestions
      examId={examId}
      exercises={exercises}
      onDone={(next) => {
        setResult(next);
        setShowBank(false);
      }}
    />
  );
}

function ExamQuestions({
  examId,
  exercises,
  onDone,
}: {
  examId: string;
  exercises: PublicExercise[];
  onDone: (result: ExamResult) => void;
}) {
  return (
    <ExamInner examId={examId} exercises={exercises} onDone={onDone} />
  );
}

function ExamInner({
  examId,
  exercises,
  onDone,
}: {
  examId: string;
  exercises: PublicExercise[];
  onDone: (result: ExamResult) => void;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const current = exercises[index];

  async function submit() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/mastery/exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId, answers }),
      });
      const body = (await response.json()) as ExamResult & { error?: string };
      if (!response.ok || typeof body.score !== "number") {
        setError(body.error ?? "Ujian tidak dapat dinilai.");
        return;
      }
      onDone(body);
    } catch {
      setError("Jaringan bermasalah. Coba lagi.");
    } finally {
      setPending(false);
    }
  }

  if (!current) return null;

  return (
    <ExerciseShell
      index={index}
      total={exercises.length}
      exercise={current}
      value={answers[current.id] ?? ""}
      error={error}
      pending={pending}
      onChange={(value) => setAnswers((prev) => ({ ...prev, [current.id]: value }))}
      onPrev={() => setIndex(Math.max(0, index - 1))}
      onNext={() => {
        if (index < exercises.length - 1) setIndex(index + 1);
        else void submit();
      }}
      last={index === exercises.length - 1}
    />
  );
}

function ExerciseShell(props: {
  index: number;
  total: number;
  exercise: PublicExercise;
  value: string;
  error: string;
  pending: boolean;
  last: boolean;
  onChange: (value: string) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const ring =
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";
  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)]/70 p-5">
      <p className="text-sm text-[var(--muted)]">
        Soal {props.index + 1} / {props.total}
      </p>
      <form
        className="mt-4"
        onSubmit={(event) => {
          event.preventDefault();
          props.onNext();
        }}
      >
        <p className="text-base font-medium text-[var(--ink)]">{props.exercise.prompt}</p>
        {props.exercise.promptId ? <p className="mt-2 text-sm text-[var(--muted)]">{props.exercise.promptId}</p> : null}
        {props.exercise.context ? <p className="mt-2 text-sm text-[var(--muted)]">{props.exercise.context}</p> : null}
        {props.exercise.options ? (
          <div className="mt-3 grid gap-2">
            {props.exercise.options.map((option) => (
              <label key={option.key} className="flex gap-3 rounded-2xl border border-[var(--border)] px-3 py-3 text-sm">
                <input
                  type="radio"
                  name={props.exercise.id}
                  checked={props.value === option.key}
                  onChange={() => props.onChange(option.key)}
                />
                <span>
                  {option.key}. {option.text}
                </span>
              </label>
            ))}
          </div>
        ) : (
          <textarea
            className={`mt-3 w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-3 py-3 text-sm ${ring}`}
            rows={props.exercise.type === "writing" ? 4 : 2}
            aria-label={props.exercise.prompt}
            value={props.value}
            onChange={(event) => props.onChange(event.target.value)}
          />
        )}
        {props.exercise.rubricLabels?.length ? (
          <ul className="mt-3 list-disc pl-5 text-sm text-[var(--muted)]">
            {props.exercise.rubricLabels.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        ) : null}
        {props.error ? (
          <p className="mt-3 text-sm" role="alert">
            {props.error}
          </p>
        ) : null}
        <div className="mt-4 flex gap-2">
          <button type="button" className={`h-10 rounded-full border border-[var(--border)] px-4 text-sm ${ring}`} onClick={props.onPrev} disabled={props.index === 0}>
            Sebelumnya
          </button>
          <button type="submit" className={`h-10 rounded-full bg-[var(--accent)] px-4 text-sm text-white disabled:opacity-60 ${ring}`} disabled={props.pending}>
            {props.pending ? "Menilai..." : props.last ? "Kirim ujian" : "Berikutnya"}
          </button>
        </div>
      </form>
    </section>
  );
}
