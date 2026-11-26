import assert from "node:assert/strict";
import test from "node:test";
import { getGovExam, getGovModuleBySlug, getGovModules } from "@/lib/governance/catalog";
import { scoreGovExercise, scoreGovSet } from "@/lib/governance/score";

test("IT Governance catalog has 6 ordered modules starting with COBIT 2019", () => {
  const modules = getGovModules();
  assert.equal(modules.length, 6);
  assert.equal(modules[0]?.order, 1);
  assert.match(modules[0]?.title ?? "", /COBIT 2019/i);
  for (const mod of modules) {
    assert.ok(mod.id.startsWith("gov:"), `Module ${mod.id} must use gov: prefix`);
    assert.ok(mod.practice.length >= 5, `Module ${mod.slug} needs >= 5 practice exercises`);
    assert.ok(mod.mastery.length >= 5, `Module ${mod.slug} needs >= 5 mastery exercises`);
    assert.ok(mod.executiveEnglish.length >= 2, `Module ${mod.slug} needs executive English phrases`);
    assert.ok(getGovModuleBySlug(mod.slug), `Slug lookup failed for ${mod.slug}`);
  }
});

test("IT Governance final exam covers all 6 modules and scores cleanly", () => {
  const exam = getGovExam();
  assert.equal(exam.id, "gov:final");
  assert.equal(exam.questions.length, 12);
  const coveredModules = new Set(exam.questions.map((q) => q.moduleId));
  assert.equal(coveredModules.size, 6);

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
