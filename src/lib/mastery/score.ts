import { normalizeAnswer } from "@/lib/answer";
import type { Competency, Exercise, PublicExercise } from "@/types/mastery";

export const MASTERY_THRESHOLD = 80;

export const COMPETENCY_WEIGHTS: Record<Competency, number> = {
  concept: 0.2,
  construction: 0.25,
  communication: 0.35,
  writing: 0.2,
};

export function masteryNormalize(input: string): string {
  return normalizeAnswer(input).replace(/[’‘]/g, "'");
}

export function toPublicExercise(exercise: Exercise): PublicExercise {
  return {
    id: exercise.id,
    type: exercise.type,
    prompt: exercise.prompt,
    promptId: exercise.promptId,
    context: exercise.context,
    options: exercise.options,
    words: exercise.words,
    points: exercise.points,
    competency: exercise.competency,
    rubricLabels: exercise.rubric?.map((item) => item.label),
  };
}

export type ScoreOutcome = {
  correct: boolean;
  score: number;
  feedback: string;
};

function matchesAcceptable(answer: string, acceptable: string[]): boolean {
  const typed = masteryNormalize(answer);
  if (!typed) return false;
  return acceptable.some((item) => masteryNormalize(item) === typed);
}

function sampleAnswer(exercise: Exercise): string {
  if (exercise.type === "mcq" || exercise.type === "choose") {
    const key = exercise.acceptable[0];
    return exercise.options?.find((option) => option.key === key)?.text ?? key ?? "";
  }
  return exercise.reference || exercise.acceptable[0] || "";
}

export function scoreExercise(exercise: Exercise, answer: string): ScoreOutcome {
  const trimmed = answer.trim();
  if (!trimmed) {
    return {
      correct: false,
      score: 0,
      feedback: `Jawaban masih kosong. ${exercise.explanation}`,
    };
  }

  if (exercise.type === "writing") {
    return scoreWriting(exercise, trimmed);
  }

  const correct = matchesAcceptable(trimmed, exercise.acceptable);
  if (correct) {
    const typed = masteryNormalize(trimmed);
    const primary = masteryNormalize(exercise.acceptable[0] ?? "");
    const alternative = typed !== primary;
    const lead = alternative
      ? "Jawaban ini juga benar."
      : "Jawaban tepat.";
    return {
      correct: true,
      score: exercise.points,
      feedback: `${lead} ${exercise.explanation}`,
    };
  }

  return {
    correct: false,
    score: 0,
    feedback: `Jawaban belum tepat. ${exercise.explanation} Contoh jawaban: ${sampleAnswer(exercise)}.`,
  };
}

function scoreWriting(exercise: Exercise, answer: string): ScoreOutcome {
  const normalized = masteryNormalize(answer);
  const words = normalized.split(" ").filter(Boolean);
  const limit =
    "Penilaian otomatis hanya memeriksa pola wajib. Kalimat lain yang natural bisa tetap benar dan perlu dilihat manual.";

  if (words.length < 4) {
    return {
      correct: false,
      score: 0,
      feedback: `Tulis beberapa kalimat utuh. ${exercise.explanation} ${limit}`,
    };
  }

  const missing = (exercise.rubric ?? []).filter((item) => {
    const needle = masteryNormalize(item.pattern);
    return !needle || !normalized.includes(needle);
  });
  const blocked = (exercise.forbidden ?? []).filter((item) =>
    normalized.includes(masteryNormalize(item)),
  );

  if (missing.length > 0 || blocked.length > 0) {
    const gaps = missing.map((item) => item.label).join(", ");
    const bad = blocked.length > 0 ? " Ada pola yang sebaiknya dihindari." : "";
    return {
      correct: false,
      score: 0,
      feedback: `Jawaban belum memenuhi pola yang diminta${gaps ? `: ${gaps}` : ""}.${bad} ${exercise.explanation} Referensi: ${exercise.reference ?? ""}. ${limit}`,
    };
  }

  return {
    correct: true,
    score: exercise.points,
    feedback: `Pola wajib sudah ada. ${exercise.explanation} Referensi: ${exercise.reference ?? ""}. ${limit}`,
  };
}

export function percentScore(earned: number, possible: number): number {
  if (possible <= 0) return 0;
  return Math.round((earned / possible) * 100);
}

export function scoreSet(
  exercises: Exercise[],
  answers: Record<string, string>,
): { earned: number; possible: number; percent: number; results: (ScoreOutcome & { exerciseId: string })[] } {
  const results = exercises.map((exercise) => ({
    exerciseId: exercise.id,
    ...scoreExercise(exercise, answers[exercise.id] ?? ""),
  }));
  const earned = results.reduce((sum, item) => sum + item.score, 0);
  const possible = exercises.reduce((sum, item) => sum + item.points, 0);
  return { earned, possible, percent: percentScore(earned, possible), results };
}

export type SectionScore = {
  earned: number;
  possible: number;
  percent: number;
};

export function weightedExamPercent(
  questions: { competency: Competency; correct: boolean; points: number }[],
): { total: number; sections: Record<Competency, SectionScore> } {
  const sections = {
    concept: emptySection(),
    construction: emptySection(),
    communication: emptySection(),
    writing: emptySection(),
  } satisfies Record<Competency, SectionScore>;

  for (const question of questions) {
    const section = sections[question.competency];
    section.possible += question.points;
    if (question.correct) section.earned += question.points;
  }

  (Object.keys(sections) as Competency[]).forEach((key) => {
    sections[key].percent = percentScore(sections[key].earned, sections[key].possible);
  });

  const active = (Object.keys(sections) as Competency[]).filter((key) => sections[key].possible > 0);
  const weightSum = active.reduce((sum, key) => sum + COMPETENCY_WEIGHTS[key], 0);
  const total =
    weightSum === 0
      ? 0
      : Math.round(
          active.reduce((sum, key) => sum + sections[key].percent * COMPETENCY_WEIGHTS[key], 0) /
            weightSum,
        );

  return { total, sections };
}

function emptySection(): SectionScore {
  return { earned: 0, possible: 0, percent: 0 };
}

export function passedThreshold(percent: number, threshold = MASTERY_THRESHOLD): boolean {
  return percent >= threshold;
}
