import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getActivePersona } from "@/lib/persona";

export async function requireItGovernanceLearner(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const persona = await getActivePersona(session.user.id);
  if (persona !== "it") redirect("/dashboard");
  return session.user.id;
}

export async function getItGovernanceApiUser(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const persona = await getActivePersona(session.user.id);
  if (persona !== "it") return null;
  return session.user.id;
}
