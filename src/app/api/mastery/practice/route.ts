import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { submitPractice } from "@/lib/mastery/store";
import { getActivePersona } from "@/lib/persona";

const bodySchema = z.object({
  lessonId: z.string().min(1).max(80),
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
  const result = await submitPractice(session.user.id, parsed.data.lessonId, parsed.data.answers);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({
    percent: result.percent,
    results: result.results,
  });
}
