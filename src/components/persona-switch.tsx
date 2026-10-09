"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PERSONA_LABEL, type PersonaId } from "@/lib/persona";

type Props = {
  persona: PersonaId;
};

export function PersonaSwitch({ persona }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function change(next: PersonaId) {
    if (next === persona || pending) return;
    setPending(true);
    const response = await fetch("/api/persona", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ persona: next }),
    });
    setPending(false);
    if (!response.ok) return;
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <label className="inline-flex items-center gap-2 text-sm text-[var(--muted)]">
      <span className="sr-only">Dunia latihan</span>
      <select
        value={persona}
        disabled={pending}
        onChange={(event) => change(event.target.value as PersonaId)}
        className="h-10 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)]"
        aria-label="Dunia latihan"
      >
        {(Object.keys(PERSONA_LABEL) as PersonaId[]).map((id) => (
          <option key={id} value={id}>
            {PERSONA_LABEL[id]}
          </option>
        ))}
      </select>
    </label>
  );
}
