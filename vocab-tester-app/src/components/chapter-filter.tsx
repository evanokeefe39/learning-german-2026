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
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500">Chapter</label>
      <select
        className="rounded-lg border bg-white px-3 py-2.5 text-base sm:text-sm"
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value ? Number(e.target.value) : undefined)
        }
      >
        <option value="">All</option>
        {chapters.map((ch) => (
          <option key={ch} value={ch}>
            Chapter {ch}
          </option>
        ))}
      </select>
    </div>
  );
}
