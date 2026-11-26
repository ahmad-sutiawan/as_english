import { prisma } from "@/lib/db";
import { getGovExam, getGovModuleById, getGovModules } from "@/lib/governance/catalog";
import { scoreGovSet, toPublicGovExercise } from "@/lib/governance/score";
import {
  addDays,
  countsAsCompleted,
  curriculumPercent,
  scheduleAfterResult,
  statusAfterMastery,
  statusAfterPractice,
} from "@/lib/mastery/schedule";
import type { GovModule, GovProgressStatus } from "@/types/governance";

export async function markGovModuleStarted(userId: string, moduleId: string) {
  const mod = getGovModuleById(moduleId);
  if (!mod) return { ok: false as const, error: "Modul tidak ditemukan." };
  const existing = await prisma.grammarLessonProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId: mod.id } },
  });
  if (existing) return { ok: true as const, status: existing.status as GovProgressStatus };
  const created = await prisma.grammarLessonProgress.create({
    data: { userId, lessonId: mod.id, status: "in_progress" },
  });
  return { ok: true as const, status: created.status as GovProgressStatus };
}

export async function submitGovPractice(
  userId: string,
  moduleId: string,
  answers: Record<string, string>,
) {
  const mod = getGovModuleById(moduleId);
  if (!mod) return { ok: false as const, error: "Modul tidak ditemukan." };

  const scored = scoreGovSet(mod.practice, answers);
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.grammarExerciseAttempt.createMany({
      data: scored.results.map((result) => ({
        userId,
        lessonId: mod.id,
        exerciseId: result.exerciseId,
        kind: "practice",
        submittedAnswer: (answers[result.exerciseId] ?? "").slice(0, 2000),
        isCorrect: result.correct,
        score: result.score,
        feedback: result.feedback,
      })),
    });
    const existing = await tx.grammarLessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId: mod.id } },
    });
    const nextStatus = statusAfterPractice(existing?.status as GovProgressStatus | undefined);
    await tx.grammarLessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId: mod.id } },
      create: {
        userId,
        lessonId: mod.id,
        status: nextStatus,
        completedAt: nextStatus === "completed" ? now : null,
        lastActivityAt: now,
      },
      update: {
        status: nextStatus,
        completedAt:
          existing?.completedAt ?? (nextStatus === "completed" ? now : existing?.completedAt),
        lastActivityAt: now,
      },
    });
  });

  return { ok: true as const, results: scored.results, percent: scored.percent };
}

export async function submitGovMastery(
  userId: string,
  moduleId: string,
  answers: Record<string, string>,
) {
  const mod = getGovModuleById(moduleId);
  if (!mod) return { ok: false as const, error: "Modul tidak ditemukan." };

  const scored = scoreGovSet(mod.mastery, answers);
  const passed = scored.percent >= mod.masteryThreshold;
  const now = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    await tx.grammarExerciseAttempt.createMany({
      data: scored.results.map((result) => ({
        userId,
        lessonId: mod.id,
        exerciseId: result.exerciseId,
        kind: "mastery",
        submittedAnswer: (answers[result.exerciseId] ?? "").slice(0, 2000),
        isCorrect: result.correct,
        score: result.score,
        feedback: result.feedback,
      })),
    });
    const existing = await tx.grammarLessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId: mod.id } },
    });
    const nextStatus = statusAfterMastery(scored.percent, mod.masteryThreshold);
    const schedule = scheduleAfterResult(existing?.reviewStep ?? 0, passed);
    const nextReviewAt = addDays(now, schedule.days);
    return tx.grammarLessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId: mod.id } },
      create: {
        userId,
        lessonId: mod.id,
        status: nextStatus,
        bestScore: scored.percent,
        latestScore: scored.percent,
        attemptsCount: 1,
        reviewStep: schedule.reviewStep,
        completedAt: now,
        masteredAt: passed ? now : null,
        nextReviewAt,
        lastActivityAt: now,
      },
      update: {
        status: nextStatus,
        bestScore: Math.max(existing?.bestScore ?? 0, scored.percent),
        latestScore: scored.percent,
        attemptsCount: { increment: 1 },
        reviewStep: schedule.reviewStep,
        completedAt: existing?.completedAt ?? now,
        masteredAt: passed ? (existing?.masteredAt ?? now) : existing?.masteredAt,
        nextReviewAt,
        lastActivityAt: now,
      },
    });
  });

  return {
    ok: true as const,
    results: scored.results,
    percent: scored.percent,
    passed,
    threshold: mod.masteryThreshold,
    status: updated.status as GovProgressStatus,
  };
}

export async function submitGovExam(userId: string, answers: Record<string, string>) {
  const exam = getGovExam();
  const scored = scoreGovSet(exam.questions, answers);
  const passed = scored.percent >= exam.passingScore;
  const weakModuleIds = [
    ...new Set(
      exam.questions
        .filter((q) => !scored.results.find((r) => r.exerciseId === q.id)?.correct)
        .map((q) => q.moduleId),
    ),
  ];

  const attempt = await prisma.grammarAssessmentAttempt.create({
    data: {
      userId,
      assessmentId: exam.id,
      score: scored.percent,
      status: passed ? "passed" : "failed",
      resultDetails: {
        weakModuleIds,
        results: scored.results,
      },
      submittedAt: new Date(),
    },
  });

  return {
    ok: true as const,
    attemptId: attempt.id,
    score: scored.percent,
    passed,
    passingScore: exam.passingScore,
    weakModuleIds,
    results: scored.results,
  };
}

export async function loadGovDashboard(userId: string) {
  const modules = getGovModules();
  const rows = await prisma.grammarLessonProgress.findMany({
    where: { userId, lessonId: { startsWith: "gov:" } },
    orderBy: { lastActivityAt: "desc" },
  });
  const byId = new Map(rows.map((row) => [row.lessonId, row]));

  const completed = modules.filter((mod) =>
    countsAsCompleted(byId.get(mod.id)?.status as GovProgressStatus | undefined),
  ).length;
  const mastered = modules.filter((mod) => byId.get(mod.id)?.status === "mastered").length;
  const needsReview = modules.filter((mod) => byId.get(mod.id)?.status === "needs_review").length;

  const next =
    modules.find((mod) => byId.get(mod.id)?.status === "needs_review") ??
    modules.find((mod) => byId.get(mod.id)?.status === "in_progress") ??
    modules.find((mod) => !byId.get(mod.id)) ??
    modules[0];

  const examAttempts = await prisma.grammarAssessmentAttempt.findMany({
    where: { userId, assessmentId: { startsWith: "gov:" } },
    orderBy: { startedAt: "desc" },
    take: 5,
  });

  const examOpen = completed === modules.length;

  return {
    totalModules: modules.length,
    completed,
    mastered,
    needsReview,
    percent: curriculumPercent(completed, modules.length),
    next,
    examOpen,
    examAttempts,
    progressById: Object.fromEntries(
      rows.map((row) => [
        row.lessonId,
        {
          status: row.status as GovProgressStatus,
          bestScore: row.bestScore,
          latestScore: row.latestScore,
          attemptsCount: row.attemptsCount,
        },
      ]),
    ),
  };
}

export function publicGovModuleExercises(mod: GovModule) {
  return {
    practice: mod.practice.map(toPublicGovExercise),
    mastery: mod.mastery.map(toPublicGovExercise),
  };
}
