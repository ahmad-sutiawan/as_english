import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const progress = await prisma.progress.findMany({
    where: { userId: session.user.id },
    orderBy: { lastSeenAt: "desc" },
  });

  return NextResponse.json({ progress });
}
