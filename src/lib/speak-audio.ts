"use client";

import { speak, stopSpeaking } from "@/lib/tts";

/** Play local audio file if present, otherwise browser SpeechSynthesis. */
export function playTargetAudio(
  text: string,
  audioPath: string | null | undefined,
  onEnd?: () => void,
): void {
  stopSpeaking();
  if (typeof window === "undefined") return;

  if (audioPath) {
    const src = audioPath.startsWith("/") ? audioPath : `/${audioPath}`;
    const el = new Audio(src);
    el.onended = () => onEnd?.();
    el.onerror = () => speak(text, onEnd);
    void el.play().catch(() => speak(text, onEnd));
    return;
  }

  speak(text, onEnd);
}
