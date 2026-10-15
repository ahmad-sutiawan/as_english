import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { markLessonStarted } from "@/lib/mastery/store";
import { getActivePersona } from "@/lib/persona";

const bodySchema = z.object({
  lessonId: z.string().min(1).max(80),
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
  const result = await markLessonStarted(session.user.id, parsed.data.lessonId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }
  return NextResponse.json({ status: result.status });
}
