import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  BUILD_SESSION_SIZE,
  BUILD_THEMES,
  buildSession,
  type BuildThemeId,
} from "@/lib/build";

const themeIds = BUILD_THEMES.map((theme) => theme.id) as [
  BuildThemeId,
  ...BuildThemeId[],
];

const bodySchema = z.object({
  theme: z.enum(themeIds).optional().default("all"),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let theme: BuildThemeId = "all";
  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Tema tidak dikenal." }, { status: 404 });
    }
    theme = parsed.data.theme;
  } catch {
    // empty body uses every theme
  }

  const items = buildSession(theme);
  if (items.length === 0) {
    return NextResponse.json({ error: "Tidak ada latihan untuk tema ini." }, { status: 404 });
  }

  return NextResponse.json({
    items,
    theme,
    sessionSize: Math.min(BUILD_SESSION_SIZE, items.length),
  });
}
