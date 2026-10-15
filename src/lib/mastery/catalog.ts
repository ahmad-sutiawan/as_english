import { phase1Lessons } from "@/lib/mastery/content/phase1";
import { phase1bLessons } from "@/lib/mastery/content/phase1b";
import { phase2Lessons } from "@/lib/mastery/content/phase2";
import { phase3Lessons } from "@/lib/mastery/content/phase3";
import { phase4Lessons } from "@/lib/mastery/content/phase4";
import { phase5Lessons } from "@/lib/mastery/content/phase5";
import { modules, phases } from "@/lib/mastery/content/phases";
import type { ExamDef, Exercise, GrammarModule, GrammarPhase, Lesson } from "@/types/mastery";
import { foundationExam, finalExam } from "@/lib/mastery/content/exams";

const lessons: Lesson[] = [
  ...phase1Lessons,
  ...phase1bLessons,
  ...phase2Lessons,
  ...phase3Lessons,
  ...phase4Lessons,
  ...phase5Lessons,
];

export function getPhases(): GrammarPhase[] {
  return [...phases].sort((a, b) => a.order - b.order);
}

export function getModules(): GrammarModule[] {
  return [...modules].sort((a, b) => a.order - b.order);
}

export function getLessons(): Lesson[] {
  return lessons;
}

export function getPublishedLessons(): Lesson[] {
  return lessons.filter((lesson) => lesson.published);
}

export function getLesson(slug: string): Lesson | undefined {
  return lessons.find((lesson) => lesson.slug === slug);
}

export function getModule(slug: string): GrammarModule | undefined {
  return modules.find((item) => item.slug === slug);
}

export function getPhase(id: string): GrammarPhase | undefined {
  return phases.find((item) => item.id === id);
}

export function lessonsForModule(moduleId: string): Lesson[] {
  return lessons.filter((lesson) => lesson.moduleId === moduleId);
}

export function publishedLessonsForModule(moduleId: string): Lesson[] {
  return lessonsForModule(moduleId).filter((lesson) => lesson.published);
}

export function neighborLessons(slug: string): { previous?: Lesson; next?: Lesson } {
  const published = getPublishedLessons();
  const index = published.findIndex((lesson) => lesson.slug === slug);
  if (index < 0) return {};
  return {
    previous: published[index - 1],
    next: published[index + 1],
  };
}

export function findExercise(lesson: Lesson, exerciseId: string): Exercise | undefined {
  return [...lesson.practice, ...lesson.mastery].find((item) => item.id === exerciseId);
}

export function getExam(id: string): ExamDef | undefined {
  if (id === "foundation") return foundationExam;
  if (id === "final") return finalExam;
  return undefined;
}

export function lessonOrderIndex(lessonId: string): number {
  return getPublishedLessons().findIndex((lesson) => lesson.id === lessonId);
}
