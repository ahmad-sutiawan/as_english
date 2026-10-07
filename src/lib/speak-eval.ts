import { normalizeAnswer } from "@/lib/answer";
import type { SpeakEvalResult, SpeakItem } from "@/types/speak";

function tokens(s: string): string[] {
  return normalizeAnswer(s)
    .replace(/[^\w\s']/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function similarity(a: string, b: string): number {
  const ta = tokens(a);
  const tb = tokens(b);
  if (!tb.length) return 0;
  const setA = new Set(ta);
  let hit = 0;
  for (const t of tb) {
    if (setA.has(t)) hit += 1;
  }
  const coverage = hit / tb.length;
  const lengthRatio =
    Math.min(ta.length, tb.length) / Math.max(ta.length, tb.length || 1);
  return Math.round((coverage * 0.75 + lengthRatio * 0.25) * 100);
}

function pickBestModel(user: string, models: string[]): string {
  let best = models[0] ?? "";
  let bestScore = -1;
  for (const m of models) {
    const s = similarity(user, m);
    if (s > bestScore) {
      bestScore = s;
      best = m;
    }
  }
  return best;
}

function meaningOk(user: string, item: SpeakItem): boolean {
  const u = normalizeAnswer(user);
  if (!u) return false;
  const hits = item.keywords.filter((k) => u.includes(normalizeAnswer(k)));
  return hits.length >= Math.min(2, item.keywords.length);
}

function ruleCorrections(user: string, target: string): string[] {
  const out: string[] = [];
  const u = normalizeAnswer(user);
  const t = normalizeAnswer(target);

  if (/\bi already check\b/.test(u) && /\bi('ve| have) already checked\b/.test(t)) {
    out.push('"I already check…" → "I\'ve already checked…"');
  } else if (/\bcheck\b/.test(u) && /\bchecked\b/.test(t) && !/\bchecked\b/.test(u)) {
    out.push('"check" → "checked"');
  }

  if (/\bi already\b/.test(u) && /\bi('ve| have) already\b/.test(t)) {
    const msg = '"I already…" → "I\'ve already…"';
    if (!out.includes(msg)) out.push(msg);
  }

  if (/\bdon'?t found\b|\bdont found\b|\bdon\'t found\b/.test(u)) {
    out.push('"don\'t found" → "haven\'t found"');
  }

  if (
    /\bserver already fixed\b/.test(u) &&
    /\bhas already been fixed\b/.test(t)
  ) {
    out.push('"server already fixed" → "server has already been fixed"');
  }

  if (/\bhelp a lot\b/.test(u) && /\bhelps a lot\b/.test(t)) {
    out.push('"help a lot" → "helps a lot"');
  }

  // Missing article "the" before a noun present in target
  if (/\bthe server\b/.test(t) && /\bserver\b/.test(u) && !/\bthe server\b/.test(u)) {
    out.push('Add article: "the server"');
  }

  // Truncate to 2 unique
  const unique: string[] = [];
  for (const c of out) {
    if (!unique.includes(c)) unique.push(c);
    if (unique.length >= 2) break;
  }
  return unique;
}

/** Rule-based speak evaluation — fully offline. */
export function evaluateSpeak(
  transcript: string,
  item: SpeakItem,
): SpeakEvalResult {
  const models = item.modelAnswers.length
    ? item.modelAnswers
    : [item.target];
  const bestModel = pickBestModel(transcript, models);
  const grammarScore = similarity(transcript, bestModel);
  const okMeaning = meaningOk(transcript, item);
  let corrections = ruleCorrections(transcript, bestModel);

  // Match commonErrors → suggest target phrasing
  const u = normalizeAnswer(transcript);
  for (const err of item.commonErrors) {
    if (similarity(transcript, err) >= 85 && corrections.length < 2) {
      corrections.push(`Closer to: "${bestModel}"`);
      break;
    }
  }
  corrections = corrections.slice(0, 2);

  let headline: string;
  if (grammarScore >= 92) {
    headline = "Excellent — natural and clear.";
  } else if (okMeaning && grammarScore >= 70) {
    headline = "Good attempt. Your meaning is clear.";
  } else if (okMeaning) {
    headline = "Meaning is mostly clear — tighten the grammar.";
  } else if (u.length < 3) {
    headline = "I didn't catch that — try speaking again.";
  } else {
    headline = "Close — keep the key words and try a clearer structure.";
  }

  return {
    meaningOk: okMeaning,
    grammarScore,
    pronunciationProxy: grammarScore,
    corrections,
    suggestion: bestModel,
    headline,
    bestModel,
  };
}

export function builderIsCorrect(
  arranged: string[],
  item: SpeakItem,
): boolean {
  const built = normalizeAnswer(arranged.join(" "));
  const target = normalizeAnswer(item.target);
  // Also accept joining chunks in order
  const chunkJoin = normalizeAnswer(item.chunks.join(" "));
  if (built === target || built === chunkJoin) return true;
  // Scrambled tokens reassembled matching target tokens order loosely
  const targetTokens = tokens(item.target);
  const arrangedTokens = arranged.flatMap((p) => tokens(p));
  if (arrangedTokens.length !== targetTokens.length) {
    // allow if joined string is near-exact
    return similarity(built, target) >= 95;
  }
  return arrangedTokens.every((t, i) => t === targetTokens[i]);
}
