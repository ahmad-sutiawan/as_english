import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getLearningStats, getReviewQueue } from "@/lib/review";
import { getActivePersona } from "@/lib/persona";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") ?? "queue";

  const persona = await getActivePersona(session.user.id);
  if (!persona) {
    return NextResponse.json({ error: "Pilih persona dulu." }, { status: 409 });
  }

  if (mode === "stats") {
    const stats = await getLearningStats(session.user.id, persona);
    return NextResponse.json(stats);
  }

  const queue = await getReviewQueue(session.user.id, 30, persona);
  return NextResponse.json({ queue });
}
