-- Curriculum progress for Grammar Mastery. Additive only.
CREATE TABLE "GrammarLessonProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "bestScore" INTEGER NOT NULL DEFAULT 0,
    "latestScore" INTEGER NOT NULL DEFAULT 0,
    "attemptsCount" INTEGER NOT NULL DEFAULT 0,
    "reviewStep" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "masteredAt" TIMESTAMP(3),
    "nextReviewAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrammarLessonProgress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GrammarExerciseAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "submittedAnswer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "score" INTEGER NOT NULL,
    "feedback" TEXT NOT NULL,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrammarExerciseAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GrammarAssessmentAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "resultDetails" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "GrammarAssessmentAttempt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GrammarLessonProgress_userId_lessonId_key" ON "GrammarLessonProgress"("userId", "lessonId");
CREATE INDEX "GrammarLessonProgress_userId_nextReviewAt_idx" ON "GrammarLessonProgress"("userId", "nextReviewAt");
CREATE INDEX "GrammarExerciseAttempt_userId_lessonId_idx" ON "GrammarExerciseAttempt"("userId", "lessonId");
CREATE INDEX "GrammarExerciseAttempt_userId_exerciseId_idx" ON "GrammarExerciseAttempt"("userId", "exerciseId");
CREATE INDEX "GrammarAssessmentAttempt_userId_assessmentId_idx" ON "GrammarAssessmentAttempt"("userId", "assessmentId");

ALTER TABLE "GrammarLessonProgress" ADD CONSTRAINT "GrammarLessonProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GrammarExerciseAttempt" ADD CONSTRAINT "GrammarExerciseAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GrammarAssessmentAttempt" ADD CONSTRAINT "GrammarAssessmentAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
