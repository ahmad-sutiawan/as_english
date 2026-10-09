import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getActivePersona } from "@/lib/persona";
import { getLearnerState } from "@/lib/memory";
import { PracticeSession } from "@/components/practice-session";

export default async function PracticePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const persona = await getActivePersona(session.user.id);
  if (!persona) redirect("/dashboard");
  const state = await getLearnerState(session.user.id, persona);
  if (!state.placementPassed) redirect("/placement");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs uppercase tracking-[0.22em] text-[var(--accent)]">Sesi harian</p>
      <h1 className="mt-2 font-display text-4xl text-[var(--ink)]">Putaran latihan</h1>
      <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
        Pemanasan, item jatuh tempo, satu transformasi, satu ucapan, satu soal baru, lalu transfer.
      </p>
      <div className="mt-8">
        <PracticeSession />
      </div>
    </div>
  );
}
