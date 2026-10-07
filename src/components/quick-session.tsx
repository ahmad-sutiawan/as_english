"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ChoiceKey, Difficulty } from "@/types/content";
import { DIFFICULTY_LABEL_ID } from "@/types/content";
import type { QuickCard } from "@/types/quick";
import { SpeakButton } from "@/components/speak-button";
import { speak } from "@/lib/tts";

type LevelFilter = Difficulty | "all";

type Feedback = {
  correct: boolean;
  correctKey: ChoiceKey;
  expected: string;
  expectedId: string;
  expectedStructure: string;
  expectedStructureId: string;
  explanation: string;
};

type Summary = {
  cleared: boolean;
  correctCount: number;
  wrongCount: number;
  heartsLeft: number;
  xpGained: number;
  xpTotal: number;
  streak: number;
  bestStreak: number;
};

type Props = {
  level: LevelFilter;
};

export function QuickSession({ level }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<QuickCard[]>([]);
  const [index, setIndex] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [selected, setSelected] = useState<ChoiceKey | null>(null);

  const loadSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSummary(null);
    setFeedback(null);
    setSelected(null);
    setIndex(0);
    setCorrectCount(0);
    setWrongCount(0);
    try {
      const res = await fetch("/api/quick/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal memuat sesi.");
        setItems([]);
        return;
      }
      setItems(data.items);
      setHearts(data.hearts ?? 3);
    } catch {
      setError("Koneksi gagal.");
    } finally {
      setLoading(false);
    }
  }, [level]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  async function finishSession(opts: {
    cleared: boolean;
    correct: number;
    wrong: number;
    heartsLeft: number;
  }) {
    const perfect = opts.cleared && opts.heartsLeft === 3;
    try {
      const res = await fetch("/api/quick/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correctCount: opts.correct,
          wrongCount: opts.wrong,
          heartsLeft: opts.heartsLeft,
          perfect,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSummary({
          cleared: opts.cleared,
          correctCount: opts.correct,
          wrongCount: opts.wrong,
          heartsLeft: opts.heartsLeft,
          xpGained: 0,
          xpTotal: 0,
          streak: 0,
          bestStreak: 0,
        });
        return;
      }
      setSummary({
        cleared: opts.cleared,
        correctCount: opts.correct,
        wrongCount: opts.wrong,
        heartsLeft: opts.heartsLeft,
        xpGained: data.xpGained,
        xpTotal: data.xpTotal,
        streak: data.streak,
        bestStreak: data.bestStreak,
      });
    } catch {
      setSummary({
        cleared: opts.cleared,
        correctCount: opts.correct,
        wrongCount: opts.wrong,
        heartsLeft: opts.heartsLeft,
        xpGained: 0,
        xpTotal: 0,
        streak: 0,
        bestStreak: 0,
      });
    }
  }

  async function onPick(key: ChoiceKey) {
    if (busy || feedback || summary) return;
    const card = items[index];
    if (!card) return;
    setBusy(true);
    setSelected(key);
    try {
      const res = await fetch("/api/quick/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: card.moduleId,
          itemId: card.itemId,
          choiceKey: key,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal memeriksa.");
        setBusy(false);
        return;
      }

      const fb: Feedback = {
        correct: data.correct,
        correctKey: data.correctKey,
        expected: data.expected,
        expectedId: data.expectedId,
        expectedStructure: data.expectedStructure,
        expectedStructureId: data.expectedStructureId,
        explanation: data.explanation,
      };
      setFeedback(fb);

      let nextCorrect = correctCount;
      let nextWrong = wrongCount;
      let nextHearts = hearts;

      if (data.correct) {
        nextCorrect += 1;
        setCorrectCount(nextCorrect);
        speak(data.expected);
      } else {
        nextWrong += 1;
        nextHearts = Math.max(0, hearts - 1);
        setWrongCount(nextWrong);
        setHearts(nextHearts);
      }

      window.setTimeout(() => {
        const isLast = index >= items.length - 1;
        if (!data.correct && nextHearts <= 0) {
          void finishSession({
            cleared: false,
            correct: nextCorrect,
            wrong: nextWrong,
            heartsLeft: 0,
          });
          setBusy(false);
          return;
        }
        if (isLast) {
          void finishSession({
            cleared: true,
            correct: nextCorrect,
            wrong: nextWrong,
            heartsLeft: nextHearts,
          });
          setBusy(false);
          return;
        }
        setIndex((i) => i + 1);
        setFeedback(null);
        setSelected(null);
        setBusy(false);
      }, data.correct ? 1100 : 1600);
    } catch {
      setError("Koneksi gagal.");
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-[var(--muted)]">Menyiapkan 8 soal cepat…</p>
    );
  }

  if (error && items.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm" style={{ color: "var(--danger)" }}>
          {error}
        </p>
        <Link href="/quick" className="text-sm text-[var(--accent)]">
          ← Kembali ke lobby
        </Link>
      </div>
    );
  }

  if (summary) {
    return (
      <section
        className="space-y-5 rounded-md border p-5"
        style={{
          borderColor: summary.cleared
            ? "var(--success-border)"
            : "var(--warn-border)",
          background: summary.cleared ? "var(--success-bg)" : "var(--warn-bg)",
        }}
      >
        <h2
          className="font-display text-2xl tracking-tight"
          style={{
            color: summary.cleared ? "var(--success-ink)" : "var(--warn)",
          }}
        >
          {summary.cleared ? "Sesi selesai!" : "Nyawa habis"}
        </h2>
        <ul className="grid gap-2 text-sm sm:grid-cols-2">
          <li className="text-[var(--ink)]">
            Benar: <strong>{summary.correctCount}</strong>
          </li>
          <li className="text-[var(--ink)]">
            Salah: <strong>{summary.wrongCount}</strong>
          </li>
          <li className="text-[var(--ink)]">
            XP didapat: <strong>+{summary.xpGained}</strong>
          </li>
          <li className="text-[var(--ink)]">
            Total XP: <strong>{summary.xpTotal}</strong>
          </li>
          <li className="text-[var(--ink)]">
            Streak: <strong>{summary.streak} hari</strong>
          </li>
          <li className="text-[var(--ink)]">
            Best streak: <strong>{summary.bestStreak}</strong>
          </li>
        </ul>
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="button"
            onClick={() => void loadSession()}
            className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[#06221e] hover:bg-[var(--accent-hover)]"
          >
            Main lagi
          </button>
          <Link
            href="/quick"
            className="rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--ink)]"
          >
            Ganti level
          </Link>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--ink)]"
          >
            Dashboard
          </button>
        </div>
      </section>
    );
  }

  const card = items[index];
  if (!card) return null;
  const progress = ((index + (feedback ? 1 : 0)) / items.length) * 100;

  return (
    <article className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Soal {index + 1}/{items.length} ·{" "}
            {DIFFICULTY_LABEL_ID[card.difficulty]} · {card.moduleTitleId}
          </p>
        </div>
        <div
          className="shrink-0 text-lg tracking-widest"
          aria-label={`${hearts} nyawa`}
          title="Nyawa"
        >
          {Array.from({ length: 3 }, (_, i) => (
            <span
              key={i}
              className={i < hearts ? "text-[var(--danger)]" : "text-[var(--border)]"}
            >
              ♥
            </span>
          ))}
        </div>
      </div>

      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          Skenario
        </p>
        <p className="text-sm leading-relaxed text-[var(--ink)]">
          {card.scenario}
        </p>
        <p className="text-xs text-[var(--muted)]">{card.scenarioId}</p>
      </section>

      <section className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-medium leading-snug text-[var(--ink)]">
            {card.prompt}
          </h2>
          <SpeakButton text={card.prompt} label="Putar" />
        </div>
        <p className="text-sm text-[var(--muted)]">{card.promptId}</p>
        <p className="font-mono text-[10px] text-[var(--accent)]">
          {card.promptStructure}
        </p>
      </section>

      <ul className="space-y-3">
        {card.choices.map((choice) => {
          const isSelected = selected === choice.key;
          const showCorrect =
            feedback && choice.key === feedback.correctKey;
          const showWrong =
            feedback && isSelected && !feedback.correct;
          let border = "border-[var(--border)] bg-[var(--surface)]";
          if (showCorrect) {
            border =
              "border-[var(--success-border)] bg-[var(--success-bg)]";
          } else if (showWrong) {
            border = "border-[var(--danger)] bg-[var(--surface)]";
          } else if (isSelected) {
            border = "border-[var(--accent)] bg-[var(--accent-soft)]";
          }

          return (
            <li key={choice.key}>
              <button
                type="button"
                disabled={busy || !!feedback}
                onClick={() => void onPick(choice.key)}
                className={`w-full rounded-md border px-3 py-3 text-left transition-colors disabled:opacity-80 ${border}`}
              >
                <p className="text-sm text-[var(--ink)]">
                  <span className="mr-2 font-semibold text-[var(--accent)]">
                    {choice.key}.
                  </span>
                  {choice.text}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {choice.textId}
                </p>
              </button>
            </li>
          );
        })}
      </ul>

      {feedback ? (
        <div
          className="rounded-md border px-3 py-3 text-sm"
          style={{
            borderColor: feedback.correct
              ? "var(--success-border)"
              : "var(--warn-border)",
            background: feedback.correct
              ? "var(--success-bg)"
              : "var(--warn-bg)",
            color: feedback.correct ? "var(--success-ink)" : "var(--warn)",
          }}
        >
          <p className="font-semibold">
            {feedback.correct ? "Benar!" : "Kurang tepat"}
          </p>
          {!feedback.correct ? (
            <p className="mt-1 text-[var(--ink)]">
              Jawaban: {feedback.expected}
            </p>
          ) : null}
          <p className="mt-2 text-xs text-[var(--muted)]">
            {feedback.explanation}
          </p>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      ) : null}
    </article>
  );
}
