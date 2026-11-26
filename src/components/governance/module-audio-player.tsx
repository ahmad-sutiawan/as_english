"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GovModule } from "@/types/governance";

type NarrationSegment = {
  section: string;
  text: string;
  lang: "id-ID" | "en-US";
  pauseMs: number;
};

const SPEEDS = [0.85, 0.95, 1.05, 1.15] as const;

function cleanForSpeech(raw: string, lang: "id-ID" | "en-US"): string {
  if (lang === "en-US") {
    return raw
      .replace(/—/g, ", ")
      .replace(/[•·]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  return raw
    .replace(/→/g, ", menuju ")
    .replace(/≥/g, " minimal ")
    .replace(/≤/g, " maksimal ")
    .replace(/</g, " kurang dari ")
    .replace(/>/g, " lebih dari ")
    .replace(/×/g, " kali ")
    .replace(/—/g, ", ")
    .replace(/[•·]/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitIntoChunks(text: string, maxLen = 220): string[] {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let buffer = "";

  for (const sentence of sentences) {
    if (sentence.length > maxLen) {
      if (buffer) {
        chunks.push(buffer);
        buffer = "";
      }
      const clauses = sentence
        .split(/(?<=[,;:])\s+/)
        .map((c) => c.trim())
        .filter(Boolean);
      let sub = "";
      for (const clause of clauses) {
        if (sub && sub.length + clause.length + 1 > maxLen) {
          chunks.push(sub);
          sub = clause;
        } else {
          sub = sub ? `${sub} ${clause}` : clause;
        }
      }
      if (sub) chunks.push(sub);
      continue;
    }

    if (buffer && buffer.length + sentence.length + 1 > maxLen) {
      chunks.push(buffer);
      buffer = sentence;
    } else {
      buffer = buffer ? `${buffer} ${sentence}` : sentence;
    }
  }

  if (buffer) chunks.push(buffer);
  return chunks;
}

function buildNarrationSegments(mod: GovModule): NarrationSegment[] {
  const segments: NarrationSegment[] = [];

  const addText = (
    section: string,
    raw: string,
    lang: "id-ID" | "en-US" = "id-ID",
    pauseMs = 280,
  ) => {
    const cleaned = cleanForSpeech(raw, lang);
    if (!cleaned) return;
    const chunks = splitIntoChunks(cleaned);
    chunks.forEach((chunk, idx) => {
      segments.push({
        section,
        text: chunk,
        lang,
        pauseMs: idx === chunks.length - 1 ? pauseMs : 180,
      });
    });
  };

  addText(
    "Pembukaan Modul",
    `Modul ${mod.order}. ${mod.title}. ${mod.subtitle}`,
    "id-ID",
    450,
  );

  addText(
    "Mengapa Penting",
    `Mengapa materi ini penting. ${mod.whySmbMatters}`,
    "id-ID",
    400,
  );

  addText("Tujuan Pembelajaran", "Tujuan pembelajaran modul ini adalah sebagai berikut.", "id-ID", 220);
  mod.objectives.forEach((obj, i) => {
    addText("Tujuan Pembelajaran", `Pertama-tama, poin ${i + 1}: ${obj}`.replace("Pertama-tama, ", i === 0 ? "" : ""), "id-ID", 260);
  });

  for (const concept of mod.concepts) {
    addText(concept.heading, `Bagian konsep: ${concept.heading}.`, "id-ID", 320);
    for (const paragraph of concept.paragraphs) {
      addText(concept.heading, paragraph, "id-ID", 300);
    }
    for (const bullet of concept.bullets ?? []) {
      addText(concept.heading, bullet, "id-ID", 260);
    }
  }

  if (mod.frameworkTable) {
    addText("Tabel Framework", `Ringkasan tabel referensi: ${mod.frameworkTable.title}.`, "id-ID", 320);
    for (const row of mod.frameworkTable.rows) {
      addText(
        "Tabel Framework",
        `${row.code}, ${row.name}. Fokus utama: ${row.smbFocus}. Output atau acuan: ${row.artifact}.`,
        "id-ID",
        300,
      );
    }
  }

  addText(
    "Studi Kasus",
    `Studi kasus nyata. ${mod.caseStudy.title}. Profil perusahaan: ${mod.caseStudy.companyProfile}. Masalah yang dihadapi: ${mod.caseStudy.problem}`,
    "id-ID",
    360,
  );
  addText("Studi Kasus", "Langkah tata kelola yang diambil:", "id-ID", 220);
  for (const action of mod.caseStudy.governanceAction) {
    addText("Studi Kasus", action, "id-ID", 260);
  }
  addText("Studi Kasus", `Hasil yang dicapai: ${mod.caseStudy.outcome}`, "id-ID", 400);

  addText("Checklist Aksi", "Checklist aksi praktis yang bisa langsung Anda terapkan:", "id-ID", 250);
  mod.smbChecklist.forEach((item, i) => {
    addText("Checklist Aksi", `Langkah ${i + 1}: ${item}`, "id-ID", 260);
  });

  addText("Jebakan Umum", "Jebakan umum yang perlu dihindari:", "id-ID", 250);
  for (const pitfall of mod.commonPitfalls) {
    addText(
      "Jebakan Umum",
      `Hindari hal berikut: ${pitfall.pitfall}. Cara yang lebih baik: ${pitfall.betterWay}`,
      "id-ID",
      320,
    );
  }

  addText(
    "Executive English",
    "Bagian terakhir: kalimat bahasa Inggris eksekutif siap pakai di rapat Direksi dan klien.",
    "id-ID",
    320,
  );
  for (const phrase of mod.executiveEnglish) {
    addText("Executive English", `Situasi: ${phrase.situation}.`, "id-ID", 240);
    addText("Executive English", phrase.en, "en-US", 340);
    addText("Executive English", `Artinya: ${phrase.id}`, "id-ID", 340);
  }

  addText(
    "Penutup",
    `Seluruh materi Modul ${mod.order} telah selesai dibacakan. Anda sekarang siap mengerjakan Latihan Pemahaman dan Mastery Check.`,
    "id-ID",
    200,
  );

  return segments;
}

function pickVoice(lang: "id-ID" | "en-US"): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  if (lang === "id-ID") {
    return (
      voices.find((v) => v.lang.toLowerCase().startsWith("id") && /google|damayanti|gadis|ardi/i.test(v.name)) ||
      voices.find((v) => v.lang.toLowerCase() === "id-id") ||
      voices.find((v) => v.lang.toLowerCase().startsWith("id")) ||
      null
    );
  }

  return (
    voices.find((v) => v.lang.toLowerCase().startsWith("en") && /google|samantha|daniel|natural/i.test(v.name)) ||
    voices.find((v) => v.lang === "en-US") ||
    voices.find((v) => v.lang.toLowerCase().startsWith("en")) ||
    null
  );
}

export function GovModuleAudioPlayer({ mod }: { mod: GovModule }) {
  const segments = useMemo(() => buildNarrationSegments(mod), [mod]);
  const [status, setStatus] = useState<"idle" | "playing" | "paused" | "finished">("idle");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rate, setRate] = useState<number>(0.95);
  const [unsupported, setUnsupported] = useState(false);

  const runIdRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const rateRef = useRef(rate);

  useEffect(() => {
    rateRef.current = rate;
  }, [rate]);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopAll = useCallback(() => {
    runIdRef.current += 1;
    clearTimer();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setStatus("idle");
  }, [clearTimer]);

  useEffect(() => {
    return () => {
      runIdRef.current += 1;
      clearTimer();
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [clearTimer]);

  function startFrom(idx: number) {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setUnsupported(true);
      return;
    }
    const synth = window.speechSynthesis;
    clearTimer();
    runIdRef.current += 1;
    const myRunId = runIdRef.current;

    const speakSegment = (segmentIdx: number) => {
      if (myRunId !== runIdRef.current) return;

      if (segmentIdx >= segments.length) {
        setStatus("finished");
        return;
      }

      const seg = segments[segmentIdx];
      setCurrentIndex(segmentIdx);
      setStatus("playing");

      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(seg.text);
      const voice = pickVoice(seg.lang);
      if (voice) utterance.voice = voice;
      utterance.lang = voice?.lang ?? seg.lang;
      utterance.rate = rateRef.current;
      utterance.pitch = 1;

      utterance.onend = () => {
        if (myRunId !== runIdRef.current) return;
        clearTimer();
        timerRef.current = window.setTimeout(() => {
          speakSegment(segmentIdx + 1);
        }, seg.pauseMs);
      };

      utterance.onerror = (event) => {
        if (myRunId !== runIdRef.current) return;
        if (event.error === "canceled" || event.error === "interrupted") return;
        clearTimer();
        timerRef.current = window.setTimeout(() => {
          speakSegment(segmentIdx + 1);
        }, 250);
      };

      synth.speak(utterance);
    };

    if (synth.getVoices().length === 0) {
      const onVoicesReady = () => {
        if (myRunId === runIdRef.current) {
          speakSegment(idx);
        }
      };
      synth.addEventListener("voiceschanged", onVoicesReady, { once: true });
    }
    speakSegment(idx);
  }

  function handlePauseResume() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (status === "playing") {
      clearTimer();
      window.speechSynthesis.cancel();
      runIdRef.current += 1;
      setStatus("paused");
    } else if (status === "paused") {
      startFrom(currentIndex);
    }
  }

  function handleRateChange(nextRate: number) {
    setRate(nextRate);
    rateRef.current = nextRate;
    if (status === "playing") {
      startFrom(currentIndex);
    }
  }

  const activeSegment = segments[currentIndex];
  const progressPct = segments.length > 0 ? Math.round(((currentIndex + 1) / segments.length) * 100) : 0;

  return (
    <section className="mt-6 rounded-3xl border border-[var(--accent)]/40 bg-[var(--surface)]/80 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--accent)]">
            Mode Audio Modul Penuh
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Dengarkan seluruh isi Modul {mod.order} secara tuntas dengan intonasi &amp; artikulasi
            terstruktur ({segments.length} segmen narasi).
          </p>
        </div>

        {status === "idle" || status === "finished" ? (
          <button
            type="button"
            onClick={() => startFrom(0)}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-[var(--accent)] px-5 text-sm font-medium text-[#06221e] hover:bg-[var(--accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            <span aria-hidden>🔊</span>
            {status === "finished" ? "Putar ulang dari awal" : "Pelajari dengan mendengarkan"}
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => startFrom(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="inline-flex h-10 items-center rounded-full border border-[var(--border)] px-3.5 text-xs font-medium text-[var(--ink)] hover:border-[var(--accent)] disabled:opacity-40"
            >
              ← Mundur
            </button>
            <button
              type="button"
              onClick={handlePauseResume}
              className="inline-flex h-10 items-center rounded-full bg-[var(--accent)] px-4 text-xs font-medium text-[#06221e] hover:bg-[var(--accent-hover)]"
            >
              {status === "playing" ? "Jeda" : "Lanjutkan"}
            </button>
            <button
              type="button"
              onClick={() => startFrom(Math.min(segments.length - 1, currentIndex + 1))}
              disabled={currentIndex >= segments.length - 1}
              className="inline-flex h-10 items-center rounded-full border border-[var(--border)] px-3.5 text-xs font-medium text-[var(--ink)] hover:border-[var(--accent)] disabled:opacity-40"
            >
              Lewati →
            </button>
            <button
              type="button"
              onClick={stopAll}
              className="inline-flex h-10 items-center rounded-full border border-[var(--danger-border)] px-3.5 text-xs font-medium text-[var(--danger)] hover:bg-[var(--danger-bg)]"
            >
              Berhenti
            </button>
          </div>
        )}
      </div>

      {unsupported ? (
        <p className="mt-3 text-xs text-[var(--danger)]" role="alert">
          Browser Anda belum mendukung pemutaran suara (Web Speech API). Gunakan Chrome, Edge, atau Safari terbaru.
        </p>
      ) : null}

      {status !== "idle" ? (
        <div className="mt-4 space-y-3 border-t border-[var(--border)] pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-medium text-[var(--accent)]">
              {status === "finished"
                ? "✓ Selesai dibacakan seluruhnya"
                : `${status === "paused" ? "Dijeda" : "Sedang membacakan"} · ${activeSegment?.section ?? ""}`}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--muted)]">Kecepatan:</span>
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleRateChange(s)}
                  className={`rounded-full border px-2 py-0.5 text-xs transition ${
                    rate === s
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] font-medium text-[var(--accent)]"
                      : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  {s}×
                </button>
              ))}
            </div>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
              style={{ width: `${status === "finished" ? 100 : progressPct}%` }}
            />
          </div>

          {activeSegment && status !== "finished" ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)]/70 px-4 py-3">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-[var(--muted)]">
                <span>
                  Segmen {currentIndex + 1} / {segments.length}
                </span>
                <span>{activeSegment.lang === "en-US" ? "English" : "Bahasa Indonesia"}</span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink)]">
                {activeSegment.text}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
