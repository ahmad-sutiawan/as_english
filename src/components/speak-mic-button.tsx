"use client";

import { useEffect, useRef, useState } from "react";
import {
  isSpeechRecognitionSupported,
  listenOnce,
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

    const rec = listenOnce(
      (text) => onTranscript(text),
      (message) => setError(message),
      () => setListening(false),
    );
    recognitionRef.current = rec;
    if (rec) setListening(true);
  }

  if (!supported) {
    return (
      <p className="text-xs text-[var(--muted)]">
        Mic tidak didukung di browser ini. Pakai Chrome, lewat HTTPS.
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
