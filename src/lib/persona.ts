import { prisma } from "@/lib/db";

export const PERSONA_IDS = ["it", "home"] as const;
export type PersonaId = (typeof PERSONA_IDS)[number];

export const PERSONA_LABEL: Record<PersonaId, string> = {
  it: "Kerja IT",
  home: "Rumah",
};

export function isPersonaId(value: string | null | undefined): value is PersonaId {
  return value === "it" || value === "home";
}

export async function getActivePersona(userId: string): Promise<PersonaId | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { activePersona: true },
  });
  return isPersonaId(user?.activePersona) ? user.activePersona : null;
}

export async function setActivePersona(userId: string, persona: PersonaId) {
  await prisma.user.update({
    where: { id: userId },
    data: { activePersona: persona },
  });
}
