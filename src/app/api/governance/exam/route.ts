import { NextResponse } from "next/server";
import { z } from "zod";
import { getItGovernanceApiAuth } from "@/lib/governance/guard";
import { submitGovExam } from "@/lib/governance/store";

const examSchema = z.object({
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
  const parsed = examSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Jawaban ujian tidak valid." }, { status: 400 });
  }

  const result = await submitGovExam(authResult.userId, parsed.data.answers);
  return NextResponse.json(result);
}
