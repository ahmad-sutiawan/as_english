import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { submitExam } from "@/lib/mastery/store";
import { getActivePersona } from "@/lib/persona";

const bodySchema = z.object({
  examId: z.enum(["foundation", "final"]),
  answers: z.record(z.string(), z.string().max(2000)),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const persona = await getActivePersona(session.user.id);
  if (!persona) {
    return NextResponse.json({ error: "Pilih persona dulu." }, { status: 409 });
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Jawaban tidak valid." }, { status: 400 });
  }
  const result = await submitExam(session.user.id, parsed.data.examId, parsed.data.answers);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({
    score: result.score,
    passed: result.passed,
    sections: result.sections,
    weakLessons: result.weakLessons,
    results: result.results,
  });
}
