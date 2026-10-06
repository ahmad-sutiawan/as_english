"use client";

import { useState } from "react";
import { speak, stopSpeaking } from "@/lib/tts";

type Props = {
  text: string;
  label?: string;
};

export function SpeakButton({ text, label = "Putar EN" }: Props) {
  const [speaking, setSpeaking] = useState(false);

  function handleClick() {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    speak(text, () => setSpeaking(false));
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 text-xs font-medium text-[var(--ink)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
      aria-label={speaking ? "Stop audio" : label}
    >
      <span aria-hidden>{speaking ? "■" : "▶"}</span>
      {speaking ? "Stop" : label}
    </button>
  );
}
