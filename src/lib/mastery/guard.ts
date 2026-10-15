import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getActivePersona } from "@/lib/persona";

export async function requireLearnerId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const persona = await getActivePersona(session.user.id);
  if (!persona) redirect("/dashboard");
  return session.user.id;
}
