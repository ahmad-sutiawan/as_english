import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getItem } from "@/lib/content";
import { getActivePersona } from "@/lib/persona";

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

  await prisma.attempt.create({
    data: {
      userId: session.user.id,
      moduleId,
      itemId,
      typedAnswer: chosen.text,
      correct,
    },
  });

  if (correct) {
    const existing = await prisma.progress.findUnique({
      where: {
        userId_moduleId: { userId: session.user.id, moduleId },
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
        userId_moduleId: { userId: session.user.id, moduleId },
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
        userId_moduleId: { userId: session.user.id, moduleId },
      },
      create: {
        userId: session.user.id,
        moduleId,
        completedItemIds: [],
        score: 0,
        mastery: {},
        lastSeenAt: new Date(),
      },
      update: { lastSeenAt: new Date() },
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
