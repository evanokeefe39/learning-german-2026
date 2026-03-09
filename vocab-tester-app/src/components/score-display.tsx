"use client";

export function ScoreDisplay({
  correct,
  total,
  current,
  count,
}: {
  correct: number;
  total: number;
  current: number;
  count: number;
}) {
  const pct = count > 0 ? Math.round((current / count) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          Score: {correct}/{total}
        </span>
        <span className="text-gray-500">
          {current}/{count}
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-gray-200">
        <div
          className="h-2.5 rounded-full bg-blue-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
