"use client";

import { useEffect, useRef, useState } from "react";
import {
  getSpeechRecognitionCtor,
  isSpeechRecognitionSupported,
  type SpeechRecognitionLike,
} from "@/lib/speech";

type Props = {
  onTranscript: (text: string) => void;
  disabled?: boolean;
};

export function SpeakMicButton({ onTranscript, disabled }: Props) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setSupported(isSpeechRecognitionSupported());
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  function toggle() {
    if (disabled) return;
    setError(null);
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setError("Speech recognition tidak tersedia di browser ini.");
      return;
    }

    const rec = new Ctor();
    recognitionRef.current = rec;
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (event) => {
      const text = event.results[0]?.[0]?.transcript?.trim() ?? "";
      if (text) onTranscript(text);
      setListening(false);
    };
    rec.onerror = (event) => {
      setError(event.error || "Mic error");
      setListening(false);
    };
    rec.onend = () => setListening(false);
    try {
      rec.start();
      setListening(true);
    } catch {
      setError("Tidak bisa memulai mic.");
      setListening(false);
    }
  }

  if (!supported) {
    return (
      <p className="text-xs text-[var(--muted)]">
        Mic/STT tidak didukung — ketik jawaban English di kolom di bawah.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        disabled={disabled}
        onClick={toggle}
        className={`rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 ${
          listening
            ? "bg-[var(--danger)] text-white"
            : "bg-[var(--accent)] text-[#06221e] hover:bg-[var(--accent-hover)]"
        }`}
      >
        {listening ? "Stop mic…" : "Bicara (mic)"}
      </button>
      {error ? (
        <p className="text-xs" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
