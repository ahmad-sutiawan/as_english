import { normalizeAnswer } from "@/lib/answer";
import { deriveSlots, evaluateForm } from "@/lib/form-eval";
import type { SpeakEvalResult, SpeakItem } from "@/types/speak";

function tokens(s: string): string[] {
  return normalizeAnswer(s)
    .replace(/[^\w\s']/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** Rule-based speak evaluation — fully offline. */
export function evaluateSpeak(
  transcript: string,
  item: SpeakItem,
): SpeakEvalResult {
  const models = item.modelAnswers.length ? item.modelAnswers : [item.target];
  const slots = item.slots?.length ? item.slots : deriveSlots(item.chunks);
  const result = evaluateForm({
    transcript,
    models,
    chunks: item.chunks,
    slots,
    commonErrors: item.commonErrors,
    grammarPatterns: item.grammarPatterns,
  });
  return {
    passed: result.passed,
    nearMiss: result.nearMiss,
    exact: result.exact,
    corrections: result.corrections,
    suggestion: result.bestModel,
    headline: result.headline,
    bestModel: result.bestModel,
    missedTokens: result.missedTokens,
  };
}

export function builderIsCorrect(
  arranged: string[],
  item: SpeakItem,
): boolean {
  const built = normalizeAnswer(arranged.join(" "));
  const target = normalizeAnswer(item.target);
  const chunkJoin = normalizeAnswer(item.chunks.join(" "));
  if (built === target || built === chunkJoin) return true;
  const targetTokens = tokens(item.target);
  const arrangedTokens = arranged.flatMap((part) => tokens(part));
  if (arrangedTokens.length !== targetTokens.length) return false;
  return arrangedTokens.every((token, index) => token === targetTokens[index]);
}
