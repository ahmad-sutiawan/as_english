"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ExerciseItem } from "@/types/content";
import { SpeakButton } from "@/components/speak-button";
import { BilingualText } from "@/components/bilingual-text";
import { speak } from "@/lib/tts";

type Props = {
  item: ExerciseItem;
  moduleTitle: string;
  moduleTitleId: string;
  nextItemId: string | null;
};

type Feedback = {
  exact: boolean;
  nearMiss: boolean;
  expected: string;
  expectedId?: string;
  explanation: string;
  correctKey: string;
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
}: Props) {
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
        setError(data.error ?? "Gagal memeriksa jawaban.");
        return;
      }

      setFeedback(data);
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
  }

  return (
    <article className="space-y-8">
      <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm leading-relaxed text-[var(--muted)]">
        <p className="font-semibold text-[var(--ink)]">Cara berlatih</p>
        <ol className="mt-2 list-decimal space-y-1 pl-4">
          <li>Baca skenario &amp; pertanyaan dalam bahasa Inggris.</li>
          <li>Pahami artinya lewat terjemahan tetap di bawah teks EN.</li>
          <li>Bandingkan opsi A–D (EN + arti). Jangan diklik untuk jawab.</li>
          <li>
            Ketik ulang jawaban Inggris yang benar secara utuh — ini melatih
            menulis &amp; grammar.
          </li>
          <li>Dengar audio EN, lalu baca penjelasan belajar dalam Bahasa Indonesia.</li>
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
          Pilihan jawaban{" "}
          <span className="font-normal text-[var(--muted)]">
            — baca EN + arti, lalu ketik yang benar
          </span>
        </h2>
        <ul className="space-y-4">
          {item.choices.map((choice) => (
            <li
              key={choice.key}
              className="border-l-2 border-[var(--border)] pl-3"
            >
              <p className="text-sm leading-relaxed text-[var(--ink)]">
                <span className="mr-2 font-semibold text-[var(--muted)]">
                  {choice.key}.
                </span>
                {choice.text}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
                <span className="mr-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent)]">
                  Arti
                </span>
                {choice.textId}
              </p>
            </li>
          ))}
        </ul>
        <p className="text-xs text-[var(--muted)]">
          Opsi tidak bisa diklik sebagai jawaban. Ketik kalimat Inggris yang
          benar di bawah.
        </p>
      </section>

      {!feedback?.exact ? (
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block text-sm font-semibold text-[var(--ink)]">
            Ketik ulang jawaban Inggris secara tepat
            <textarea
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              rows={4}
              required
              className="mt-2 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm leading-relaxed text-[var(--ink)] outline-none ring-[var(--accent)] focus:ring-2"
              placeholder="Salin/ketik ulang opsi English yang benar secara penuh…"
            />
          </label>
          {error && <p className="text-sm text-red-700">{error}</p>}
          {feedback && !feedback.exact && (
            <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              {feedback.nearMiss
                ? "Hampir benar — ada typo kecil. Ketik ulang dengan lebih teliti agar mastery."
                : "Belum tepat. Bandingkan lagi opsi EN + arti, lalu ketik ulang jawaban yang benar."}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting || !typed.trim()}
            className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {submitting ? "Memeriksa…" : "Periksa jawaban"}
          </button>
        </form>
      ) : (
        <section className="space-y-4 rounded-md border border-emerald-300 bg-emerald-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-emerald-950">
              Benar — jawaban English
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
            englishClassName="text-sm leading-relaxed text-emerald-950"
          />
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-emerald-950">
              Penjelasan belajar
            </h3>
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
              Latih lagi
            </button>
            {nextItemId ? (
              <button
                type="button"
                onClick={() =>
                  router.push(`/learn/${item.moduleId}/${nextItemId}`)
                }
                className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
              >
                Soal berikutnya
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.push(`/learn/${item.moduleId}`)}
                className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
              >
                Kembali ke modul
              </button>
            )}
          </div>
        </section>
      )}
    </article>
  );
}
