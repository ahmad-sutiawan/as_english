import { NextResponse } from "next/server";
import { getItGovernanceApiUser } from "@/lib/governance/guard";
import { markGovModuleStarted } from "@/lib/governance/store";

export async function POST(request: Request) {
  const userId = await getItGovernanceApiUser();
  if (!userId) return NextResponse.json({ error: "Akses hanya untuk persona Kerja IT." }, { status: 403 });

  const body = (await request.json().catch(() => null)) as { moduleId?: string } | null;
  if (!body?.moduleId || typeof body.moduleId !== "string") {
    return NextResponse.json({ error: "moduleId wajib diisi." }, { status: 400 });
  }

  const result = await markGovModuleStarted(userId, body.moduleId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, status: result.status });
}
