"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { BuildDrill, BuildSlot, BuildStep } from "@/types/build";
import { SpeakButton } from "@/components/speak-button";
import { speak } from "@/lib/tts";

type Chip = { id: string; text: string };

type Feedback = {
  correct: boolean;
  sentence: string;
  sentenceId: string;
  why: string;
  pattern: string;
  slots: BuildSlot[];
};

type Summary = {
  drillsDone: number;
  wrongChecks: number;
  xpGained: number;
  xpTotal: number;
  streak: number;
  bestStreak: number;
};

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function chipsFor(step: BuildStep): Chip[] {
  const texts = [...step.tokens, ...step.distractors];
  return shuffle(texts.map((text, index) => ({ id: `${index}-${text}`, text })));
}

export function BuildSession() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<BuildDrill[]>([]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"assemble" | "transform">("assemble");
  const [bank, setBank] = useState<Chip[]>([]);
  const [placed, setPlaced] = useState<Chip[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busy, setBusy] = useState(false);
  const [wrongChecks, setWrongChecks] = useState(0);
  const [summary, setSummary] = useState<Summary | null>(null);

  const drill = items[index] ?? null;
  const step: BuildStep | null = drill
    ? phase === "assemble"
      ? drill.assemble
      : drill.transform
    : null;

  const loadSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSummary(null);
    setFeedback(null);
    setIndex(0);
    setPhase("assemble");
    setWrongChecks(0);
    setPlaced([]);
    setBank([]);
    try {
      const res = await fetch("/api/build/session", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal memuat sesi.");
        setItems([]);
        return;
      }
      const nextItems = data.items as BuildDrill[];
      setItems(nextItems);
      if (nextItems[0]) {
        setBank(chipsFor(nextItems[0].assemble));
      }
    } catch {
      setError("Koneksi gagal.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  const progressLabel = useMemo(() => {
    if (!items.length) return "";
    return `${index + 1} / ${items.length}`;
  }, [index, items.length]);

  function placeChip(chip: Chip) {
    if (busy || feedback?.correct) return;
    setFeedback(null);
    setBank((prev) => prev.filter((c) => c.id !== chip.id));
    setPlaced((prev) => [...prev, chip]);
  }

  function unplaceChip(chip: Chip) {
    if (busy || feedback?.correct) return;
    setFeedback(null);
    setPlaced((prev) => prev.filter((c) => c.id !== chip.id));
    setBank((prev) => [...prev, chip]);
  }

  async function finish(drillsDone: number, misses: number) {
    try {
      const res = await fetch("/api/build/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drillsDone,
          wrongChecks: misses,
          perfect: misses === 0,
        }),
      });
      const data = await res.json();
      setSummary({
        drillsDone,
        wrongChecks: misses,
        xpGained: data.xpGained ?? 0,
        xpTotal: data.xpTotal ?? 0,
        streak: data.streak ?? 0,
        bestStreak: data.bestStreak ?? 0,
      });
    } catch {
      setSummary({
        drillsDone,
        wrongChecks: misses,
        xpGained: 0,
        xpTotal: 0,
        streak: 0,
        bestStreak: 0,
      });
    }
  }

  function goNext(fromPhase: "assemble" | "transform", misses: number) {
    if (!drill || busy) return;
    if (fromPhase === "assemble") {
      setPhase("transform");
      setFeedback(null);
      setPlaced([]);
      setBank(chipsFor(drill.transform));
      return;
    }
    const isLast = index >= items.length - 1;
    if (isLast) {
      setBusy(true);
      void finish(items.length, misses);
      return;
    }
    const next = items[index + 1];
    setIndex(index + 1);
    setPhase("assemble");
    setFeedback(null);
    setPlaced([]);
    setBank(chipsFor(next.assemble));
  }

  async function onCheck() {
    if (!drill || !step || busy || placed.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/build/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drillId: drill.id,
          step: phase,
          tokens: placed.map((c) => c.text),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal memeriksa.");
        return;
      }
      const fb: Feedback = {
        correct: data.correct,
        sentence: data.sentence,
        sentenceId: data.sentenceId,
        why: data.why,
        pattern: data.pattern,
        slots: data.slots,
      };
      setFeedback(fb);
      if (!data.correct) {
        setWrongChecks((count) => count + 1);
      }
      if (data.correct) {
        speak(data.sentence);
      }
    } catch {
      setError("Koneksi gagal.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-[var(--muted)]">Menyiapkan kalimat…</p>;
  }

  if (error && items.length === 0) {
    return (
      <p className="text-sm text-[var(--danger)]" role="alert">
        {error}
      </p>
    );
  }

  if (summary) {
    return (
      <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-5 py-6">
        <h2 className="font-display text-2xl text-[var(--ink)]">Sesi selesai</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {summary.drillsDone} kalimat disusun.
          {summary.wrongChecks === 0
            ? " Semua benar pada percobaan pertama."
            : ` ${summary.wrongChecks} langkah perlu diperbaiki dulu.`}
        </p>
        <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">XP sesi</dt>
            <dd className="mt-1 text-xl font-semibold text-[var(--accent)]">+{summary.xpGained}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">Streak</dt>
            <dd className="mt-1 text-xl font-semibold text-[var(--ink)]">{summary.streak} hari</dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void loadSession()}
            className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[#06221e] hover:bg-[var(--accent-hover)]"
          >
            Latihan lagi
          </button>
          <Link
            href="/build"
            className="rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--ink)] hover:border-[var(--accent)]"
          >
            Kembali ke lobby
          </Link>
        </div>
      </section>
    );
  }

  if (!drill || !step) return null;

  return (
    <section>
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-[var(--muted)]">
        <span>{progressLabel}</span>
        <span>{phase === "assemble" ? "Susun" : step.command}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
        <div
          className="h-full bg-[var(--accent)]"
          style={{ width: `${(index / items.length) * 100}%` }}
        />
      </div>

      <p className="mt-6 text-sm text-[var(--muted)]">Arti</p>
      <p className="mt-1 text-lg text-[var(--ink)]">{drill.meaningId}</p>
      <p className="mt-3 text-xs text-[var(--accent)]">{drill.pattern}</p>

      {phase === "transform" && step.commandId ? (
        <p className="mt-4 rounded-md border border-[var(--accent)] bg-[var(--accent-soft)] px-3 py-2 text-sm text-[var(--ink)]">
          {step.commandId}
          {step.command ? ` · ${step.command}` : ""}
        </p>
      ) : (
        <p className="mt-4 text-sm text-[var(--muted)]">Susun chip menjadi kalimat English.</p>
      )}

      <div className="mt-4 min-h-16 rounded-md border border-dashed border-[var(--border)] bg-[var(--surface)] px-3 py-3">
        {placed.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Ketuk chip di bawah.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {placed.map((chip) => (
              <li key={chip.id}>
                <button
                  type="button"
                  onClick={() => unplaceChip(chip)}
                  className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-[#06221e]"
                >
                  {chip.text}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ul className="mt-4 flex flex-wrap gap-2">
        {bank.map((chip) => (
          <li key={chip.id}>
            <button
              type="button"
              onClick={() => placeChip(chip)}
              className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-sm text-[var(--ink)] hover:border-[var(--accent)]"
            >
              {chip.text}
            </button>
          </li>
        ))}
      </ul>

      {error ? (
        <p className="mt-4 text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : null}

      {feedback ? (
        <div
          className={`mt-5 rounded-md border px-4 py-3 text-sm ${
            feedback.correct
              ? "border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-ink)]"
              : "border-[var(--warn-border)] bg-[var(--warn-bg)] text-[var(--ink)]"
          }`}
        >
          <p className="font-medium">
            {feedback.correct ? "Benar." : "Hampir. Lihat fungsi tiap bagian."}
          </p>
          <p className="mt-2">{feedback.sentence}</p>
          <p className="mt-1 text-[var(--muted)]">{feedback.sentenceId}</p>
          <p className="mt-2">{feedback.why}</p>
          <p className="mt-2 text-xs uppercase tracking-wide text-[var(--accent)]">
            {feedback.pattern}
          </p>
          {!feedback.correct ? (
            <ul className="mt-3 space-y-1">
              {feedback.slots.map((slot) => (
                <li key={`${slot.role}-${slot.text}`}>
                  <span className="text-[var(--muted)]">{slot.roleId}: </span>
                  {slot.text}
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-3">
              <SpeakButton text={feedback.sentence} />
            </div>
          )}
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        {feedback?.correct ? (
          <button
            type="button"
            onClick={() => goNext(phase, wrongChecks)}
            disabled={busy}
            className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[#06221e] hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            Lanjut
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void onCheck()}
            disabled={busy || placed.length === 0}
            className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[#06221e] hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            Cek
          </button>
        )}
      </div>
    </section>
  );
}
