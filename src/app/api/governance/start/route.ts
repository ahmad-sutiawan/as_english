import { NextResponse } from "next/server";
import { z } from "zod";
import { getItGovernanceApiAuth } from "@/lib/governance/guard";
import { markGovModuleStarted } from "@/lib/governance/store";

const startSchema = z.object({
  moduleId: z.string().min(1).max(80),
});

export async function POST(request: Request) {
  const authResult = await getItGovernanceApiAuth();
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const raw = await request.json().catch(() => null);
  const parsed = startSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "moduleId tidak valid." }, { status: 400 });
  }

  const result = await markGovModuleStarted(authResult.userId, parsed.data.moduleId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, status: result.status });
}
