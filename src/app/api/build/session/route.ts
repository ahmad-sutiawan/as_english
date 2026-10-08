import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { BUILD_SESSION_SIZE, buildSession } from "@/lib/build";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = buildSession();
  if (items.length === 0) {
    return NextResponse.json({ error: "Tidak ada latihan susun." }, { status: 404 });
  }

  return NextResponse.json({
    items,
    sessionSize: Math.min(BUILD_SESSION_SIZE, items.length),
  });
}
