"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { SpeakEvalResult, SpeakItem, SpeakLevel, SpeakPhase } from "@/types/speak";
import { playTargetAudio } from "@/lib/speak-audio";
import { SpeakMicButton } from "@/components/speak-mic-button";

type Props = {
  level: SpeakLevel | "all";
  caPort?: string;
};

type Summary = {
  xpGained: number;
  xp: number;
  streak: number;
  attempt1: number;
  attempt2: number;
  mastered: boolean;
};

function PronunciationGuide({
  item,
  onPlay,
  playLabel = "Putar audio",
  showEnglish = true,
}: {
  item: SpeakItem;
  onPlay: () => void;
  playLabel?: string;
  showEnglish?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-4">
      <p className="text-xs uppercase tracking-[0.16em] text-[var(--accent)]">
        {showEnglish ? "Panduan ucapan" : "Arti yang harus diucapkan"}
      </p>
      {showEnglish ? (
        <p className="mt-2 text-xl leading-snug text-[var(--ink)]">{item.target}</p>
      ) : null}
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{item.targetId}</p>
      {!showEnglish && item.keywords.length > 0 ? (
        <p className="mt-2 text-xs text-[var(--accent)]">
          Kata kunci: {item.keywords.join(", ")}
        </p>
      ) : null}
      {showEnglish && item.chunks.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Potongan kalimat">
          {item.chunks.map((chunk, index) => (
            <li
              key={`${chunk}-${index}`}
              className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--ink)]"
            >
              {chunk}
            </li>
          ))}
        </ul>
      ) : null}
      <button
        type="button"
        onClick={onPlay}
        className="mt-4 inline-flex h-10 items-center rounded-full bg-[var(--accent)] px-4 text-sm font-medium text-[#06221e] hover:bg-[var(--accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      >
        {playLabel}
      </button>
    </div>
  );
}

function shuffleLocal(arr: string[]): string[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function SpeakSession({ level, caPort = "8011" }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [item, setItem] = useState<SpeakItem | null>(null);
  const [phase, setPhase] = useState<SpeakPhase>("listen");
  const [heard, setHeard] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState<SpeakEvalResult | null>(null);
  const [pool, setPool] = useState<string[]>([]);
  const [arranged, setArranged] = useState<string[]>([]);
  const [builderOk, setBuilderOk] = useState(false);
  const [attempt1, setAttempt1] = useState(0);
  const [attempt2, setAttempt2] = useState(0);
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [typedFallback, setTypedFallback] = useState("");
  const [insecure, setInsecure] = useState(false);
  const [caHref, setCaHref] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSummary(null);
    setFeedback(null);
    setHeard(false);
    setTranscript("");
    setTypedFallback("");
    setArranged([]);
    setBuilderOk(false);
    setAttempt1(0);
    setAttempt2(0);
    setPhase("listen");
    try {
      const res = await fetch("/api/speak/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal memuat sesi.");
        setItem(null);
        return;
      }
      const next = data.item as SpeakItem;
      setItem(next);
      setPool(shuffleLocal(next.scrambled));
    } catch {
      setError("Koneksi gagal.");
    } finally {
      setLoading(false);
    }
  }, [level]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setInsecure(window.isSecureContext === false);
    setCaHref(`http://${window.location.hostname}:${caPort}/rootCA.pem`);
  }, [caPort]);

  const phaseLabel = useMemo(() => {
    switch (phase) {
      case "listen":
        return "1 · Listen";
      case "retrieve":
        return "2 · Retrieve (Speak)";
      case "construct":
        return "3 · Construct";
      case "speak_target":
        return "4 · Speak it";
      case "scenario":
        return "5 · Work scenario";
      case "say_again":
        return "6 · Say again";
      default:
        return "Selesai";
    }
  }, [phase]);

  function playAudio() {
    if (!item) return;
    playTargetAudio(item.target, item.audio, () => setHeard(true));
    setHeard(true);
  }

  async function submitSpeech(slot: 1 | 2, nextPhase: SpeakPhase, phaseName: string) {
    if (!item || busy) return;
    const text = (transcript || typedFallback).trim();
    if (!text) {
      setError("Ucapkan atau ketik jawaban English dulu.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/speak/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          phase: phaseName,
          transcript: text,
          attemptSlot: slot,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal evaluasi.");
        return;
      }
      setFeedback(data);
      if (slot === 1) setAttempt1(data.passed ? 1 : 0);
      if (slot === 2) setAttempt2(data.passed ? 1 : 0);
      setTranscript("");
      setTypedFallback("");
      window.setTimeout(() => {
        setFeedback(null);
        setPhase(nextPhase);
        setBusy(false);
      }, 1600);
    } catch {
      setError("Koneksi gagal.");
      setBusy(false);
    }
  }

  async function checkBuilder() {
    if (!item || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/speak/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          phase: "construct",
          arranged,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal cek.");
        return;
      }
      if (data.correct) {
        setBuilderOk(true);
        setFeedback({
          passed: true,
          nearMiss: false,
          exact: true,
          corrections: [],
          missedTokens: [],
          suggestion: data.target,
          headline: "Susunan benar. Sekarang ucapkan.",
          bestModel: data.target,
        });
        window.setTimeout(() => {
          setFeedback(null);
          setPhase("speak_target");
          setBusy(false);
        }, 1000);
      } else {
        setError("Belum tepat — coba susun ulang chunks-nya.");
        setBusy(false);
      }
    } catch {
      setError("Koneksi gagal.");
      setBusy(false);
    }
  }

  async function finish(mastered: boolean) {
    try {
      const res = await fetch("/api/speak/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mastered }),
      });
      const data = await res.json();
      setSummary({
        xpGained: data.xpGained ?? 0,
        xp: data.xp ?? 0,
        streak: data.streak ?? 0,
        attempt1,
        attempt2,
        mastered,
      });
      setPhase("done");
    } catch {
      setSummary({
        xpGained: 0,
        xp: 0,
        streak: 0,
        attempt1,
        attempt2,
        mastered,
      });
      setPhase("done");
    }
  }

  function addChunk(chunk: string, fromPool: boolean) {
    if (builderOk) return;
    if (fromPool) {
      setPool((p) => {
        const i = p.indexOf(chunk);
        if (i < 0) return p;
        const next = [...p];
        next.splice(i, 1);
        return next;
      });
      setArranged((a) => [...a, chunk]);
    }
  }

  function removeChunk(index: number) {
    if (builderOk) return;
    setArranged((a) => {
      const next = [...a];
      const [removed] = next.splice(index, 1);
      if (removed) setPool((p) => [...p, removed]);
      return next;
    });
  }

  if (loading) {
    return <p className="text-sm text-[var(--muted)]">Menyiapkan sesi bicara…</p>;
  }

  if (error && !item) {
    return (
      <div className="space-y-3">
        <p className="text-sm" style={{ color: "var(--danger)" }}>
          {error}
        </p>
        <Link href="/speak" className="text-sm text-[var(--accent)]">
          ← Lobby
        </Link>
      </div>
    );
  }

  if (!item) return null;

  if (phase === "done" && summary) {
    return (
      <section
        className="space-y-4 rounded-md border p-5"
        style={{
          borderColor: "var(--success-border)",
          background: "var(--success-bg)",
        }}
      >
        <h2
          className="font-display text-2xl"
          style={{ color: "var(--success-ink)" }}
        >
          Sesi selesai
        </h2>
        <ul className="space-y-1 text-sm text-[var(--ink)]">
          <li>
            Ucapan pertama: <strong>{summary.attempt1 ? "lulus" : "belum"}</strong>
          </li>
          <li>
            Ucapan kedua: <strong>{summary.attempt2 ? "lulus" : "belum"}</strong>
          </li>
          <li>
            XP: <strong>+{summary.xpGained}</strong> (total {summary.xp})
          </li>
          <li>
            Streak: <strong>{summary.streak} hari</strong>
          </li>
        </ul>
        <p className="text-base text-[var(--ink)]">{item.target}</p>
        <p className="text-sm text-[var(--muted)]">{item.targetId}</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[#06221e]"
          >
            Item berikutnya
          </button>
          <Link
            href="/speak"
            className="rounded-md border border-[var(--border)] px-4 py-2 text-sm"
          >
            Lobby
          </Link>
        </div>
      </section>
    );
  }

  return (
    <article className="space-y-6">
      {insecure ? (
        <div className="rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-bg)] px-4 py-4 text-sm text-[var(--ink)]">
          <p className="font-medium">Mic tidak hidup di alamat HTTP.</p>
          <p className="mt-2 leading-relaxed text-[var(--muted)]">
            HP harus membuka situs lewat HTTPS dan mempercayai CA lokal. Unduh
            sertifikat sekali, pasang sebagai CA, lalu buka ulang lewat https
            pada port yang sama.
          </p>
          {caHref ? (
            <a
              href={caHref}
              className="mt-3 inline-flex h-10 items-center text-sm font-medium text-[var(--danger)] underline"
            >
              Unduh rootCA.pem
            </a>
          ) : null}
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-[var(--muted)]">
            <li>Android: Setelan, Keamanan, pasang sertifikat CA.</li>
            <li>
              iPhone: pasang profil, lalu aktifkan di Setelan, Umum, Tentang,
              Pengaturan Kepercayaan Sertifikat.
            </li>
          </ol>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]">
        <span className="font-semibold text-[var(--accent)]">{phaseLabel}</span>
        <span>
          {item.category} · {item.level} · {item.id}
        </span>
      </div>

      {phase === "listen" ? (
        <section className="space-y-4 rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="text-lg font-medium text-[var(--ink)]">Listen</h2>
          <p className="text-sm text-[var(--muted)]">
            Dengarkan kalimat kerja. Teks English hanya tampil di langkah ini.
          </p>
          <PronunciationGuide item={item} onPlay={playAudio} />
          <button
            type="button"
            disabled={!heard}
            onClick={() => setPhase("retrieve")}
            className="inline-flex h-10 items-center rounded-full border border-[var(--border)] px-4 text-sm text-[var(--ink)] disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            Lanjut: What did they say?
          </button>
        </section>
      ) : null}

      {phase === "retrieve" ? (
        <section className="space-y-4 rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="text-lg font-medium text-[var(--ink)]">
            What did they say?
          </h2>
          <p className="text-sm text-[var(--muted)]">
            Ucapkan kembali kalimat itu. Yang terlihat hanya artinya.
          </p>
          <PronunciationGuide
            item={item}
            onPlay={playAudio}
            playLabel="Dengar lagi"
            showEnglish={false}
          />
          <SpeakMicButton
            disabled={busy}
            onTranscript={(t) => setTranscript(t)}
          />
          <textarea
            value={transcript || typedFallback}
            onChange={(e) => {
              setTypedFallback(e.target.value);
              setTranscript(e.target.value);
            }}
            rows={2}
            placeholder="Transcript / ketik English…"
            className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--ink)]"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void submitSpeech(1, "construct", "retrieve")
            }
            className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[#06221e] disabled:opacity-50"
          >
            Periksa
          </button>
        </section>
      ) : null}

      {phase === "construct" ? (
        <section className="space-y-4 rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="text-lg font-medium text-[var(--ink)]">
            Construct the sentence
          </h2>
          <p className="text-sm text-[var(--muted)]">
            Ketuk potongan kata untuk menyusun kalimat target.
          </p>
          <div className="min-h-12 rounded-md border border-dashed border-[var(--accent)] bg-[var(--accent-soft)] p-3">
            <div className="flex flex-wrap gap-2">
              {arranged.length === 0 ? (
                <span className="text-xs text-[var(--muted)]">
                  Susunan Anda di sini…
                </span>
              ) : (
                arranged.map((c, i) => (
                  <button
                    key={`${c}-${i}`}
                    type="button"
                    onClick={() => removeChunk(i)}
                    className="rounded-md border border-[var(--accent)] bg-[var(--surface)] px-2 py-1 text-sm text-[var(--ink)]"
                  >
                    {c}
                  </button>
                ))
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {pool.map((c, i) => (
              <button
                key={`${c}-p-${i}`}
                type="button"
                onClick={() => addChunk(c, true)}
                className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 text-sm text-[var(--ink)]"
              >
                {c}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={busy || arranged.length === 0}
            onClick={() => void checkBuilder()}
            className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[#06221e] disabled:opacity-50"
          >
            Cek susunan
          </button>
        </section>
      ) : null}

      {phase === "speak_target" ? (
        <section className="space-y-4 rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="text-lg font-medium text-[var(--ink)]">Speak it</h2>
          <p className="text-sm text-[var(--muted)]">
            Ucapkan kalimat yang sama tanpa membaca teks.
          </p>
          <PronunciationGuide
            item={item}
            onPlay={() => playTargetAudio(item.target, item.audio)}
            playLabel="Putar model"
            showEnglish={false}
          />
          <SpeakMicButton
            disabled={busy}
            onTranscript={(t) => setTranscript(t)}
          />
          <textarea
            value={transcript || typedFallback}
            onChange={(e) => {
              setTypedFallback(e.target.value);
              setTranscript(e.target.value);
            }}
            rows={2}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void submitSpeech(1, "scenario", "speak_target")}
            className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[#06221e]"
          >
            Periksa pengucapan
          </button>
        </section>
      ) : null}

      {phase === "scenario" ? (
        <section className="space-y-4 rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="text-lg font-medium text-[var(--ink)]">
            Work scenario
          </h2>
          <p className="text-sm font-medium text-[var(--ink)]">{item.scenario}</p>
          <p className="text-xs text-[var(--muted)]">{item.scenarioId}</p>
          <p className="text-sm text-[var(--muted)]">
            Sampaikan maksud yang sama dengan kata-kata Anda. Beberapa kalimat
            model diterima selama bentuknya cocok.
          </p>
          <p className="text-sm text-[var(--ink)]">{item.targetId}</p>
          <SpeakMicButton
            disabled={busy}
            onTranscript={(t) => setTranscript(t)}
          />
          <textarea
            value={transcript || typedFallback}
            onChange={(e) => {
              setTypedFallback(e.target.value);
              setTranscript(e.target.value);
            }}
            rows={3}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void submitSpeech(1, "say_again", "scenario")}
            className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[#06221e]"
          >
            Kirim jawaban
          </button>
        </section>
      ) : null}

      {phase === "say_again" ? (
        <section className="space-y-4 rounded-md border border-[var(--accent)] bg-[var(--accent-soft)] p-5">
          <h2 className="text-lg font-medium text-[var(--ink)]">
            🔁 Say it again
          </h2>
          <p className="text-sm text-[var(--muted)]">
            Ulangi sekali lagi tanpa melihat teks.
          </p>
          <PronunciationGuide
            item={item}
            onPlay={() => playTargetAudio(item.target, item.audio)}
            playLabel="Dengar lagi"
            showEnglish={false}
          />
          <SpeakMicButton
            disabled={busy}
            onTranscript={(t) => setTranscript(t)}
          />
          <textarea
            value={transcript || typedFallback}
            onChange={(e) => {
              setTypedFallback(e.target.value);
              setTranscript(e.target.value);
            }}
            rows={2}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              if (!item || busy) return;
              const text = (transcript || typedFallback).trim();
              if (!text) {
                setError("Ucapkan lagi dulu.");
                return;
              }
              setBusy(true);
              try {
                const res = await fetch("/api/speak/attempt", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    itemId: item.id,
                    phase: "say_again",
                    transcript: text,
                    attemptSlot: 2,
                  }),
                });
                const data = await res.json();
                setFeedback(data);
                setAttempt2(data.passed ? 1 : 0);
                const mastered = Boolean(data.passed);
                window.setTimeout(() => {
                  void finish(mastered);
                  setBusy(false);
                }, 1200);
              } catch {
                setError("Koneksi gagal.");
                setBusy(false);
              }
            }}
            className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[#06221e]"
          >
            Selesai & bandingkan
          </button>
        </section>
      ) : null}

      {feedback ? (
        <div
          className="rounded-md border px-3 py-3 text-sm"
          style={{
            borderColor: "var(--success-border)",
            background: "var(--success-bg)",
            color: "var(--success-ink)",
          }}
        >
          <p className="font-semibold">{feedback.headline}</p>
          {feedback.missedTokens.length > 0 ? (
            <p className="mt-1 text-[var(--muted)]">
              Belum kena: {feedback.missedTokens.join(", ")}
            </p>
          ) : null}
          {feedback.corrections.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-4 text-[var(--ink)]">
              {feedback.corrections.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          ) : null}
          {feedback.suggestion ? (
            <p className="mt-2 text-[var(--ink)]">
              More natural: <em>{feedback.suggestion}</em>
            </p>
          ) : null}
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
