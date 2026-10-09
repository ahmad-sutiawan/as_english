import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { isPersonaId, setActivePersona } from "@/lib/persona";

const bodySchema = z.object({
  persona: z.string(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !isPersonaId(parsed.data.persona)) {
    return NextResponse.json({ error: "Persona tidak dikenal." }, { status: 400 });
  }

  await setActivePersona(session.user.id, parsed.data.persona);
  return NextResponse.json({ persona: parsed.data.persona });
}
