"use client";

function pickEnglishVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;

  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const preferred =
    voices.find(
      (v) =>
        v.lang.startsWith("en") &&
        /google/i.test(v.name),
    ) ||
    voices.find((v) => v.lang === "en-US") ||
    voices.find((v) => v.lang === "en-GB") ||
    voices.find((v) => v.lang.startsWith("en"));

  return preferred ?? null;
}

export function speak(text: string, onEnd?: () => void): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const voice = pickEnglishVoice();
  if (voice) utterance.voice = voice;
  utterance.lang = voice?.lang ?? "en-US";
  utterance.rate = 0.95;
  utterance.pitch = 1;

  if (onEnd) utterance.onend = onEnd;

  // Chrome loads voices async; retry once if empty
  if (!window.speechSynthesis.getVoices().length) {
    window.speechSynthesis.onvoiceschanged = () => {
      const v = pickEnglishVoice();
      if (v) utterance.voice = v;
      window.speechSynthesis.speak(utterance);
      window.speechSynthesis.onvoiceschanged = null;
    };
    return;
  }

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}
