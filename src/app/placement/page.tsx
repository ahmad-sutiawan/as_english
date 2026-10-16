import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPlacementDrills } from "@/lib/build";
import { getActivePersona } from "@/lib/persona";
import { PlacementSession } from "@/components/placement-session";

export default async function PlacementPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const persona = await getActivePersona(session.user.id);
  if (!persona) redirect("/dashboard");

  const total = getPlacementDrills(persona).length;
  const need = Math.min(10, total);
  const lede =
    persona === "it"
      ? `${need} dari ${total} urutan yang benar membuka tema percakapan. Di bawah itu, latihan tetap di tema Dasar.`
      : persona === "parent"
        ? `${need} dari ${total} urutan yang benar membuka Latihan di dunia Rumah. Susun Parent sudah terbuka.`
        : `${need} dari ${total} urutan yang benar membuka Latihan. Tema Susun sudah terbuka.`;
  const passedDetail =
    persona === "it" ? "Tema percakapan terbuka." : "Latihan terbuka.";
  const failedDetail =
    persona === "it"
      ? "Ulangi penempatan; tema percakapan tetap tertutup."
      : "Ulangi penempatan; Latihan tetap tertutup.";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs uppercase tracking-[0.22em] text-[var(--accent)]">Penempatan</p>
      <h1 className="mt-2 font-display text-4xl text-[var(--ink)]">Kalimat dasar</h1>
      <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{lede}</p>
      <div className="mt-8">
        <PlacementSession passedDetail={passedDetail} failedDetail={failedDetail} />
      </div>
    </div>
  );
}
