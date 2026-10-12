import { redirect } from "next/navigation";
import { GrammarReference } from "@/components/grammar-reference";
import { LobbyFrame } from "@/components/lobby-frame";
import { auth } from "@/lib/auth";
import { getGrammarBook } from "@/lib/grammar";
import { getActivePersona } from "@/lib/persona";

export default async function GrammarPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const persona = await getActivePersona(session.user.id);
  if (!persona) redirect("/dashboard");

  const book = getGrammarBook();

  return (
    <LobbyFrame
      kicker="Referensi"
      title="Hukum grammar"
      lede="Kalau susunan kalimat macet, tentukan maksud dan waktu, lalu salin rumusnya. Halaman ini tidak dinilai dan tidak mengubah progres."
    >
      <GrammarReference book={book} />
    </LobbyFrame>
  );
}
