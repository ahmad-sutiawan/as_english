import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { buildQuickSession, QUICK_HEARTS, QUICK_SESSION_SIZE } from "@/lib/quick";

const bodySchema = z.object({
  level: z.enum(["all", "junior", "mid", "senior"]).optional().default("all"),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let level: "all" | "junior" | "mid" | "senior" = "all";
  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    level = parsed.data.level;
  } catch {
    // empty body ok
  }

  const items = await buildQuickSession(session.user.id, level);
  if (items.length === 0) {
    return NextResponse.json(
      { error: "Tidak ada soal untuk level ini." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    items,
    hearts: QUICK_HEARTS,
    sessionSize: QUICK_SESSION_SIZE,
  });
}
