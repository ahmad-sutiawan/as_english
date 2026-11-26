import { NextResponse } from "next/server";
import { getItGovernanceApiUser } from "@/lib/governance/guard";
import { submitGovExam } from "@/lib/governance/store";

export async function POST(request: Request) {
  const userId = await getItGovernanceApiUser();
  if (!userId) return NextResponse.json({ error: "Akses hanya untuk persona Kerja IT." }, { status: 403 });

  const body = (await request.json().catch(() => null)) as {
    answers?: Record<string, string>;
  } | null;

  if (!body?.answers) {
    return NextResponse.json({ error: "Jawaban ujian tidak valid." }, { status: 400 });
  }

  const result = await submitGovExam(userId, body.answers);
  return NextResponse.json(result);
}
