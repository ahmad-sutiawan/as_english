import { NextResponse } from "next/server";
import { z } from "zod";
import { getItGovernanceApiAuth } from "@/lib/governance/guard";
import { submitGovMastery } from "@/lib/governance/store";

const checkSchema = z.object({
  moduleId: z.string().min(1).max(80),
  answers: z
    .record(z.string().max(64), z.string().max(4000))
    .refine((obj) => Object.keys(obj).length <= 60, "Terlalu banyak jawaban."),
});

export async function POST(request: Request) {
  const authResult = await getItGovernanceApiAuth();
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const raw = await request.json().catch(() => null);
  const parsed = checkSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data mastery check tidak valid." }, { status: 400 });
  }

  const result = await submitGovMastery(
    authResult.userId,
    parsed.data.moduleId,
    parsed.data.answers,
  );
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
