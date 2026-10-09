"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ExerciseItem } from "@/types/content";
import { SpeakButton } from "@/components/speak-button";
import { BilingualText, StructureNote } from "@/components/bilingual-text";
import { SpeakBackPanel } from "@/components/speak-back-panel";
import { speak } from "@/lib/tts";

type Props = {
  item: ExerciseItem;
  moduleTitle: string;
  moduleTitleId: string;
  nextItemId: string | null;
  /** Optional full next URL (preserves ?level= / ?from=) */
  nextHref?: string | null;
};

type Layer = "recognize" | "produce" | "match";

type Feedback = {
  exact: boolean;
  nearMiss: boolean;
  expected: string;
  expectedId?: string;
  explanation: string;
  correctKey: string;
  missedTokens?: string[];
  corrections?: string[];
  headline?: string;
};

const DIFFICULTY_ID: Record<string, string> = {
  junior: "pemula",
  mid: "menengah",
  senior: "senior",
};

export function ExercisePanel({
  item,
  moduleTitle,
  moduleTitleId,
  nextItemId,
  nextHref,
}: Props) {
  const router = useRouter();
  const [layer, setLayer] = useState<Layer>("recognize");
  const [typed, setTyped] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recognizeNote, setRecognizeNote] = useState<string | null>(null);

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
        setError(data.error ?? "Gagal memeriksa jawaban.");
        return;
      }

      setFeedback(data);
      setLayer("match");
      if (data.exact && data.expected) {
        speak(data.expected);
      }
    } catch {
      setError("Koneksi gagal. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  function retry() {
    setFeedback(null);
    setTyped("");
    setError(null);
    setLayer("produce");
  }

  function recognize(key: string) {
    if (key === item.correctKey) {
      setRecognizeNote(null);
      setLayer("produce");
      return;
    }
    setRecognizeNote("Bukan pilihan ini. Bandingkan arti dan rumus strukturnya.");
  }

  return (
    <article className="space-y-8">
      <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm leading-relaxed text-[var(--muted)]">
        <p className="font-semibold text-[var(--ink)]">Cara berlatih</p>
        <ol className="mt-2 list-decimal space-y-1 pl-4">
          <li>Baca skenario &amp; pertanyaan dalam bahasa Inggris.</li>
          <li>
            Pahami artinya lewat terjemahan, lalu baca rumus struktur kalimat di
            bawahnya.
          </li>
          <li>Pilih opsi dari arti dan rumus. Teks English jawaban disembunyikan.</li>
          <li>Setelah pilihan benar, ketik kalimat English dari arti itu.</li>
          <li>Baru setelah jawaban masuk, bandingkan dengan kalimat model.</li>
        </ol>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
        <span className="font-medium text-[var(--ink)]">{moduleTitleId}</span>
        <span aria-hidden>·</span>
        <span>{moduleTitle}</span>
        <span aria-hidden>·</span>
        <span>{DIFFICULTY_ID[item.difficulty] ?? item.difficulty}</span>
        <span aria-hidden>·</span>
        <span>{item.id}</span>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-[var(--ink)]">
          Skenario{" "}
          <span className="font-normal text-[var(--muted)]">(English)</span>
        </h2>
        <BilingualText
          english={item.scenario}
          indonesian={item.scenarioId}
          structure={item.scenarioStructure}
          structureId={item.scenarioStructureId}
          speakSlot={
            (item.tts?.scenario ?? true) ? (
              <SpeakButton text={item.scenario} label="Putar EN" />
            ) : undefined
          }
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-[var(--ink)]">
          Pertanyaan{" "}
          <span className="font-normal text-[var(--muted)]">(English)</span>
        </h2>
        <BilingualText
          english={item.prompt}
          indonesian={item.promptId}
          structure={item.promptStructure}
          structureId={item.promptStructureId}
          englishClassName="text-lg font-medium leading-snug text-[var(--ink)]"
          speakSlot={
            (item.tts?.prompt ?? true) ? (
              <SpeakButton text={item.prompt} label="Putar EN" />
            ) : undefined
          }
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--ink)]">
          {layer === "recognize" ? "Kenali" : layer === "produce" ? "Keluarkan" : "Cocokkan"}{" "}
          <span className="font-normal text-[var(--muted)]">
            {layer === "recognize"
              ? "— pilih dari arti, tanpa membaca kalimat English"
              : layer === "produce"
                ? "— ketik English dari arti yang benar"
                : "— bandingkan dengan kalimat model"}
          </span>
        </h2>
        {layer === "recognize" ? (
          <ul className="space-y-4">
            {item.choices.map((choice) => (
              <li
                key={choice.key}
                className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => recognize(choice.key)}
                    className="min-w-0 flex-1 text-left text-sm leading-relaxed text-[var(--ink)]"
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
        ) : (
          <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3">
            <p className="text-sm leading-relaxed text-[var(--ink)]">
              {correctChoice?.textId}
            </p>
            <StructureNote
              structure={correctChoice?.structure ?? ""}
              structureId={correctChoice?.structureId ?? ""}
            />
          </div>
        )}
        {recognizeNote ? (
          <p className="text-sm" style={{ color: "var(--warn)" }}>
            {recognizeNote}
          </p>
        ) : null}
      </section>

      {layer === "produce" ? (
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block text-sm font-semibold text-[var(--ink)]">
            Ketik kalimat English dari arti di atas
            <textarea
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              rows={4}
              required
              className="mt-2 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm leading-relaxed text-[var(--ink)] outline-none ring-[var(--accent)] placeholder:text-[var(--muted)] focus:ring-2"
              placeholder="Tulis kalimat English lengkap…"
            />
          </label>
          <SpeakBackPanel
            mode="dictate"
            onUseTranscript={(text) => setTyped(text)}
          />
          {error && (
            <p className="text-sm" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting || !typed.trim()}
            className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[#06221e] hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {submitting ? "Memeriksa…" : "Periksa jawaban"}
          </button>
        </form>
      ) : layer === "match" && feedback ? (
        <section
          className="space-y-4 rounded-md border p-4"
          style={{
            borderColor: "var(--success-border)",
            background: "var(--success-bg)",
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <h2
              className="text-sm font-semibold"
              style={{ color: "var(--success-ink)" }}
            >
              {feedback.exact ? "Cocok — jawaban English" : feedback.headline ?? "Belum tepat"}
            </h2>
            {(item.tts?.answer ?? true) && correctChoice && (
              <SpeakButton text={correctChoice.text} label="Putar EN" />
            )}
          </div>
          <BilingualText
            english={`${feedback.correctKey}. ${feedback.expected}`}
            indonesian={
              feedback.expectedId ??
              correctChoice?.textId ??
              "Lihat arti pada opsi di atas."
            }
            structure={correctChoice?.structure}
            structureId={correctChoice?.structureId}
            englishClassName="text-sm leading-relaxed text-[var(--success-ink)]"
          />
          <div className="space-y-2">
            <h3
              className="text-sm font-semibold"
              style={{ color: "var(--success-ink)" }}
            >
              Penjelasan belajar
            </h3>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--success)" }}
            >
              {feedback.explanation}
            </p>
            {feedback.corrections && feedback.corrections.length > 0 ? (
              <ul className="list-disc space-y-1 pl-4 text-sm text-[var(--ink)]">
                {feedback.corrections.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            ) : null}
            {feedback.missedTokens && feedback.missedTokens.length > 0 ? (
              <p className="text-sm text-[var(--ink)]">
                Kata yang belum kena: {feedback.missedTokens.join(", ")}
              </p>
            ) : null}
          </div>
          <SpeakBackPanel
            mode="compare"
            expected={feedback.expected}
            expectedId={
              feedback.expectedId ?? correctChoice?.textId
            }
          />
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={retry}
              className="rounded-md border px-3 py-1.5 text-sm"
              style={{
                borderColor: "var(--success-border)",
                color: "var(--success-ink)",
              }}
            >
              Latih lagi
            </button>
            {feedback.exact && nextItemId ? (
              <button
                type="button"
                onClick={() =>
                  router.push(
                    nextHref ?? `/learn/${item.moduleId}/${nextItemId}`,
                  )
                }
                className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-[#06221e] hover:bg-[var(--accent-hover)]"
              >
                Soal berikutnya
              </button>
            ) : feedback.exact ? (
              <button
                type="button"
                onClick={() => router.push(`/learn/${item.moduleId}`)}
                className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-[#06221e] hover:bg-[var(--accent-hover)]"
              >
                Kembali ke modul
              </button>
            ) : null}
          </div>
        </section>
      ) : null}
    </article>
  );
}
