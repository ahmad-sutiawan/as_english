import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { BUILD_SESSION_SIZE, completeBuildSession } from "@/lib/build";
import { getActivePersona } from "@/lib/persona";

const bodySchema = z.object({
  drillsDone: z.number().int().min(0).max(BUILD_SESSION_SIZE),
  wrongChecks: z.number().int().min(0).max(200),
  perfect: z.boolean(),
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

  const persona = await getActivePersona(session.user.id);
  if (!persona) {
    return NextResponse.json({ error: "Pilih persona dulu." }, { status: 409 });
  }

  const { drillsDone, wrongChecks, perfect } = parsed.data;
  const result = await completeBuildSession(session.user.id, persona, {
    drillsDone,
    perfect: perfect && wrongChecks === 0 && drillsDone > 0,
  });

  return NextResponse.json(result);
}
