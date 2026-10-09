import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getItem, getItemForm } from "@/lib/content";
import { evaluateForm } from "@/lib/form-eval";
import { getActivePersona } from "@/lib/persona";
import { recordItemMemory, scheduleSiblingItems } from "@/lib/memory";

const attemptSchema = z.object({
  moduleId: z.string().min(1),
  itemId: z.string().min(1),
  typedAnswer: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = attemptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { moduleId, itemId, typedAnswer } = parsed.data;
  const persona = await getActivePersona(session.user.id);
  if (!persona) {
    return NextResponse.json({ error: "Pilih persona dulu." }, { status: 409 });
  }

  const item = getItem(moduleId, itemId, persona);
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const form = getItemForm(item);
  const evaluated = evaluateForm({
    transcript: typedAnswer,
    models: form.models,
    chunks: form.chunks,
    slots: form.slots,
    commonErrors: form.commonErrors ?? [],
  });
  const result = {
    exact: evaluated.exact,
    nearMiss: evaluated.nearMiss && !evaluated.exact,
  };

  await prisma.attempt.create({
    data: {
      userId: session.user.id,
      moduleId,
      itemId,
      typedAnswer,
      correct: result.exact,
    },
  });

  await recordItemMemory({
    userId: session.user.id,
    persona,
    source: "module",
    itemId,
    moduleId,
    result: result.exact ? "exact" : result.nearMiss ? "near" : "wrong",
  });
  if (!result.exact) {
    await scheduleSiblingItems({
      userId: session.user.id,
      persona,
      moduleId,
      itemId,
    });
  }

  if (result.exact) {
    const existing = await prisma.progress.findUnique({
      where: {
        userId_moduleId: {
          userId: session.user.id,
          moduleId,
        },
      },
    });

    const completed = new Set(existing?.completedItemIds ?? []);
    completed.add(itemId);

    const mastery =
      existing?.mastery && typeof existing.mastery === "object"
        ? { ...(existing.mastery as Record<string, boolean>) }
        : {};
    mastery[itemId] = true;

    await prisma.progress.upsert({
      where: {
        userId_moduleId: {
          userId: session.user.id,
          moduleId,
        },
      },
      create: {
        userId: session.user.id,
        moduleId,
        completedItemIds: Array.from(completed),
        score: completed.size,
        mastery,
        lastSeenAt: new Date(),
      },
      update: {
        completedItemIds: Array.from(completed),
        score: completed.size,
        mastery,
        lastSeenAt: new Date(),
      },
    });
  } else {
    await prisma.progress.upsert({
      where: {
        userId_moduleId: {
          userId: session.user.id,
          moduleId,
        },
      },
      create: {
        userId: session.user.id,
        moduleId,
        completedItemIds: [],
        score: 0,
        mastery: {},
        lastSeenAt: new Date(),
      },
      update: {
        lastSeenAt: new Date(),
      },
    });
  }

  return NextResponse.json({
    exact: result.exact,
    nearMiss: result.nearMiss,
    expected: evaluated.bestModel || form.expected,
    expectedId: form.expectedId,
    explanation: item.explanation,
    correctKey: item.correctKey,
    missedTokens: evaluated.missedTokens,
    corrections: evaluated.corrections,
    headline: evaluated.headline,
  });
}
