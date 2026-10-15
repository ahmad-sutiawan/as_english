import type { Exercise, ExerciseType, Lesson } from "@/types/mastery";

export type ExerciseDraft = {
  type: ExerciseType;
  prompt: string;
  promptId?: string;
  context?: string;
  options?: { key: string; text: string }[];
  words?: string[];
  acceptable: string[];
  explanation: string;
  competency: Exercise["competency"];
  difficulty?: Exercise["difficulty"];
  rubric?: Exercise["rubric"];
  forbidden?: string[];
  reference?: string;
};

export function exercises(prefix: string, items: ExerciseDraft[]): Exercise[] {
  return items.map((item, index) => ({
    points: 1,
    difficulty: item.difficulty ?? "core",
    ...item,
    id: `${prefix}-${index + 1}`,
  }));
}

export function lesson(
  input: Omit<Lesson, "masteryThreshold" | "published"> & {
    masteryThreshold?: number;
    published?: boolean;
  },
): Lesson {
  return {
    masteryThreshold: input.masteryThreshold ?? 80,
    published: input.published ?? true,
    ...input,
  };
}
