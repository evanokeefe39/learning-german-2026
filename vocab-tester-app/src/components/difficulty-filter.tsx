"use client";

import { Difficulty } from "@/lib/data";

const OPTIONS: { value: Difficulty; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

export function DifficultyFilter({
  value,
  onChange,
}: {
  value: Difficulty | undefined;
  onChange: (d: Difficulty | undefined) => void;
}) {
  return (
    <select
      className="rounded-lg border bg-white px-3 py-2.5 text-base sm:text-sm"
      value={value ?? ""}
      onChange={(e) =>
        onChange(e.target.value ? (e.target.value as Difficulty) : undefined)
      }
    >
      <option value="">All levels</option>
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
