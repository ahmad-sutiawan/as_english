import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getItem, getItemForm } from "@/lib/content";
import { evaluateForm } from "@/lib/form-eval";
import { getActivePersona } from "@/lib/persona";
import { recordItemMemory } from "@/lib/memory";

const bodySchema = z
  .object({
    moduleId: z.string().min(1),
    itemId: z.string().min(1),
    choiceKey: z.enum(["A", "B", "C", "D"]).optional(),
    typed: z.string().optional(),
    attemptSlot: z.union([z.literal(1), z.literal(2)]).optional(),
  })
  .refine((data) => Boolean(data.choiceKey) || Boolean(data.typed?.trim()), {
    message: "Jawaban kosong.",
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

  const { moduleId, itemId, choiceKey, typed, attemptSlot } = parsed.data;
  const persona = await getActivePersona(session.user.id);
  if (!persona) {
    return NextResponse.json({ error: "Pilih persona dulu." }, { status: 409 });
  }

  const item = getItem(moduleId, itemId, persona);
  if (!item || item.kind === "dialogue") {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  if (!choiceKey && typed?.trim()) {
    const form = getItemForm(item);
    const evaluated = evaluateForm({
      transcript: typed,
      models: form.models,
      chunks: form.chunks,
      slots: form.slots,
      commonErrors: form.commonErrors ?? [],
    });
    const slot = attemptSlot ?? 1;
    if (slot === 1) {
      await recordItemMemory({
        userId: session.user.id,
        persona,
        source: "module",
        itemId,
        moduleId,
        result: evaluated.exact ? "exact" : evaluated.passed ? "near" : "wrong",
      });
    }
    const reveal = evaluated.passed || slot >= 2;
    return NextResponse.json({
      passed: evaluated.passed,
      exact: evaluated.exact,
      headline: evaluated.headline,
      correction: evaluated.corrections[0] ?? "",
      missedTokens: evaluated.missedTokens,
      expected: reveal ? evaluated.bestModel || form.expected : "",
      expectedId: form.expectedId,
    });
  }

  if (!choiceKey) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
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
