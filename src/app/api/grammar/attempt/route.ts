import { NextResponse } from "next/server";
import { z } from "zod";
import { scoreAnswer } from "@/lib/answer";
import { auth } from "@/lib/auth";
import { grammarPrompt } from "@/lib/grammar";
import { recordItemMemory } from "@/lib/memory";
import { getActivePersona } from "@/lib/persona";

const bodySchema = z.object({
  itemId: z.string().min(1),
  typed: z.string().min(1),
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

  const prompt = grammarPrompt(parsed.data.itemId);
  if (!prompt || prompt.models.length === 0) {
    return NextResponse.json({ error: "Kalimat tidak ditemukan." }, { status: 404 });
  }

  const scores = prompt.models.map((model) => scoreAnswer(parsed.data.typed, model));
  const exact = scores.some((score) => score.exact);
  const nearMiss = !exact && scores.some((score) => score.nearMiss);
  const passed = exact || nearMiss;

  await recordItemMemory({
    userId: session.user.id,
    persona,
    source: "grammar",
    itemId: parsed.data.itemId,
    result: exact ? "exact" : nearMiss ? "near" : "wrong",
  });

  return NextResponse.json({
    passed,
    exact,
    nearMiss,
    meaningId: prompt.meaningId,
  });
}
