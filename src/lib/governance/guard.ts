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

export async function getItGovernanceApiAuth(): Promise<
  { ok: true; userId: string } | { ok: false; status: 401 | 403; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, status: 401, error: "Silakan login terlebih dahulu." };
  }
  const persona = await getActivePersona(session.user.id);
  if (persona !== "it") {
    return { ok: false, status: 403, error: "Akses hanya untuk persona Kerja IT." };
  }
  return { ok: true, userId: session.user.id };
}
