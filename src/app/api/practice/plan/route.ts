import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getActivePersona } from "@/lib/persona";
import { buildPracticePlan } from "@/lib/practice";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const persona = await getActivePersona(session.user.id);
  if (!persona) {
    return NextResponse.json({ error: "Pilih persona dulu." }, { status: 409 });
  }
  const plan = await buildPracticePlan(session.user.id, persona);
  return NextResponse.json(plan);
}
