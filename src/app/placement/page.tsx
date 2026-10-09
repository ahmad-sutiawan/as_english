import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getActivePersona } from "@/lib/persona";
import { PlacementSession } from "@/components/placement-session";

export default async function PlacementPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const persona = await getActivePersona(session.user.id);
  if (!persona) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs uppercase tracking-[0.22em] text-[var(--accent)]">Penempatan</p>
      <h1 className="mt-2 font-display text-4xl text-[var(--ink)]">Dua belas kalimat dasar</h1>
      <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
        Sepuluh dari dua belas urutan yang benar membuka tema percakapan. Di bawah itu, latihan tetap di tema Dasar.
      </p>
      <div className="mt-8">
        <PlacementSession />
      </div>
    </div>
  );
}
