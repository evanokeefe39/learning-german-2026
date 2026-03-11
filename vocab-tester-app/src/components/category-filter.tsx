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
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500">Category</label>
      <select
        className="rounded-lg border bg-white px-3 py-2.5 text-base sm:text-sm"
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value ? e.target.value : undefined)
        }
      >
        <option value="">All</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
    </div>
  );
}
