import { NextResponse } from "next/server";
import { getItGovernanceApiUser } from "@/lib/governance/guard";
import { submitGovPractice } from "@/lib/governance/store";

export async function POST(request: Request) {
  const userId = await getItGovernanceApiUser();
  if (!userId) return NextResponse.json({ error: "Akses hanya untuk persona Kerja IT." }, { status: 403 });

  const body = (await request.json().catch(() => null)) as {
    moduleId?: string;
    answers?: Record<string, string>;
  } | null;

  if (!body?.moduleId || typeof body.moduleId !== "string" || !body.answers) {
    return NextResponse.json({ error: "Data latihan tidak valid." }, { status: 400 });
  }

  const result = await submitGovPractice(userId, body.moduleId, body.answers);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
