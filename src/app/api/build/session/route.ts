import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { BUILD_SESSION_SIZE, buildSession, isBuildTheme } from "@/lib/build";
import { getActivePersona } from "@/lib/persona";

const bodySchema = z.object({
  theme: z.string().optional().default("all"),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const persona = await getActivePersona(session.user.id);
  if (!persona) {
    return NextResponse.json({ error: "Pilih persona dulu." }, { status: 409 });
  }

  let theme = "all";
  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success || !isBuildTheme(parsed.data.theme, persona)) {
      return NextResponse.json({ error: "Tema tidak dikenal." }, { status: 404 });
    }
    theme = parsed.data.theme;
  } catch {
    // empty body uses every theme
  }

  const items = buildSession(persona, theme);
  if (items.length === 0) {
    return NextResponse.json({ error: "Tidak ada latihan untuk tema ini." }, { status: 404 });
  }

  return NextResponse.json({
    items,
    theme,
    sessionSize: Math.min(BUILD_SESSION_SIZE, items.length),
  });
}
