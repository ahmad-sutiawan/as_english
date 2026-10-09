"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PERSONA_LABEL, type PersonaId } from "@/lib/persona";

type Props = {
  persona: PersonaId;
  layout?: "bar" | "menu";
  onChanged?: () => void;
};

export function PersonaSwitch({ persona, layout = "bar", onChanged }: Props) {
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
    onChanged?.();
    router.push("/dashboard");
    router.refresh();
  }

  if (layout === "menu") {
    return (
      <div>
        <p className="px-3 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Dunia latihan</p>
        <div className="mt-2 grid grid-cols-2 gap-2" role="group" aria-label="Dunia latihan">
          {(Object.keys(PERSONA_LABEL) as PersonaId[]).map((id) => {
            const active = id === persona;
            return (
              <button
                key={id}
                type="button"
                disabled={pending}
                aria-pressed={active}
                onClick={() => change(id)}
                className={`h-11 rounded-xl border text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:opacity-60 ${
                  active
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] font-medium text-[var(--ink)]"
                    : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]"
                }`}
              >
                {PERSONA_LABEL[id]}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      className="inline-flex h-10 items-center rounded-full border border-[var(--border)] bg-[var(--surface-2)] p-1"
      role="group"
      aria-label="Dunia latihan"
    >
      {(Object.keys(PERSONA_LABEL) as PersonaId[]).map((id) => {
        const active = id === persona;
        return (
          <button
            key={id}
            type="button"
            disabled={pending}
            aria-pressed={active}
            onClick={() => change(id)}
            className={`inline-flex h-8 items-center rounded-full px-3 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:opacity-60 ${
              active
                ? "bg-[var(--accent)] font-medium text-[#06221e]"
                : "text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
          >
            {PERSONA_LABEL[id]}
          </button>
        );
      })}
    </div>
  );
}
