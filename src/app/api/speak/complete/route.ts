import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { completeSpeakSession } from "@/lib/speak";

const bodySchema = z.object({
  mastered: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const result = await completeSpeakSession(session.user.id, {
    mastered: parsed.data.mastered,
  });

  return NextResponse.json({
    xpGained: result.xpGained,
    xp: result.xp,
    streak: result.streak,
    bestStreak: result.bestStreak,
    sessionsDone: result.sessionsDone,
  });
}
