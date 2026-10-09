import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getActivePersona } from "@/lib/persona";
import { markPlacementPassed } from "@/lib/memory";
import { getBuildDrills } from "@/lib/build";

const bodySchema = z.object({
  correct: z.number().int().min(0).max(12),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const persona = await getActivePersona(session.user.id);
  if (!persona) {
    return NextResponse.json({ error: "Pilih persona dulu." }, { status: 409 });
  }
  const drills = getBuildDrills(persona)
    .filter((drill) => drill.theme === "dasar")
    .slice(0, 12)
    .map((drill) => ({
      id: drill.id,
      meaningId: drill.meaningId,
      tokens: drill.assemble.tokens,
      distractors: drill.assemble.distractors,
    }));
  return NextResponse.json({ drills });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const persona = await getActivePersona(session.user.id);
  if (!persona) {
    return NextResponse.json({ error: "Pilih persona dulu." }, { status: 409 });
  }
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const passed = parsed.data.correct >= 10;
  if (passed) await markPlacementPassed(session.user.id, persona);
  return NextResponse.json({ passed, correct: parsed.data.correct });
}
