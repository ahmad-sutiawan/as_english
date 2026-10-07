import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { completeQuickSession, QUICK_SESSION_SIZE } from "@/lib/quick";

const bodySchema = z.object({
  correctCount: z.number().int().min(0).max(QUICK_SESSION_SIZE),
  wrongCount: z.number().int().min(0).max(QUICK_SESSION_SIZE),
  heartsLeft: z.number().int().min(0).max(3),
  perfect: z.boolean(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { correctCount, heartsLeft, perfect } = parsed.data;
  const result = await completeQuickSession(session.user.id, {
    correctCount,
    perfect: perfect && heartsLeft === 3,
  });

  return NextResponse.json(result);
}
