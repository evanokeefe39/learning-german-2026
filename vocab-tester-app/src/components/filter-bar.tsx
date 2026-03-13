"use client";

import { useState } from "react";
import { SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";

interface Toggle {
  key: string;
  label: string;
  count?: number;
  checked: boolean;
  onChange: (checked: boolean) => void;
  variant?: "default" | "warning";
}

export function FilterBar({
  dropdowns,
  toggles,
}: {
  dropdowns?: React.ReactNode;
  toggles: Toggle[];
}) {
  const [expanded, setExpanded] = useState(true);

  const activeCount =
    toggles.filter((t) => t.checked).length;

  return (
    <div className="space-y-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-600 active:bg-gray-100 sm:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
        {activeCount > 0 && (
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
            {activeCount}
          </span>
        )}
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
        )}
      </button>

      <div className={`space-y-3 ${expanded ? "" : "hidden sm:block"}`}>
        {dropdowns && (
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
            {dropdowns}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {toggles.map((t) => {
            const isWarning = t.variant === "warning" && t.checked;
            return (
              <button
                key={t.key}
                onClick={() => t.onChange(!t.checked)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  t.checked
                    ? isWarning
                      ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                      : "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 bg-white text-gray-600 active:bg-gray-50"
                }`}
              >
                {t.label}
                {t.count !== undefined && t.count > 0 && ` (${t.count})`}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
