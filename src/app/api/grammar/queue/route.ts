import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { grammarChartItemId, grammarLawItemId, grammarPrompt } from "@/lib/grammar";
import { queueGrammarItem } from "@/lib/memory";
import { getActivePersona } from "@/lib/persona";

const bodySchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("law"), lawId: z.string().min(1) }),
  z.object({
    kind: z.literal("chart"),
    chartId: z.string().min(1),
    tableIndex: z.number().int().nonnegative(),
    rowIndex: z.number().int().nonnegative(),
  }),
]);

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

  const itemId =
    parsed.data.kind === "law"
      ? grammarLawItemId(parsed.data.lawId)
      : grammarChartItemId(parsed.data.chartId, parsed.data.tableIndex, parsed.data.rowIndex);
  const prompt = grammarPrompt(itemId);
  if (!prompt || prompt.models.length === 0) {
    return NextResponse.json({ error: "Kalimat tidak ditemukan." }, { status: 404 });
  }

  await queueGrammarItem({
    userId: session.user.id,
    persona,
    itemId,
  });

  return NextResponse.json({ queued: true, label: prompt.label });
}
