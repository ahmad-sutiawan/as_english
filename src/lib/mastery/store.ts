import { prisma } from "@/lib/db";
import {
  findExercise,
  getExam,
  getLesson,
  getModule,
  getPhases,
  getPublishedLessons,
  publishedLessonsForModule,
} from "@/lib/mastery/catalog";
import {
  addDays,
  countsAsCompleted,
  curriculumPercent,
  recommendLessonId,
  scheduleAfterResult,
  statusAfterMastery,
  statusAfterPractice,
  type ProgressSnap,
} from "@/lib/mastery/schedule";
import { passedThreshold, scoreSet, toPublicExercise, weightedExamPercent } from "@/lib/mastery/score";
import type { ExamDef, Lesson, LessonStatus } from "@/types/mastery";

const FOUNDATION_MODULES = [
  "sentence-structure",
  "parts-of-speech",
  "svoc",
  "to-be-auxiliaries",
  "polarity-questions",
];

export async function markLessonStarted(userId: string, lessonId: string) {
  const lesson = getLesson(lessonId);
  if (!lesson?.published) {
    return { ok: false as const, error: "Lesson belum dipublikasikan." };
  }
  const existing = await prisma.grammarLessonProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
  });
  if (existing) return { ok: true as const, status: existing.status as LessonStatus };
  const created = await prisma.grammarLessonProgress.create({
    data: { userId, lessonId, status: "in_progress" },
  });
  return { ok: true as const, status: created.status as LessonStatus };
}

export async function submitPractice(
  userId: string,
  lessonId: string,
  answers: Record<string, string>,
) {
  const lesson = getLesson(lessonId);
  if (!lesson?.published) return { ok: false as const, error: "Lesson belum dipublikasikan." };
  const unknown = Object.keys(answers).filter((id) => !lesson.practice.some((item) => item.id === id));
  if (unknown.length > 0) return { ok: false as const, error: "Soal tidak valid." };

  const scored = scoreSet(lesson.practice, answers);
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.grammarExerciseAttempt.createMany({
      data: scored.results.map((result) => ({
        userId,
        lessonId,
        exerciseId: result.exerciseId,
        kind: "practice",
        submittedAnswer: (answers[result.exerciseId] ?? "").slice(0, 2000),
        isCorrect: result.correct,
        score: result.score,
        feedback: result.feedback,
      })),
    });
    const existing = await tx.grammarLessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });
    const nextStatus = statusAfterPractice(existing?.status as LessonStatus | undefined);
    await tx.grammarLessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: {
        userId,
        lessonId,
        status: nextStatus,
        completedAt: nextStatus === "completed" ? now : null,
        lastActivityAt: now,
      },
      update: {
        status: nextStatus,
        completedAt: existing?.completedAt ?? (nextStatus === "completed" ? now : existing?.completedAt),
        lastActivityAt: now,
      },
    });
  });
  return { ok: true as const, results: scored.results, percent: scored.percent };
}

export async function submitMastery(
  userId: string,
  lessonId: string,
  answers: Record<string, string>,
) {
  const lesson = getLesson(lessonId);
  if (!lesson?.published) return { ok: false as const, error: "Lesson belum dipublikasikan." };
  const missing = lesson.mastery.filter((item) => !(item.id in answers));
  if (missing.length > 0) return { ok: false as const, error: "Semua soal mastery perlu dijawab." };

  const scored = scoreSet(lesson.mastery, answers);
  const passed = passedThreshold(scored.percent, lesson.masteryThreshold);
  const now = new Date();

  const saved = await prisma.$transaction(async (tx) => {
    await tx.grammarExerciseAttempt.createMany({
      data: scored.results.map((result) => ({
        userId,
        lessonId,
        exerciseId: result.exerciseId,
        kind: "mastery",
        submittedAnswer: (answers[result.exerciseId] ?? "").slice(0, 2000),
        isCorrect: result.correct,
        score: result.score,
        feedback: result.feedback,
      })),
    });
    const existing = await tx.grammarLessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });
    const schedule = scheduleAfterResult(existing?.reviewStep ?? 0, passed);
    const status = statusAfterMastery(scored.percent, lesson.masteryThreshold);
    const row = await tx.grammarLessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: {
        userId,
        lessonId,
        status,
        bestScore: scored.percent,
        latestScore: scored.percent,
        attemptsCount: 1,
        reviewStep: schedule.reviewStep,
        completedAt: now,
        masteredAt: passed ? now : null,
        nextReviewAt: addDays(now, schedule.days),
        lastActivityAt: now,
      },
      update: {
        status,
        bestScore: Math.max(existing?.bestScore ?? 0, scored.percent),
        latestScore: scored.percent,
        attemptsCount: (existing?.attemptsCount ?? 0) + 1,
        reviewStep: schedule.reviewStep,
        completedAt: existing?.completedAt ?? now,
        masteredAt: passed ? (existing?.masteredAt ?? now) : existing?.masteredAt,
        nextReviewAt: addDays(now, schedule.days),
        lastActivityAt: now,
      },
    });
    return row;
  });

  const missed = scored.results.filter((item) => !item.correct).map((item) => item.exerciseId);
  return {
    ok: true as const,
    percent: scored.percent,
    passed,
    threshold: lesson.masteryThreshold,
    status: saved.status,
    masteredAt: saved.masteredAt,
    results: scored.results,
    reviewLessonIds: missed.length > 0 ? [lessonId] : [],
  };
}

export function examUnlocked(
  exam: ExamDef,
  rows: { lessonId: string; status: string }[],
): { open: boolean; reason: string } {
  const published = getPublishedLessons();
  const byId = new Map(rows.map((row) => [row.lessonId, row.status as LessonStatus]));
  if (exam.id === "foundation") {
    const required = published.filter((lesson) => FOUNDATION_MODULES.includes(lesson.moduleId));
    const ready = required.every((lesson) => countsAsCompleted(byId.get(lesson.id)));
    return ready
      ? { open: true, reason: "" }
      : { open: false, reason: "Selesaikan lima lesson fondasi terlebih dahulu." };
  }
  const ready = published.every((lesson) => countsAsCompleted(byId.get(lesson.id)));
  return ready
    ? { open: true, reason: "" }
    : {
        open: false,
        reason: "Ujian akhir terbuka setelah setiap lesson yang dipublikasikan selesai atau dikuasai.",
      };
}

export async function submitExam(userId: string, examId: string, answers: Record<string, string>) {
  const exam = getExam(examId);
  if (!exam) return { ok: false as const, error: "Ujian tidak ditemukan." };
  const rows = await prisma.grammarLessonProgress.findMany({
    where: { userId },
    select: { lessonId: true, status: true },
  });
  const gate = examUnlocked(exam, rows);
  if (!gate.open) return { ok: false as const, error: gate.reason };

  const scored = scoreSet(exam.questions, answers);
  const weighted = weightedExamPercent(
    exam.questions.map((question) => {
      const result = scored.results.find((item) => item.exerciseId === question.id);
      return {
        competency: question.competency,
        correct: result?.correct ?? false,
        points: question.points,
      };
    }),
  );
  const passed = passedThreshold(weighted.total, exam.passingScore);
  const weakLessons = [
    ...new Set(
      exam.questions
        .filter((question) => !scored.results.find((item) => item.exerciseId === question.id)?.correct)
        .map((question) => question.lessonId),
    ),
  ];
  const details = {
    sections: weighted.sections,
    weakLessons,
    results: scored.results,
  };
  const attempt = await prisma.grammarAssessmentAttempt.create({
    data: {
      userId,
      assessmentId: exam.id,
      score: weighted.total,
      status: passed ? "passed" : "failed",
      resultDetails: details,
      submittedAt: new Date(),
    },
  });
  return {
    ok: true as const,
    attemptId: attempt.id,
    score: weighted.total,
    passed,
    sections: weighted.sections,
    weakLessons,
    results: scored.results,
  };
}

export async function loadDashboard(userId: string) {
  const published = getPublishedLessons();
  const rows = await prisma.grammarLessonProgress.findMany({
    where: { userId },
    orderBy: { lastActivityAt: "desc" },
  });
  const snaps: ProgressSnap[] = rows.map((row) => ({
    lessonId: row.lessonId,
    status: row.status as LessonStatus,
    nextReviewAt: row.nextReviewAt,
    lastActivityAt: row.lastActivityAt,
  }));
  const now = new Date();
  const completed = published.filter((lesson) =>
    countsAsCompleted(snaps.find((row) => row.lessonId === lesson.id)?.status),
  ).length;
  const mastered = snaps.filter((row) => row.status === "mastered").length;
  const needsReview = snaps.filter((row) => row.status === "needs_review").length;
  const due = snaps.filter((row) => {
    const lesson = published.find((item) => item.id === row.lessonId);
    return lesson && row.nextReviewAt && row.nextReviewAt <= now && (row.status === "mastered" || row.status === "needs_review");
  });
  const nextId = recommendLessonId(
    published.map((lesson) => lesson.id),
    snaps,
    now,
  );
  const next = nextId ? getLesson(nextId) : undefined;
  const latest = rows[0];
  const phase = next ? getPhases().find((item) => item.id === getModule(next.moduleId)?.phaseId) : getPhases()[0];
  const assessments = await prisma.grammarAssessmentAttempt.findMany({
    where: { userId },
    orderBy: { startedAt: "desc" },
    take: 5,
  });
  return {
    publishedCount: published.length,
    completed,
    mastered,
    needsReview,
    percent: curriculumPercent(completed, published.length),
    due: due.flatMap((row) => {
      const lesson = getLesson(row.lessonId);
      return lesson ? [{ lesson, nextReviewAt: row.nextReviewAt }] : [];
    }),
    next,
    phaseTitle: phase?.title ?? "Fondasi kalimat",
    latest: latest
      ? {
          lesson: getLesson(latest.lessonId),
          at: latest.lastActivityAt,
          status: latest.status as LessonStatus,
        }
      : null,
    assessments,
    rows,
  };
}

export function publicLessonExercises(lesson: Lesson) {
  return {
    practice: lesson.practice.map(toPublicExercise),
    mastery: lesson.mastery.map(toPublicExercise),
  };
}

export function moduleProgress(
  moduleId: string,
  rows: { lessonId: string; status: string }[],
) {
  const lessons = publishedLessonsForModule(moduleId);
  const done = lessons.filter((lesson) =>
    countsAsCompleted(rows.find((row) => row.lessonId === lesson.id)?.status as LessonStatus | undefined),
  ).length;
  return { total: lessons.length, done };
}

export function exerciseOrNull(lessonId: string, exerciseId: string) {
  const lesson = getLesson(lessonId);
  if (!lesson) return undefined;
  return findExercise(lesson, exerciseId);
}
