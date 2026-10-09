import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getSpeakItem } from "@/lib/speak-content";
import { evaluateSpeak, builderIsCorrect } from "@/lib/speak-eval";
import { saveSpeakAttempt } from "@/lib/speak";
import { getActivePersona } from "@/lib/persona";

const bodySchema = z.object({
  itemId: z.string().min(1),
  phase: z.enum([
    "retrieve",
    "construct",
    "speak_target",
    "scenario",
    "say_again",
  ]),
  transcript: z.string().optional().default(""),
  arranged: z.array(z.string()).optional(),
  attemptSlot: z.union([z.literal(1), z.literal(2)]).optional().default(1),
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

  const persona = await getActivePersona(session.user.id);
  if (!persona) {
    return NextResponse.json({ error: "Pilih persona dulu." }, { status: 409 });
  }

  const { itemId, phase, transcript, arranged, attemptSlot } = parsed.data;
  const item = getSpeakItem(itemId, persona);
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  if (phase === "construct") {
    const ok = builderIsCorrect(arranged ?? [], item);
    return NextResponse.json({
      correct: ok,
      target: ok ? item.target : undefined,
      targetId: ok ? item.targetId : undefined,
    });
  }

  const evalResult = evaluateSpeak(transcript, item);
  const mastered =
    phase === "say_again" &&
    evalResult.grammarScore >= 85 &&
    evalResult.meaningOk;

  await saveSpeakAttempt({
    userId: session.user.id,
    persona,
    itemId,
    phase,
    transcript,
    score: evalResult.grammarScore,
    attemptSlot,
    mastered: mastered || (phase === "say_again" && evalResult.grammarScore >= 92),
  });

  return NextResponse.json({
    ...evalResult,
    revealTarget: true,
    target: item.target,
    targetId: item.targetId,
  });
}
