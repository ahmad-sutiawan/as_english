"use client";

import { useEffect, useRef, useState } from "react";
import { scoreAnswer } from "@/lib/answer";
import {
  getSpeechRecognitionCtor,
  isSpeechRecognitionSupported,
  type SpeechRecognitionLike,
} from "@/lib/speech";
import { speak, stopSpeaking } from "@/lib/tts";

type Props = {
  /** Target English line for compare mode */
  expected?: string;
  expectedId?: string;
  /** dictate = mic → text only; compare = score against expected */
  mode?: "dictate" | "compare";
  onUseTranscript?: (text: string) => void;
};

export function SpeakBackPanel({
  expected = "",
  expectedId,
  mode = "compare",
  onUseTranscript,
}: Props) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setSupported(isSpeechRecognitionSupported());
    return () => {
      recognitionRef.current?.abort();
      stopSpeaking();
    };
  }, []);

  const result =
    mode === "compare" && transcript && expected
      ? scoreAnswer(transcript, expected)
      : null;

  const spokenOk =
    result &&
    (result.exact ||
      result.nearMiss ||
      result.distance <= Math.max(4, Math.ceil(expected.length * 0.18)));

  function startListening() {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setError("Browser tidak mendukung speech recognition. Pakai Chrome.");
      return;
    }

    setError(null);
    stopSpeaking();
    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const text = event.results[0]?.[0]?.transcript?.trim() ?? "";
      setTranscript(text);
      if (mode === "dictate" && onUseTranscript && text) {
        onUseTranscript(text);
      }
    };
    recognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        setError("Izin mikrofon ditolak. Izinkan mic di browser.");
      } else if (event.error !== "aborted") {
        setError(`Gagal mendengar: ${event.error}`);
      }
      setListening(false);
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  if (!supported) {
    return (
      <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm text-[var(--muted)]">
        <p className="font-semibold text-[var(--ink)]">Speak-back</p>
        <p className="mt-1">
          Browser ini belum mendukung speech recognition. Pakai Chrome untuk
          latihan bicara.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-3">
      <div>
        <p className="text-sm font-semibold text-[var(--ink)]">
          {mode === "dictate"
            ? "Dictate — isi jawaban lewat mic"
            : "Speak-back — cocokkan dengan model"}
        </p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          {mode === "dictate"
            ? "Ucapkan opsi English yang kamu pilih. Hasil mic bisa masuk ke kotak ketik. Putar opsi A–D di atas untuk mendengar model tanpa spoiler jawaban benar."
            : "Dengarkan model, lalu ucapkan. Sistem membandingkan ucapanmu (toleransi ASR lebih longgar)."}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {mode === "compare" && expected ? (
          <button
            type="button"
            onClick={() => speak(expected)}
            className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-medium text-[var(--ink)] hover:border-[var(--accent)]"
          >
            ▶ Putar model EN
          </button>
        ) : null}
        {!listening ? (
          <button
            type="button"
            onClick={startListening}
            className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-[#06221e] hover:bg-[var(--accent-hover)]"
          >
            ● Rekam ucapan
          </button>
        ) : (
          <button
            type="button"
            onClick={stopListening}
            className="rounded-md border px-3 py-1.5 text-xs font-medium"
            style={{
              borderColor: "var(--danger-border)",
              color: "var(--danger)",
              background: "var(--danger-bg)",
            }}
          >
            ■ Stop
          </button>
        )}
        {transcript && onUseTranscript && mode === "compare" ? (
          <button
            type="button"
            onClick={() => onUseTranscript(transcript)}
            className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] hover:text-[var(--ink)]"
          >
            Pakai ke kotak ketik
          </button>
        ) : null}
      </div>

      {listening ? (
        <p className="text-xs text-[var(--accent)]">
          Mendengarkan… bicara sekarang.
        </p>
      ) : null}
      {error ? (
        <p className="text-xs" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      ) : null}

      {transcript ? (
        <div className="space-y-2">
          <p className="text-xs text-[var(--muted)]">Yang terdengar:</p>
          <p className="text-sm text-[var(--ink)]">&ldquo;{transcript}&rdquo;</p>
          {mode === "compare" && expected ? (
            <>
              <p className="text-xs text-[var(--muted)]">Target:</p>
              <p className="text-sm text-[var(--ink)]">&ldquo;{expected}&rdquo;</p>
              {expectedId ? (
                <p className="text-xs text-[var(--muted)]">
                  <span className="text-[var(--accent)]">Arti · </span>
                  {expectedId}
                </p>
              ) : null}
              <p
                className="text-sm font-medium"
                style={{
                  color: spokenOk ? "var(--success)" : "var(--warn)",
                }}
              >
                {spokenOk
                  ? result?.exact
                    ? "Ucapan sangat dekat / tepat — bagus!"
                    : "Cukup dekat (ASR). Ulangi sampai lebih mirip model."
                  : "Masih jauh dari model. Putar lagi, lalu ucapkan perlahan."}
              </p>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
