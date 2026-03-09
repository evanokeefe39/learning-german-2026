"use client";

import { getCategories } from "@/lib/data";

export function CategoryFilter({
  value,
  chapter,
  onChange,
}: {
  value: string | undefined;
  chapter: number | undefined;
  onChange: (cat: string | undefined) => void;
}) {
  const categories = getCategories(chapter);

  return (
    <select
      className="rounded-lg border bg-white px-3 py-2.5 text-base sm:text-sm"
      value={value ?? ""}
      onChange={(e) =>
        onChange(e.target.value ? e.target.value : undefined)
      }
    >
      <option value="">All categories</option>
      {categories.map((cat) => (
        <option key={cat} value={cat}>
          {cat}
        </option>
      ))}
    </select>
  );
}
