import type { GovExercise, PublicGovExercise } from "@/types/governance";

export type GovExerciseResult = {
  exerciseId: string;
  correct: boolean;
  score: number;
  feedback: string;
  correctAnswer: string;
};

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:'"()[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function toPublicGovExercise(ex: GovExercise): PublicGovExercise {
  return {
    id: ex.id,
    type: ex.type,
    prompt: ex.prompt,
    context: ex.context,
    options: ex.options,
    rubricLabels: ex.rubric?.map((item) => item.label),
    points: ex.points,
    topic: ex.topic,
  };
}

export function scoreGovExercise(ex: GovExercise, rawAnswer: string): GovExerciseResult {
  const submitted = rawAnswer.trim();
  const primaryCorrect = ex.acceptable[0] ?? "";
  if (!submitted) {
    return {
      exerciseId: ex.id,
      correct: false,
      score: 0,
      feedback: `Belum dijawab. ${ex.explanation}`,
      correctAnswer: primaryCorrect,
    };
  }

  if (ex.type === "mcq" || ex.type === "scenario") {
    const matched = ex.acceptable.some(
      (acc) => acc.trim().toUpperCase() === submitted.toUpperCase(),
    );
    const optionText = ex.options?.find(
      (opt) => opt.key.toUpperCase() === primaryCorrect.toUpperCase(),
    );
    const label = optionText ? `${optionText.key}. ${optionText.text}` : primaryCorrect;
    return {
      exerciseId: ex.id,
      correct: matched,
      score: matched ? ex.points : 0,
      feedback: matched
        ? `Tepat. ${ex.explanation}`
        : `Belum tepat. Jawaban benar: ${label}. ${ex.explanation}`,
      correctAnswer: label,
    };
  }

  if (ex.type === "writing") {
    const normSubmitted = normalize(submitted);
    const rubric = ex.rubric ?? [];
    const hitLabels: string[] = [];
    const missingLabels: string[] = [];
    for (const item of rubric) {
      const hit = item.keywords.some((kw) => normSubmitted.includes(normalize(kw)));
      if (hit) hitLabels.push(item.label);
      else missingLabels.push(item.label);
    }
    const minRequired = Math.max(1, Math.ceil(rubric.length * 0.65));
    const matched = rubric.length > 0 ? hitLabels.length >= minRequired : normSubmitted.length >= 25;
    const model = ex.modelAnswer ?? primaryCorrect;
    const detail =
      missingLabels.length > 0
        ? `Poin yang belum terlihat: ${missingLabels.join(", ")}. `
        : "Seluruh elemen rubrik terpenuhi. ";
    return {
      exerciseId: ex.id,
      correct: matched,
      score: matched ? ex.points : 0,
      feedback: `${matched ? "Tepat." : "Perlu diperkuat."} ${detail}${ex.explanation}${
        model ? ` Contoh jawaban model: "${model}"` : ""
      }`,
      correctAnswer: model,
    };
  }

  const normSubmitted = normalize(submitted);
  const matched = ex.acceptable.some((acc) => {
    const normAcc = normalize(acc);
    return normSubmitted === normAcc || normSubmitted.includes(normAcc);
  });

  return {
    exerciseId: ex.id,
    correct: matched,
    score: matched ? ex.points : 0,
    feedback: matched
      ? `Tepat. ${ex.explanation}`
      : `Belum tepat. Kunci jawaban: "${primaryCorrect}". ${ex.explanation}`,
    correctAnswer: primaryCorrect,
  };
}

export function scoreGovSet(exercises: GovExercise[], answers: Record<string, string>) {
  const results = exercises.map((ex) => scoreGovExercise(ex, answers[ex.id] ?? ""));
  const earned = results.reduce((sum, item) => sum + item.score, 0);
  const total = exercises.reduce((sum, item) => sum + item.points, 0);
  const percent = total > 0 ? Math.round((earned / total) * 100) : 0;
  return { results, earned, total, percent };
}
