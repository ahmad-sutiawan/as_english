import assert from "node:assert/strict";
import test from "node:test";
import { getLessons, getModules, getPhases, getPublishedLessons } from "@/lib/mastery/catalog";
import { foundationExam, finalExam } from "@/lib/mastery/content/exams";
import {
  curriculumPercent,
  recommendLessonId,
  scheduleAfterResult,
  statusAfterMastery,
} from "@/lib/mastery/schedule";
import {
  masteryNormalize,
  passedThreshold,
  scoreExercise,
  weightedExamPercent,
} from "@/lib/mastery/score";
import type { Exercise } from "@/types/mastery";

const sample: Exercise = {
  id: "sample",
  type: "translate_id_en",
  prompt: "Saya sudah menyelesaikan laporan tersebut.",
  acceptable: ["I have completed the report.", "I've finished the report."],
  explanation: "Hasilnya relevan sekarang.",
  difficulty: "core",
  points: 1,
  competency: "communication",
};

test("accepts an alternative translation and ignores case and space", () => {
  const first = scoreExercise(sample, "  I HAVE COMPLETED THE REPORT. ");
  const second = scoreExercise(sample, "I've finished the report");
  assert.equal(first.correct, true);
  assert.equal(second.correct, true);
  assert.match(second.feedback, /juga benar/);
});

test("rejects a wrong answer and keeps the reason", () => {
  const result = scoreExercise(sample, "I complete the report yesterday");
  assert.equal(result.correct, false);
  assert.equal(result.score, 0);
  assert.match(result.feedback, /belum tepat/i);
});

test("mastery threshold is 80", () => {
  assert.equal(passedThreshold(79), false);
  assert.equal(passedThreshold(80), true);
  assert.equal(statusAfterMastery(80, 80), "mastered");
  assert.equal(statusAfterMastery(79, 80), "needs_review");
});

test("review intervals move forward only after a pass", () => {
  assert.deepEqual(scheduleAfterResult(0, true), { reviewStep: 1, days: 1 });
  assert.deepEqual(scheduleAfterResult(1, true), { reviewStep: 2, days: 3 });
  assert.deepEqual(scheduleAfterResult(2, true), { reviewStep: 3, days: 7 });
  assert.deepEqual(scheduleAfterResult(3, true), { reviewStep: 4, days: 14 });
  assert.deepEqual(scheduleAfterResult(4, true), { reviewStep: 4, days: 30 });
  assert.deepEqual(scheduleAfterResult(4, false), { reviewStep: 0, days: 1 });
});

test("progress ignores unpublished lessons", () => {
  assert.equal(curriculumPercent(2, 4), 50);
  assert.equal(curriculumPercent(0, 0), 0);
});

test("weighted exam uses section percents", () => {
  const scored = weightedExamPercent([
    { competency: "concept", correct: true, points: 1 },
    { competency: "construction", correct: false, points: 1 },
    { competency: "communication", correct: true, points: 1 },
    { competency: "writing", correct: true, points: 1 },
  ]);
  assert.equal(scored.sections.construction.percent, 0);
  assert.equal(scored.total, 75);
});

test("continue learning starts at the first lesson", () => {
  const ids = ["a", "b"];
  assert.equal(recommendLessonId(ids, [], new Date()), "a");
});

test("catalog has 6 phases, 29 modules, and published lessons with real exercises", () => {
  assert.equal(getPhases().length, 6);
  assert.equal(getModules().length, 29);
  const lessons = getPublishedLessons();
  assert.equal(lessons.length, 29);
  assert.equal(getLessons().filter((lesson) => !lesson.published).length, 0);
  const types = [
    "mcq",
    "blank",
    "correction",
    "transform",
    "translate_id_en",
    "translate_en_id",
    "arrange",
    "dialogue",
    "choose",
    "writing",
  ];
  for (const lesson of lessons) {
    assert.equal(lesson.examples.basic.length, 5);
    assert.equal(lesson.examples.daily.length, 5);
    assert.equal(lesson.examples.office.length, 5);
    assert.equal(lesson.examples.social.length, 3);
    assert.equal(lesson.examples.negative.length, 3);
    assert.equal(lesson.examples.question.length, 3);
    assert.ok(lesson.dialogues.length >= 2);
    assert.ok(lesson.mistakes.length >= 3);
    assert.equal(lesson.mastery.length, 10);
    assert.deepEqual(
      lesson.practice.map((item) => item.type),
      types,
    );
    assert.ok(lesson.objectives.length >= 4);
    assert.ok(lesson.concept.length >= 2);
    for (const exercise of [...lesson.practice, ...lesson.mastery]) {
      if (exercise.type === "writing") {
        const reference = masteryNormalize(exercise.reference ?? "");
        for (const rule of exercise.rubric ?? []) {
          const needle = masteryNormalize(rule.pattern);
          assert.ok(needle.length > 0, lesson.id);
          assert.ok(reference.includes(needle), `${lesson.id} ${rule.pattern}`);
        }
      } else if (exercise.type === "mcq" || exercise.type === "choose") {
        assert.ok(exercise.options?.some((option) => option.key === exercise.acceptable[0]));
      } else {
        assert.ok(exercise.acceptable.length > 0, lesson.id + exercise.id);
        const scored = scoreExercise(exercise, exercise.acceptable[0]);
        assert.equal(scored.correct, true, `${lesson.id} ${exercise.id}`);
      }
    }
  }
});

test("exams cover every competency and their keys score", () => {
  for (const exam of [foundationExam, finalExam]) {
    const competencies = new Set(exam.questions.map((item) => item.competency));
    assert.equal(competencies.size, 4);
    for (const question of exam.questions) {
      if (question.type === "writing") continue;
      assert.equal(scoreExercise(question, question.acceptable[0]).correct, true, question.id);
    }
  }
});
