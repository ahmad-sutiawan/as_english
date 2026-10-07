"use client";

type Props = {
  english: string;
  indonesian: string;
  structure?: string;
  structureId?: string;
  speakSlot?: React.ReactNode;
  englishClassName?: string;
};

/** English primary text + fixed Indonesian meaning + optional structure formula */
export function BilingualText({
  english,
  indonesian,
  structure,
  structureId,
  speakSlot,
  englishClassName = "text-base leading-relaxed text-[var(--ink)]",
}: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <p className={`min-w-0 flex-1 ${englishClassName}`}>{english}</p>
        {speakSlot ? <div className="shrink-0 pt-0.5">{speakSlot}</div> : null}
      </div>
      <p className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm leading-relaxed text-[var(--muted)]">
        <span className="mr-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent)]">
          Arti
        </span>
        {indonesian}
      </p>
      {structure ? (
        <p className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs leading-relaxed text-[var(--muted)]">
          <span className="mr-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent)]">
            Struktur
          </span>
          <span className="font-mono text-[var(--ink)]">{structure}</span>
          {structureId ? (
            <span className="mt-1 block text-[var(--muted)]">{structureId}</span>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}

/** Compact structure row for choice lists that use custom EN markup */
export function StructureNote({
  structure,
  structureId,
}: {
  structure: string;
  structureId: string;
}) {
  return (
    <p className="mt-2 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs leading-relaxed text-[var(--muted)]">
      <span className="mr-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent)]">
        Struktur
      </span>
      <span className="font-mono text-[var(--ink)]">{structure}</span>
      <span className="mt-1 block text-[var(--muted)]">{structureId}</span>
    </p>
  );
}
