import { NextResponse } from "next/server";
import { z } from "zod";
import { getGovExam, getGovModuleById } from "@/lib/governance/catalog";
import { getItGovernanceApiAuth } from "@/lib/governance/guard";
import { scoreGovExercise } from "@/lib/governance/score";

const validateSchema = z.object({
  moduleId: z.string().min(1).max(80).optional(),
  exerciseId: z.string().min(1).max(64),
  answer: z.string().max(4000),
});

export async function POST(request: Request) {
  const authResult = await getItGovernanceApiAuth();
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const raw = await request.json().catch(() => null);
  const parsed = validateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data validasi tidak valid." }, { status: 400 });
  }

  const { moduleId, exerciseId, answer } = parsed.data;
  const exercise = moduleId
    ? (() => {
        const mod = getGovModuleById(moduleId);
        if (!mod) return undefined;
        return [...mod.practice, ...mod.mastery].find((item) => item.id === exerciseId);
      })()
    : getGovExam().questions.find((item) => item.id === exerciseId);

  if (!exercise) {
    return NextResponse.json({ error: "Soal tidak ditemukan." }, { status: 404 });
  }

  const scored = scoreGovExercise(exercise, answer);
  return NextResponse.json({
    ok: true,
    correct: scored.correct,
    feedback: scored.feedback,
    correctAnswer: scored.correctAnswer,
    explanation: exercise.explanation,
  });
}
