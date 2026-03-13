"use client";

function barColor(accuracyPct: number, practiceMode: boolean): string {
  if (practiceMode) return "bg-yellow-500";
  if (accuracyPct > 80) return "bg-green-500";
  if (accuracyPct > 50) return "bg-blue-500";
  if (accuracyPct > 30) return "bg-orange-500";
  return "bg-red-500";
}

export function ScoreDisplay({
  correct,
  total,
  current,
  count,
  practiceMode,
}: {
  correct: number;
  total: number;
  current: number;
  count: number;
  practiceMode?: boolean;
}) {
  const progressPct = count > 0 ? Math.round((current / count) * 100) : 0;
  const accuracyPct = total > 0 ? Math.round((correct / total) * 100) : 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 font-medium">
          Score: {correct}/{total}
          {total >= 3 && (
            <span className="text-xs text-gray-400">({accuracyPct}%)</span>
          )}
          {practiceMode && (
            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
              Practice
            </span>
          )}
        </span>
        <span className="text-gray-500">
          {current}/{count}
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-gray-200">
        <div
          className={`h-2.5 rounded-full transition-all ${barColor(accuracyPct, !!practiceMode)}`}
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
}
