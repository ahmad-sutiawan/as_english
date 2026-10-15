import type { LessonStatus } from "@/types/mastery";

export const REVIEW_INTERVALS = [1, 3, 7, 14, 30] as const;

export function scheduleAfterResult(currentStep: number, passed: boolean): {
  reviewStep: number;
  days: number;
} {
  if (!passed) {
    return { reviewStep: 0, days: REVIEW_INTERVALS[0] };
  }
  const step = Math.min(Math.max(currentStep, 0), REVIEW_INTERVALS.length - 1);
  const days = REVIEW_INTERVALS[step];
  const reviewStep = Math.min(step + 1, REVIEW_INTERVALS.length - 1);
  return { reviewStep, days };
}

export function addDays(from: Date, days: number): Date {
  const next = new Date(from.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

const COUNTED_DONE: LessonStatus[] = ["completed", "mastered", "needs_review"];

export function countsAsCompleted(status: LessonStatus | undefined): boolean {
  return status !== undefined && COUNTED_DONE.includes(status);
}

export function statusAfterMastery(percent: number, threshold: number): LessonStatus {
  return percent >= threshold ? "mastered" : "needs_review";
}

export function statusAfterPractice(current: LessonStatus | undefined): LessonStatus {
  if (current === "mastered" || current === "needs_review" || current === "completed") {
    return current;
  }
  return "completed";
}

export function curriculumPercent(completed: number, published: number): number {
  if (published <= 0) return 0;
  return Math.round((completed / published) * 100);
}

export type ProgressSnap = {
  lessonId: string;
  status: LessonStatus;
  nextReviewAt: Date | null;
  lastActivityAt: Date;
};

export function isDue(row: ProgressSnap, now: Date): boolean {
  if (!row.nextReviewAt) return false;
  if (row.status !== "mastered" && row.status !== "needs_review") return false;
  return row.nextReviewAt.getTime() <= now.getTime();
}

export function recommendLessonId(
  publishedIds: string[],
  rows: ProgressSnap[],
  now: Date,
): string | null {
  if (publishedIds.length === 0) return null;
  const byId = new Map(rows.map((row) => [row.lessonId, row]));
  const due = publishedIds.filter((id) => {
    const row = byId.get(id);
    return row ? isDue(row, now) : false;
  });
  if (due.length > 0) return due[0];

  const inProgress = publishedIds.find((id) => byId.get(id)?.status === "in_progress");
  if (inProgress) return inProgress;

  const review = publishedIds.find((id) => byId.get(id)?.status === "needs_review");
  if (review) return review;

  const fresh = publishedIds.find((id) => !byId.has(id) || byId.get(id)?.status === "not_started");
  if (fresh) return fresh;

  const unfinished = publishedIds.find((id) => byId.get(id)?.status !== "mastered");
  return unfinished ?? publishedIds[0];
}
