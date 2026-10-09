import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getBuildDrill, stepFor, tokensMatch } from "@/lib/build";
import { getActivePersona } from "@/lib/persona";

const bodySchema = z.object({
  drillId: z.string().min(1),
  step: z.enum(["assemble", "transform"]),
  tokens: z.array(z.string()).max(24),
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

  const { drillId, step, tokens } = parsed.data;
  const drill = getBuildDrill(drillId, persona);
  if (!drill) {
    return NextResponse.json({ error: "Drill not found" }, { status: 404 });
  }

  const expected = stepFor(drill, step);
  const correct = tokensMatch(tokens, expected.tokens);

  return NextResponse.json({
    correct,
    sentence: expected.sentence,
    sentenceId: expected.sentenceId,
    why: expected.why,
    pattern: expected.pattern,
    slots: expected.slots,
  });
}
