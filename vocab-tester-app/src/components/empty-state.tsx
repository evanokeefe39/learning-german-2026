"use client";

import { SearchX } from "lucide-react";

export function EmptyState({
  mistakesOnly,
  modeLabel,
}: {
  mistakesOnly: boolean;
  modeLabel: string;
}) {
  return (
    <div className="py-12 text-center">
      <SearchX className="mx-auto h-10 w-10 text-gray-300" />
      <p className="mt-3 text-gray-600">
        {mistakesOnly
          ? "No mistakes to practice!"
          : `No ${modeLabel} match these filters.`}
      </p>
      <p className="mt-1 text-sm text-gray-400">
        {mistakesOnly
          ? "You've cleared all errors."
          : "Try adjusting your filters."}
      </p>
    </div>
  );
}
