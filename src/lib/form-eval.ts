import { missedTokens, normalizeAnswer, scoreAnswer } from "@/lib/answer";
import type { BuildSlot } from "@/types/build";

export type CommonError = {
  pattern: string;
  correctionId: string;
};

export type FormEvalInput = {
  transcript: string;
  models: string[];
  chunks: string[];
  slots: BuildSlot[];
  commonErrors: Array<string | CommonError>;
  grammarPatterns?: string[];
};

export type FormEvalResult = {
  passed: boolean;
  nearMiss: boolean;
  exact: boolean;
  bestModel: string;
  corrections: string[];
  missedTokens: string[];
  headline: string;
};

export function asCommonErrors(
  raw: Array<string | CommonError>,
): CommonError[] {
  return raw.map((entry) =>
    typeof entry === "string"
      ? {
          pattern: entry,
          correctionId: "Bentuk itu belum tepat. Ikuti potongan kalimat target.",
        }
      : entry,
  );
}

export function deriveChunks(sentence: string): string[] {
  const parts = sentence
    .split(/,|\band\b/i)
    .map((part) => part.trim())
    .filter((part) => part.length > 1);
  if (parts.length >= 2) return parts.slice(0, 4);
  const words = sentence.replace(/[.]/g, "").split(/\s+/).filter(Boolean);
  if (words.length <= 3) return [sentence.replace(/[.]+$/g, "")];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

export function deriveSlots(chunks: string[]): BuildSlot[] {
  return chunks.slice(0, 4).map((text, index) => {
    if (index === 0) return { role: "Subject", roleId: "Subjek", text };
    if (index === 1) return { role: "Verb", roleId: "Predikat", text };
    return { role: "Adverbial", roleId: "Keterangan", text };
  });
}

function chunkOrderOk(user: string, chunks: string[]): boolean {
  if (!chunks.length) return true;
  let rest = normalizeAnswer(user);
  for (const chunk of chunks) {
    const needle = normalizeAnswer(chunk);
    if (!needle) continue;
    const at = rest.indexOf(needle);
    if (at < 0) return false;
    rest = rest.slice(at + needle.length);
  }
  return true;
}

function patternNotes(user: string, target: string, patterns: string[]): string[] {
  const notes: string[] = [];
  const u = normalizeAnswer(user);
  const t = normalizeAnswer(target);
  const hasPerfect = /\b(have|has|i've|we've|they've|i have|we have)\b/.test(t);
  const userPerfect = /\b(have|has|i've|we've|they've|i have|we have)\b/.test(u);
  if (
    (patterns.includes("present_perfect") || hasPerfect) &&
    hasPerfect &&
    !userPerfect
  ) {
    notes.push("Kata kerja masih present. Target memakai present perfect.");
  }
  if (patterns.includes("future_will") && /\b(will|i'll|we'll)\b/.test(t) && !/\b(will|i'll|we'll)\b/.test(u)) {
    notes.push("Bentuk future belum ada. Target memakai will.");
  }
  if (/\bthe\b/.test(t) && !/\bthe\b/.test(u)) {
    notes.push("Artikel 'the' belum ada pada tempatnya.");
  }
  return notes;
}

function slotNotes(user: string, slots: BuildSlot[]): string[] {
  const u = normalizeAnswer(user);
  const notes: string[] = [];
  for (const slot of slots) {
    const needle = normalizeAnswer(slot.text);
    if (!needle || u.includes(needle)) continue;
    notes.push(`${slot.roleId} belum sesuai.`);
    if (notes.length >= 2) break;
  }
  return notes;
}

export function evaluateForm(input: FormEvalInput): FormEvalResult {
  const models = input.models.filter(Boolean);
  const fallback = models[0] ?? "";
  let bestModel = fallback;
  let bestDistance = Number.POSITIVE_INFINITY;
  let exact = false;
  let nearMiss = false;

  for (const model of models) {
    const scored = scoreAnswer(input.transcript, model);
    if (scored.exact) {
      bestModel = model;
      exact = true;
      nearMiss = false;
      bestDistance = 0;
      break;
    }
    if (scored.distance < bestDistance) {
      bestDistance = scored.distance;
      bestModel = model;
      nearMiss = scored.nearMiss;
    }
  }

  const ordered = chunkOrderOk(input.transcript, input.chunks);
  const passed = exact || (nearMiss && ordered);
  const missing = missedTokens(input.transcript, bestModel);

  const corrections: string[] = [];
  for (const note of patternNotes(
    input.transcript,
    bestModel,
    input.grammarPatterns ?? [],
  )) {
    corrections.push(note);
  }
  if (!exact) {
    for (const note of slotNotes(input.transcript, input.slots)) {
      if (!corrections.includes(note)) corrections.push(note);
    }
  }
  const user = normalizeAnswer(input.transcript);
  for (const error of asCommonErrors(input.commonErrors)) {
    const pattern = normalizeAnswer(error.pattern);
    if (!pattern) continue;
    if (user === pattern || user.includes(pattern)) {
      if (!corrections.includes(error.correctionId)) {
        corrections.push(error.correctionId);
      }
    }
    if (corrections.length >= 3) break;
  }

  let headline = "Bentuknya belum tepat. Lihat potongan yang meleset.";
  if (passed && exact) headline = "Tepat. Bentuk kalimatnya sudah pas.";
  else if (passed) headline = "Hampir tepat. Arti dan urutan potongan sudah kena.";
  else if (!user) headline = "Belum ada jawaban. Ucapkan atau ketik kalimatnya.";

  return {
    passed,
    nearMiss: nearMiss && !exact,
    exact,
    bestModel,
    corrections: corrections.slice(0, 3),
    missedTokens: exact ? [] : missing.slice(0, 8),
    headline,
  };
}
