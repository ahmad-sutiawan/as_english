import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getItem } from "@/lib/content";
import { getActivePersona } from "@/lib/persona";
import { recordItemMemory } from "@/lib/memory";

const bodySchema = z.object({
  moduleId: z.string().min(1),
  itemId: z.string().min(1),
  choiceKey: z.enum(["A", "B", "C", "D"]),
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

  const { moduleId, itemId, choiceKey } = parsed.data;
  const persona = await getActivePersona(session.user.id);
  if (!persona) {
    return NextResponse.json({ error: "Pilih persona dulu." }, { status: 409 });
  }

  const item = getItem(moduleId, itemId, persona);
  if (!item || item.kind === "dialogue") {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const chosen = item.choices.find((c) => c.key === choiceKey);
  if (!chosen) {
    return NextResponse.json({ error: "Invalid choice" }, { status: 400 });
  }

  const correct = choiceKey === item.correctKey;
  const correctChoice = item.choices.find((c) => c.key === item.correctKey);

  if (!correct) {
    await recordItemMemory({
      userId: session.user.id,
      persona,
      source: "module",
      itemId,
      moduleId,
      result: "wrong",
    });
  }

  return NextResponse.json({
    correct,
    correctKey: item.correctKey,
    expected: correctChoice?.text ?? "",
    expectedId: correctChoice?.textId ?? "",
    expectedStructure: correctChoice?.structure ?? "",
    expectedStructureId: correctChoice?.structureId ?? "",
    explanation: item.explanation,
  });
}
