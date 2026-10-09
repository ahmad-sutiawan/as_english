import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getActivePersona } from "@/lib/persona";
import { markPlacementPassed } from "@/lib/memory";
import { getBuildDrills } from "@/lib/build";
import { evaluateForm } from "@/lib/form-eval";
import type { PersonaId } from "@/lib/persona";
import type { BuildDrill } from "@/types/build";

const checkSchema = z.object({
  id: z.string().min(1),
  typed: z.string().min(1),
});

const finishSchema = z.object({
  answers: z
    .array(z.object({ id: z.string().min(1), typed: z.string() }))
    .max(12),
});

function placementDrills(persona: PersonaId): BuildDrill[] {
  return getBuildDrills(persona)
    .filter((drill) => drill.theme === "dasar")
    .slice(0, 12);
}

function scoreDrill(drill: BuildDrill, typed: string) {
  const models = drill.modelAnswers?.length
    ? drill.modelAnswers
    : [drill.assemble.sentence];
  return evaluateForm({
    transcript: typed,
    models,
    chunks: [],
    slots: drill.slots ?? [],
    commonErrors: drill.commonErrors ?? [],
  });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const persona = await getActivePersona(session.user.id);
  if (!persona) {
    return NextResponse.json({ error: "Pilih persona dulu." }, { status: 409 });
  }
  const drills = placementDrills(persona).map((drill) => ({
    id: drill.id,
    meaningId: drill.meaningId,
  }));
  return NextResponse.json({ drills });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const persona = await getActivePersona(session.user.id);
  if (!persona) {
    return NextResponse.json({ error: "Pilih persona dulu." }, { status: 409 });
  }

  const body = await request.json();
  const drills = placementDrills(persona);
  const byId = new Map(drills.map((drill) => [drill.id, drill]));

  const check = checkSchema.safeParse(body);
  if (check.success && !("answers" in body)) {
    const drill = byId.get(check.data.id);
    if (!drill) {
      return NextResponse.json({ error: "Kalimat tidak ada." }, { status: 404 });
    }
    const result = scoreDrill(drill, check.data.typed);
    return NextResponse.json({
      passed: result.passed,
      exact: result.exact,
      headline: result.headline,
      corrections: result.corrections,
      missedTokens: result.missedTokens,
      bestModel: result.passed ? result.bestModel : undefined,
    });
  }

  const finish = finishSchema.safeParse(body);
  if (!finish.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  let correct = 0;
  for (const answer of finish.data.answers) {
    const drill = byId.get(answer.id);
    if (!drill) continue;
    if (scoreDrill(drill, answer.typed).passed) correct += 1;
  }
  const passed = correct >= 10 && finish.data.answers.length >= 10;
  if (passed) await markPlacementPassed(session.user.id, persona);
  return NextResponse.json({ passed, correct });
}
