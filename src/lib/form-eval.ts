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

const CONTRACTIONS: Array<[RegExp, string]> = [
  [/\bi'm\b/g, "i am"],
  [/\bi've\b/g, "i have"],
  [/\bi'll\b/g, "i will"],
  [/\bi'd\b/g, "i would"],
  [/\bdon't\b/g, "do not"],
  [/\bdoesn't\b/g, "does not"],
  [/\bdidn't\b/g, "did not"],
  [/\bcan't\b/g, "cannot"],
  [/\bwon't\b/g, "will not"],
  [/\bisn't\b/g, "is not"],
  [/\baren't\b/g, "are not"],
  [/\bwasn't\b/g, "was not"],
  [/\bweren't\b/g, "were not"],
  [/\bwe're\b/g, "we are"],
  [/\bwe've\b/g, "we have"],
  [/\bwe'll\b/g, "we will"],
  [/\bthey're\b/g, "they are"],
  [/\bthey've\b/g, "they have"],
  [/\blet's\b/g, "let us"],
  [/\bit's\b/g, "it is"],
  [/\bthat's\b/g, "that is"],
  [/\bwhat's\b/g, "what is"],
  [/\bthere's\b/g, "there is"],
  [/\bhe's\b/g, "he is"],
  [/\bshe's\b/g, "she is"],
  [/\byou're\b/g, "you are"],
  [/\byou've\b/g, "you have"],
  [/\byou'll\b/g, "you will"],
];

/** Collapse contractions and a leading Please so trivial model pairs compare equal. */
export function canonicalTokens(sentence: string): string[] {
  let text = normalizeAnswer(sentence).replace(/^please\s+/, "");
  for (const [pattern, replacement] of CONTRACTIONS) {
    text = text.replace(pattern, replacement);
  }
  return text
    .replace(/[^\w\s']/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function modelsAreDistinct(models: string[]): boolean {
  const keys = models.map((model) => canonicalTokens(model).join(" ")).filter(Boolean);
  return keys.length >= 2 && new Set(keys).size === keys.length;
}

function slotNotes(user: string, slots: BuildSlot[]): string[] {
  const u = normalizeAnswer(user);
  const notes: string[] = [];
  for (const slot of slots) {
    const needle = normalizeAnswer(slot.text);
    if (!needle || u.includes(needle)) continue;
    notes.push(slot.noteId?.trim() || `${slot.roleId} belum ada dalam jawaban.`);
    if (notes.length >= 2) break;
  }
  return notes;
}

function slotsPresent(user: string, slots: BuildSlot[]): boolean {
  const u = normalizeAnswer(user);
  return slots.every((slot) => {
    const needle = normalizeAnswer(slot.text);
    return !needle || u.includes(needle);
  });
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

  const authoredSlots = input.slots.filter((slot) => slot.text.trim());
  const slotsOk = slotsPresent(input.transcript, authoredSlots);
  const passed = exact
    ? authoredSlots.length === 0 || slotsOk
    : nearMiss && authoredSlots.length > 0 && slotsOk;
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
  else if (passed) headline = "Hampir tepat. Model dan slot peran sudah kena.";
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
