import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCorrectAnswerText, getItem } from "@/lib/content";
import { getActivePersona } from "@/lib/persona";
import { scoreAnswer } from "@/lib/answer";

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

  const expected = getCorrectAnswerText(item);
  const expectedId =
    item.choices.find((c) => c.key === item.correctKey)?.textId ?? "";
  const result = scoreAnswer(typedAnswer, expected);

  await prisma.attempt.create({
    data: {
      userId: session.user.id,
      moduleId,
      itemId,
      typedAnswer,
      correct: result.exact,
    },
  });

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
    expected,
    expectedId,
    explanation: item.explanation,
    correctKey: item.correctKey,
  });
}
