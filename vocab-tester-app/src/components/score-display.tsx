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
    <div className="flex items-center gap-4 text-sm">
      <span className="font-medium">
        Score: {correct}/{total}
      </span>
      <div className="flex flex-1 items-center gap-2">
        <div className="h-2 flex-1 rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-blue-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-gray-500">
          {current}/{count}
        </span>
      </div>
    </div>
  );
}
