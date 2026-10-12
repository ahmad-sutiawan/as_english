"use client";

export type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

export type SpeechRecognitionEventLike = {
  results: ArrayLike<ArrayLike<{ transcript: string; confidence: number }>>;
};

type RecognitionCtor = new () => SpeechRecognitionLike;

export function getSpeechRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionCtor() !== null;
}

export function micErrorMessage(code: string): string {
  if (code === "insecure") {
    return "Mic butuh HTTPS. Pasang CA, lalu buka alamat https pada port yang sama.";
  }
  if (code === "not-allowed") {
    return "Izin mikrofon ditolak. Di Chrome Android, izinkan mikrofon untuk situs ini, lalu ketuk Bicara lagi.";
  }
  if (code === "network") {
    return "Layanan suara tidak terjangkau. Periksa internet HP, lalu coba lagi.";
  }
  if (code === "no-speech") {
    return "Tidak ada suara yang tertangkap. Dekatkan mic dan ucapkan lagi.";
  }
  if (code === "audio-capture") {
    return "Mikrofon tidak terbaca. Tutup aplikasi lain yang memakai mic.";
  }
  return "Tidak bisa memulai mic.";
}

/** Android Chrome only shows the mic prompt from getUserMedia, not from speech recognition. */
export async function primeMicrophone(): Promise<string | null> {
  if (typeof window === "undefined") return "Mic hanya jalan di browser.";
  if (!window.isSecureContext) return micErrorMessage("insecure");
  if (!navigator.mediaDevices?.getUserMedia) {
    return "Browser ini tidak bisa meminta izin mikrofon. Pakai Chrome.";
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return null;
  } catch {
    return micErrorMessage("not-allowed");
  }
}

export function listenOnce(
  onTranscript: (text: string) => void,
  onError: (message: string) => void,
  onEnd: () => void,
): SpeechRecognitionLike | null {
  const Ctor = getSpeechRecognitionCtor();
  if (!Ctor) {
    onError("Speech recognition tidak tersedia. Pakai Chrome.");
    return null;
  }
  if (!window.isSecureContext) {
    onError(micErrorMessage("insecure"));
    return null;
  }

  const rec = new Ctor();
  rec.lang = "en-US";
  rec.continuous = false;
  rec.interimResults = true;
  rec.maxAlternatives = 1;
  let latest = "";
  let failed = false;

  rec.onresult = (event) => {
    const list = event.results;
    const last = list[list.length - 1]?.[0]?.transcript?.trim() ?? "";
    if (last) latest = last;
  };
  rec.onerror = (event) => {
    if (event.error === "aborted" || event.error === "no-speech") return;
    failed = true;
    onError(micErrorMessage(event.error));
  };
  rec.onend = () => {
    if (!failed && latest) onTranscript(latest);
    onEnd();
  };

  void primeMicrophone().then((message) => {
    if (message) {
      failed = true;
      onError(message);
      onEnd();
      return;
    }
    try {
      rec.start();
    } catch {
      failed = true;
      onError(micErrorMessage("audio-capture"));
      onEnd();
    }
  });

  return rec;
}
