import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getLearningStats, getReviewQueue } from "@/lib/review";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") ?? "queue";

  if (mode === "stats") {
    const stats = await getLearningStats(session.user.id);
    return NextResponse.json(stats);
  }

  const queue = await getReviewQueue(session.user.id, 30);
  return NextResponse.json({ queue });
}
