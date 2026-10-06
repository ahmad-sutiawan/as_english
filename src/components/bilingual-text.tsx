"use client";

type Props = {
  english: string;
  indonesian: string;
  speakSlot?: React.ReactNode;
  englishClassName?: string;
};

/** English primary text + fixed Indonesian meaning underneath */
export function BilingualText({
  english,
  indonesian,
  speakSlot,
  englishClassName = "text-base leading-relaxed text-[var(--ink)]",
}: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <p className={englishClassName}>{english}</p>
        {speakSlot}
      </div>
      <p className="rounded-md bg-[var(--surface-2)]/70 px-3 py-2 text-sm leading-relaxed text-[var(--muted)]">
        <span className="mr-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent)]">
          Arti
        </span>
        {indonesian}
      </p>
    </div>
  );
}
