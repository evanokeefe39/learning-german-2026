"use client";

import { getChapters } from "@/lib/data";

export function ChapterFilter({
  value,
  onChange,
}: {
  value: number | undefined;
  onChange: (ch: number | undefined) => void;
}) {
  const chapters = getChapters();

  return (
    <select
      className="rounded border bg-white px-3 py-2 text-sm"
      value={value ?? ""}
      onChange={(e) =>
        onChange(e.target.value ? Number(e.target.value) : undefined)
      }
    >
      <option value="">All chapters</option>
      {chapters.map((ch) => (
        <option key={ch} value={ch}>
          Chapter {ch}
        </option>
      ))}
    </select>
  );
}
