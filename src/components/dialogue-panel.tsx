"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { DialogueTurn, ExerciseItem } from "@/types/content";
import { SpeakButton } from "@/components/speak-button";
import { BilingualText, StructureNote } from "@/components/bilingual-text";
import { SpeakBackPanel } from "@/components/speak-back-panel";
import { evaluateForm } from "@/lib/form-eval";
import { speak } from "@/lib/tts";

type Props = {
  item: ExerciseItem;
  moduleTitle: string;
  moduleTitleId: string;
  nextItemId: string | null;
  nextHref?: string | null;
};

export function DialoguePanel({
  item,
  moduleTitle,
  moduleTitleId,
  nextItemId,
  nextHref,
}: Props) {
  const router = useRouter();
  const turns = item.turns ?? [];
  const youTurnIndexes = useMemo(
    () =>
      turns
        .map((t, idx) => (t.speaker === "you" ? idx : -1))
        .filter((idx) => idx >= 0),
    [turns],
  );

  const [youStep, setYouStep] = useState(0);
  const [layer, setLayer] = useState<"recognize" | "produce" | "match">("recognize");
  const [typed, setTyped] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [corrections, setCorrections] = useState<string[]>([]);
  const [matched, setMatched] = useState("");
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);

  const currentYouIndex = youTurnIndexes[youStep] ?? -1;
  const currentTurn: DialogueTurn | null =
    currentYouIndex >= 0 ? turns[currentYouIndex] : null;

  const visibleTurns = turns.slice(
    0,
    completed
      ? turns.length
      : currentYouIndex >= 0
        ? currentYouIndex + 1
        : turns.length,
  );

  const correctChoice = currentTurn?.choices?.find(
    (c) => c.key === currentTurn.correctKey,
  );

  async function persistMastery(lastAnswer: string) {
    setSaving(true);
    try {
      await fetch("/api/progress/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: item.moduleId,
          itemId: item.id,
          typedAnswer: lastAnswer,
        }),
      });
    } finally {
      setSaving(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentTurn || !correctChoice) return;
    setLocalError(null);

    const result = evaluateForm({
      transcript: typed,
      models: currentTurn.modelAnswers?.length
        ? currentTurn.modelAnswers
        : [correctChoice.text],
      chunks: [],
      slots: currentTurn.slots ?? [],
      commonErrors: currentTurn.commonErrors ?? [],
    });
    if (!result.passed) {
      setCorrections(result.corrections);
      setLocalError(result.headline);
      setMatched(result.bestModel);
      setLayer("match");
      return;
    }

    speak(result.bestModel);
    setMatched(result.bestModel);
    setCorrections([]);
    setLayer("match");
    const isLast = youStep >= youTurnIndexes.length - 1;
    if (isLast) {
      await persistMastery(typed);
      setCompleted(true);
      setTyped("");
    }
  }

  return (
    <article className="space-y-8">
      <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--muted)]">
        <p className="font-semibold text-[var(--ink)]">
          Mode percakapan berantai
        </p>
        <ol className="mt-2 list-decimal space-y-1 pl-4">
          <li>Baca skenario &amp; putar giliran lawan bicara.</li>
          <li>Di giliranmu: pilih dari arti, lalu ketik English tanpa melihat opsi.</li>
          <li>Setelah benar, lanjut giliran berikutnya sampai selesai.</li>
          <li>Pakai speak-back untuk melatih lidah setelah tiap jawaban benar.</li>
        </ol>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
        <span className="font-medium text-[var(--ink)]">{moduleTitleId}</span>
        <span>·</span>
        <span>{moduleTitle}</span>
        <span>·</span>
        <span>
          Giliranmu {Math.min(youStep + 1, youTurnIndexes.length)}/
          {youTurnIndexes.length}
        </span>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-[var(--ink)]">Skenario</h2>
        <BilingualText
          english={item.scenario}
          indonesian={item.scenarioId}
          structure={item.scenarioStructure}
          structureId={item.scenarioStructureId}
          speakSlot={<SpeakButton text={item.scenario} label="Putar EN" />}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--ink)]">Percakapan</h2>
        <ul className="space-y-3">
          {visibleTurns.map((turn) => {
            const isCurrentYou =
              !completed && turn.speaker === "you" && turn.id === currentTurn?.id;
            if (isCurrentYou) return null;
            // Hide unanswered future you-turns: already sliced
            if (turn.speaker === "you") {
              // show completed you turns only (those before current)
              const turnIdx = turns.findIndex((t) => t.id === turn.id);
              if (turnIdx > currentYouIndex && !completed) return null;
            }
            return (
              <li
                key={turn.id}
                className={`rounded-md border px-3 py-3 ${
                  turn.speaker === "them"
                    ? "border-[var(--border)] bg-[var(--surface)]"
                    : "border-[var(--accent)] bg-[var(--accent-soft)]"
                }`}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
                    {turn.roleLabelId}{" "}
                    <span className="font-normal text-[var(--muted)]">
                      ({turn.roleLabel})
                    </span>
                  </p>
                  <SpeakButton text={turn.text} label="Putar EN" />
                </div>
                <BilingualText
                  english={turn.text}
                  indonesian={turn.textId}
                  structure={turn.structure}
                  structureId={turn.structureId}
                />
              </li>
            );
          })}
        </ul>
      </section>

      {!completed && currentTurn && correctChoice ? (
        <section className="space-y-4">
          <div className="rounded-md border border-[var(--accent)] bg-[var(--surface)] px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
              Giliranmu · {currentTurn.roleLabelId}
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Pilih respons terbaik, ketik ulang English-nya.
            </p>
          </div>

          {layer === "recognize" ? (
          <ul className="space-y-3">
            {(currentTurn.choices ?? []).map((choice) => (
              <li
                key={choice.key}
                className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (choice.key === currentTurn.correctKey) {
                        setLayer("produce");
                        setLocalError(null);
                      } else {
                        setLocalError("Bukan pilihan ini. Bandingkan arti dan rumusnya.");
                      }
                    }}
                    className="text-left text-sm text-[var(--ink)]"
                  >
                    <span className="mr-2 font-semibold text-[var(--accent)]">
                      {choice.key}.
                    </span>
                    {choice.textId}
                  </button>
                  <SpeakButton text={choice.text} label="Dengar" />
                </div>
                <StructureNote
                  structure={choice.structure}
                  structureId={choice.structureId}
                />
              </li>
            ))}
          </ul>
          ) : layer === "produce" ? (
          <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 text-sm text-[var(--ink)]">
            {correctChoice.textId}
            <StructureNote
              structure={correctChoice.structure}
              structureId={correctChoice.structureId}
            />
          </div>
          ) : (
          <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 text-sm">
            <p className="text-[var(--ink)]">{matched || correctChoice.text}</p>
            <p className="mt-1 text-[var(--muted)]">{correctChoice.textId}</p>
          </div>
          )}

          {layer === "produce" ? (
          <form onSubmit={onSubmit} className="space-y-3">
            <label className="block text-sm font-semibold text-[var(--ink)]">
              Ketik respons English-mu
              <textarea
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                rows={3}
                required
                className="mt-2 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] outline-none ring-[var(--accent)] focus:ring-2"
              />
            </label>
            <SpeakBackPanel
              mode="dictate"
              onUseTranscript={(t) => setTyped(t)}
            />
            {localError ? (
              <p className="text-sm" style={{ color: "var(--danger)" }}>
                {localError}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={!typed.trim()}
              className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[#06221e] disabled:opacity-50"
            >
              Kirim giliran
            </button>
          </form>
          ) : layer === "match" && !localError ? (
            <button
              type="button"
              onClick={() => {
                const isLast = youStep >= youTurnIndexes.length - 1;
                if (isLast) return;
                setYouStep((step) => step + 1);
                setLayer("recognize");
                setTyped("");
                setMatched("");
              }}
              className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[#06221e]"
            >
              Giliran berikutnya
            </button>
          ) : layer === "match" ? (
            <button
              type="button"
              onClick={() => {
                setLayer("produce");
                setLocalError(null);
                setCorrections([]);
              }}
              className="rounded-md border px-4 py-2 text-sm"
            >
              Ketik lagi
            </button>
          ) : null}
          {localError && layer === "recognize" ? (
            <p className="text-sm" style={{ color: "var(--danger)" }}>{localError}</p>
          ) : null}
          {corrections.length > 0 && layer === "match" ? (
            <ul className="list-disc pl-4 text-sm text-[var(--ink)]">
              {corrections.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {completed ? (
        <section
          className="space-y-4 rounded-md border p-4"
          style={{
            borderColor: "var(--success-border)",
            background: "var(--success-bg)",
          }}
        >
          <h2
            className="text-sm font-semibold"
            style={{ color: "var(--success-ink)" }}
          >
            Percakapan selesai
          </h2>
          <p className="text-sm" style={{ color: "var(--success)" }}>
            {item.explanation}
          </p>
          {correctChoice || turns.find((t) => t.speaker === "you") ? (
            <SpeakBackPanel
              mode="compare"
              expected={
                turns.filter((t) => t.speaker === "you").at(-1)?.text ?? ""
              }
              expectedId={
                turns.filter((t) => t.speaker === "you").at(-1)?.textId
              }
            />
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setYouStep(0);
                setCompleted(false);
                setTyped("");
                setLocalError(null);
                setLayer("recognize");
                setMatched("");
                setCorrections([]);
              }}
              className="rounded-md border px-3 py-1.5 text-sm"
              style={{
                borderColor: "var(--success-border)",
                color: "var(--success-ink)",
              }}
            >
              Ulangi dialog
            </button>
            {nextItemId ? (
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  router.push(
                    nextHref ?? `/learn/${item.moduleId}/${nextItemId}`,
                  )
                }
                className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-[#06221e]"
              >
                Dialog berikutnya
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.push(`/learn/${item.moduleId}`)}
                className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-[#06221e]"
              >
                Kembali ke modul
              </button>
            )}
          </div>
        </section>
      ) : null}
    </article>
  );
}
