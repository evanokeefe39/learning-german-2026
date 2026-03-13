"use client";

function encouragement(pct: number): { text: string; className: string } {
  if (pct === 100) return { text: "Perfect!", className: "text-green-600" };
  if (pct >= 90) return { text: "Excellent!", className: "text-green-600" };
  if (pct >= 70) return { text: "Good job!", className: "text-blue-600" };
  if (pct >= 50) return { text: "Keep practicing!", className: "text-orange-600" };
  return { text: "Don't give up!", className: "text-gray-600" };
}

export function FinishedScreen({
  correct,
  answered,
  percentage,
  isNewBest,
  bestScore,
  onTryAgain,
}: {
  correct: number;
  answered: number;
  percentage: number;
  isNewBest: boolean;
  bestScore: number | null;
  onTryAgain: () => void;
}) {
  const msg = encouragement(percentage);

  return (
    <div className="space-y-5 text-center">
      <h2 className="text-2xl font-bold">Test Complete</h2>
      <p className="text-5xl font-bold">
        {correct}/{answered}
      </p>
      <p className="text-gray-600">{percentage}% correct</p>
      <p className={`text-lg font-semibold ${msg.className}`}>{msg.text}</p>
      {isNewBest && percentage > 0 && (
        <p className="text-lg font-semibold text-amber-500">New high score!</p>
      )}
      {bestScore !== null && !isNewBest && (
        <p className="text-sm text-gray-500">Best: {bestScore}%</p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          onClick={onTryAgain}
          className="w-full rounded-xl bg-blue-600 py-3 text-lg font-medium text-white active:bg-blue-700 sm:w-auto sm:px-8"
        >
          Try Again
        </button>
        <a
          href="/"
          className="w-full rounded-xl border-2 border-blue-600 py-3 text-center text-lg font-medium text-blue-600 active:bg-blue-50 sm:w-auto sm:px-8"
        >
          Home
        </a>
      </div>
    </div>
  );
}

export function MistakesFinishedScreen({
  onBackToTest,
}: {
  onBackToTest: () => void;
}) {
  return (
    <div className="space-y-6 text-center">
      <h2 className="text-2xl font-bold text-green-600">All Cleared!</h2>
      <p className="text-lg text-gray-600">No more mistakes to practice!</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          onClick={onBackToTest}
          className="w-full rounded-xl bg-blue-600 py-3 text-lg font-medium text-white active:bg-blue-700 sm:w-auto sm:px-8"
        >
          Back to Test
        </button>
        <a
          href="/"
          className="w-full rounded-xl border-2 border-blue-600 py-3 text-center text-lg font-medium text-blue-600 active:bg-blue-50 sm:w-auto sm:px-8"
        >
          Home
        </a>
      </div>
    </div>
  );
}
