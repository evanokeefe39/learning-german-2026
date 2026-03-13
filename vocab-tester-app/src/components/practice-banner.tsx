"use client";

export function PracticeBanner({
  count,
  onExit,
}: {
  count: number;
  onExit: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm text-yellow-800">
      <span>
        Practicing {count} mistake{count !== 1 ? "s" : ""}. Main test paused.
      </span>
      <button
        onClick={onExit}
        className="font-medium text-yellow-700 underline underline-offset-2"
      >
        Exit
      </button>
    </div>
  );
}
