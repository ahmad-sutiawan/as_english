import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { pickSpeakSessionItem } from "@/lib/speak";

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
    if (parsed.success) level = parsed.data.level;
  } catch {
    // empty ok
  }

  const item = await pickSpeakSessionItem(session.user.id, level);
  if (!item) {
    return NextResponse.json({ error: "Tidak ada item speak." }, { status: 404 });
  }

  // Client gets full item for offline phases; target shown only after unlock
  return NextResponse.json({ item });
}
