"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ExerciseItem } from "@/types/content";
import { SpeakButton } from "@/components/speak-button";
import { speak } from "@/lib/tts";

type Props = {
  item: ExerciseItem;
  moduleTitle: string;
  nextItemId: string | null;
};

type Feedback = {
  exact: boolean;
  nearMiss: boolean;
  expected: string;
  explanation: string;
  correctKey: string;
};

export function ExercisePanel({ item, moduleTitle, nextItemId }: Props) {
  const router = useRouter();
  const [typed, setTyped] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const correctChoice = useMemo(
    () => item.choices.find((c) => c.key === item.correctKey),
    [item],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/progress/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: item.moduleId,
          itemId: item.id,
          typedAnswer: typed,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Submit failed");
        return;
      }

      setFeedback(data);
      if (data.exact && data.expected) {
        speak(data.expected);
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function retry() {
    setFeedback(null);
    setTyped("");
    setError(null);
  }

  return (
    <article className="space-y-8">
      <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-[var(--muted)]">
        <span>{moduleTitle}</span>
        <span aria-hidden>·</span>
        <span>{item.difficulty}</span>
        <span aria-hidden>·</span>
        <span>{item.id}</span>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[var(--ink)]">Scenario</h2>
          {(item.tts?.scenario ?? true) && (
            <SpeakButton text={item.scenario} label="Play scenario" />
          )}
        </div>
        <p className="text-base leading-relaxed text-[var(--ink)]">
          {item.scenario}
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[var(--ink)]">Prompt</h2>
          {(item.tts?.prompt ?? true) && (
            <SpeakButton text={item.prompt} label="Play prompt" />
          )}
        </div>
        <p className="text-lg font-medium leading-snug text-[var(--ink)]">
          {item.prompt}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--ink)]">
          Choices — read them, then type the correct answer
        </h2>
        <ul className="space-y-2">
          {item.choices.map((choice) => (
            <li
              key={choice.key}
              className="border-l-2 border-[var(--border)] pl-3 text-sm leading-relaxed text-[var(--ink)]"
            >
              <span className="mr-2 font-semibold text-[var(--muted)]">
                {choice.key}.
              </span>
              {choice.text}
            </li>
          ))}
        </ul>
        <p className="text-xs text-[var(--muted)]">
          Options are not clickable. Type the full correct sentence below.
        </p>
      </section>

      {!feedback?.exact ? (
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block text-sm font-semibold text-[var(--ink)]">
            Type the correct answer exactly
            <textarea
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              rows={4}
              required
              className="mt-2 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm leading-relaxed text-[var(--ink)] outline-none ring-[var(--accent)] focus:ring-2"
              placeholder="Rewrite the correct option in full…"
            />
          </label>
          {error && <p className="text-sm text-red-700">{error}</p>}
          {feedback && !feedback.exact && (
            <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              {feedback.nearMiss
                ? "Almost — small typo. Retype carefully for mastery."
                : "Not exact yet. Compare with the options and try again."}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting || !typed.trim()}
            className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {submitting ? "Checking…" : "Check answer"}
          </button>
        </form>
      ) : (
        <section className="space-y-4 rounded-md border border-emerald-300 bg-emerald-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-emerald-950">Correct</h2>
            {(item.tts?.answer ?? true) && correctChoice && (
              <SpeakButton text={correctChoice.text} label="Play answer" />
            )}
          </div>
          <p className="text-sm leading-relaxed text-emerald-950">
            <span className="font-semibold">{feedback.correctKey}. </span>
            {feedback.expected}
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-emerald-950">
                Why
              </h3>
              <SpeakButton text={feedback.explanation} label="Play why" />
            </div>
            <p className="text-sm leading-relaxed text-emerald-900">
              {feedback.explanation}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={retry}
              className="rounded-md border border-emerald-400 px-3 py-1.5 text-sm text-emerald-950 hover:bg-emerald-100"
            >
              Practice again
            </button>
            {nextItemId ? (
              <button
                type="button"
                onClick={() =>
                  router.push(`/learn/${item.moduleId}/${nextItemId}`)
                }
                className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
              >
                Next exercise
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.push(`/learn/${item.moduleId}`)}
                className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
              >
                Back to module
              </button>
            )}
          </div>
        </section>
      )}
    </article>
  );
}
