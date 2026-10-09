"use client";

export function themeMatches(
  query: string,
  fields: Array<string | number | null | undefined>,
): boolean {
  const needle = query.trim().toLocaleLowerCase("id");
  if (!needle) return true;
  return fields.some((field) =>
    String(field ?? "")
      .toLocaleLowerCase("id")
      .includes(needle),
  );
}

export function ThemeSearch({
  value,
  onChange,
  shown,
  total,
}: {
  value: string;
  onChange: (value: string) => void;
  shown: number;
  total: number;
}) {
  const filtering = value.trim().length > 0;
  return (
    <label className="mt-4 block">
      <span className="text-xs font-medium text-[var(--muted)]">Cari tema</span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Ketik nama atau deskripsi tema"
        className="mt-1 block w-full rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--ink)] outline-none ring-[var(--accent)] placeholder:text-[var(--muted)] focus:ring-2"
      />
      {filtering ? (
        <span className="mt-2 block text-xs text-[var(--muted)]">
          {shown} dari {total} tema
        </span>
      ) : null}
    </label>
  );
}
