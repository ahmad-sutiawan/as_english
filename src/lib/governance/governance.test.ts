import assert from "node:assert/strict";
import test from "node:test";
import { getGovExam, getGovModuleBySlug, getGovModules } from "@/lib/governance/catalog";
import { scoreGovExercise, scoreGovSet } from "@/lib/governance/score";

test("IT Governance catalog has 11 ordered modules starting with COBIT 2019", () => {
  const modules = getGovModules();
  assert.equal(modules.length, 11);
  assert.deepEqual(
    modules.map((m) => m.order),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  );
  assert.match(modules[0]?.title ?? "", /COBIT 2019/i);
  for (const mod of modules) {
    assert.ok(mod.id.startsWith("gov:"), `Module ${mod.id} must use gov: prefix`);
    assert.ok(mod.practice.length >= 5, `Module ${mod.slug} needs >= 5 practice exercises`);
    assert.ok(mod.mastery.length >= 5, `Module ${mod.slug} needs >= 5 mastery exercises`);
    assert.ok(mod.executiveEnglish.length >= 2, `Module ${mod.slug} needs executive English phrases`);
    assert.ok(getGovModuleBySlug(mod.slug), `Slug lookup failed for ${mod.slug}`);
  }
});

test("COBIT 2019 modules contain 50 unique, self-scoring questions", () => {
  const cobitModules = getGovModules().filter((mod) => mod.order === 1 || mod.order === 2);
  assert.equal(cobitModules.length, 2);

  const allQuestions = cobitModules.flatMap((mod) => [...mod.practice, ...mod.mastery]);
  assert.equal(allQuestions.length, 50);

  const ids = new Set(allQuestions.map((q) => q.id));
  assert.equal(ids.size, 50, "Every COBIT 2019 question ID must be unique");

  const perfectAnswers = Object.fromEntries(
    allQuestions.map((q) => [q.id, q.acceptable[0] ?? ""]),
  );
  const scored = scoreGovSet(allQuestions, perfectAnswers);
  assert.equal(scored.percent, 100);
});

test("ITIL 4 modules contain 50 unique, self-scoring questions", () => {
  const itilModules = getGovModules().filter((mod) => mod.order === 4 || mod.order === 5);
  assert.equal(itilModules.length, 2);

  const allQuestions = itilModules.flatMap((mod) => [...mod.practice, ...mod.mastery]);
  assert.equal(allQuestions.length, 50);

  const ids = new Set(allQuestions.map((q) => q.id));
  assert.equal(ids.size, 50, "Every ITIL 4 question ID must be unique");

  const perfectAnswers = Object.fromEntries(
    allQuestions.map((q) => [q.id, q.acceptable[0] ?? ""]),
  );
  const scored = scoreGovSet(allQuestions, perfectAnswers);
  assert.equal(scored.percent, 100);
});

test("5 Domains of IT Governance modules contain 50 unique, self-scoring questions", () => {
  const domainModules = getGovModules().filter((mod) => mod.order === 6 || mod.order === 7);
  assert.equal(domainModules.length, 2);

  const allQuestions = domainModules.flatMap((mod) => [...mod.practice, ...mod.mastery]);
  assert.equal(allQuestions.length, 50);

  const ids = new Set(allQuestions.map((q) => q.id));
  assert.equal(ids.size, 50, "Every 5 Domains question ID must be unique");

  const perfectAnswers = Object.fromEntries(
    allQuestions.map((q) => [q.id, q.acceptable[0] ?? ""]),
  );
  const scored = scoreGovSet(allQuestions, perfectAnswers);
  assert.equal(scored.percent, 100);
});

test("Unicorn Track modules contain 50 unique questions including rubric-graded writing", () => {
  const unicornModules = getGovModules().filter((mod) => mod.order === 10 || mod.order === 11);
  assert.equal(unicornModules.length, 2);

  const allQuestions = unicornModules.flatMap((mod) => [...mod.practice, ...mod.mastery]);
  assert.equal(allQuestions.length, 50);

  const ids = new Set(allQuestions.map((q) => q.id));
  assert.equal(ids.size, 50, "Every Unicorn Track question ID must be unique");

  const writingQuestions = allQuestions.filter((q) => q.type === "writing");
  assert.equal(writingQuestions.length, 4);

  const perfectAnswers = Object.fromEntries(
    allQuestions.map((q) => [q.id, q.type === "writing" ? (q.modelAnswer ?? "") : (q.acceptable[0] ?? "")]),
  );
  const scored = scoreGovSet(allQuestions, perfectAnswers);
  assert.equal(scored.percent, 100);

  const weakWriting = scoreGovExercise(writingQuestions[0], "Saya setuju saja.");
  assert.equal(weakWriting.correct, false);
});

test("IT Governance final exam has 50 unique questions covering all 11 modules", () => {
  const exam = getGovExam();
  assert.equal(exam.id, "gov:final");
  assert.equal(exam.questions.length, 50);

  const ids = new Set(exam.questions.map((q) => q.id));
  assert.equal(ids.size, 50, "Every final exam question ID must be unique");

  const coveredModules = new Set(exam.questions.map((q) => q.moduleId));
  assert.equal(coveredModules.size, 11);

  const perfectAnswers = Object.fromEntries(
    exam.questions.map((q) => [q.id, q.acceptable[0] ?? ""]),
  );
  const result = scoreGovSet(exam.questions, perfectAnswers);
  assert.equal(result.percent, 100);
});

test("short answer scoring ignores case and punctuation", () => {
  const mod = getGovModules()[0];
  const shortQ = mod.practice.find((q) => q.type === "short_answer");
  assert.ok(shortQ);
  const pass = scoreGovExercise(shortQ, "  edm. ");
  assert.equal(pass.correct, true);
  const fail = scoreGovExercise(shortQ, "DSS");
  assert.equal(fail.correct, false);
});
