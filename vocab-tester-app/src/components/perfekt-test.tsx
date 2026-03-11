"use client";

import { useState, useCallback, useEffect, useRef, FormEvent } from "react";
import {
  Difficulty,
  VerbWithPerfekt,
  getVerbsWithPerfekt,
  shuffle,
} from "@/lib/data";
import { ChapterFilter } from "./chapter-filter";
import { DifficultyFilter } from "./difficulty-filter";
import { ScoreDisplay } from "./score-display";
import {
  addWrongWord,
  removeWrongWord,
  getWrongWords,
  getWrongWordCount,
  buildConfigKey,
  getHighScore,
  saveHighScore,
  saveAttempt,
} from "@/lib/storage";

export function PerfektTest() {
  const [chapter, setChapter] = useState<number | undefined>(undefined);
  const [difficulty, setDifficulty] = useState<Difficulty | undefined>(
    undefined
  );
  const [exceptionsOnly, setExceptionsOnly] = useState(false);
  const [mistakesOnly, setMistakesOnly] = useState(false);
  const [items, setItems] = useState<VerbWithPerfekt[]>(() =>
    shuffle(getVerbsWithPerfekt())
  );
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [auxInput, setAuxInput] = useState("");
  const [partInput, setPartInput] = useState("");
  const [result, setResult] = useState<{
    auxCorrect: boolean;
    partCorrect: boolean;
  } | null>(null);
  const [finished, setFinished] = useState(false);
  const [wrongCount, setWrongCount] = useState(0);
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    setWrongCount(getWrongWordCount("perfekt"));
  }, []);

  const stateRef = useRef({ correct, answered, finished, mistakesOnly, chapter, exceptionsOnly, difficulty });
  useEffect(() => {
    stateRef.current = { correct, answered, finished, mistakesOnly, chapter, exceptionsOnly, difficulty };
  });
  const savedRef = useRef(false);
  const pausedProgress = useRef<{ correct: number; answered: number } | null>(null);
  const saveOnLeave = useCallback(() => {
    if (savedRef.current) return;
    const s = stateRef.current;
    const progress = s.mistakesOnly ? pausedProgress.current : (s.answered > 0 && !s.finished ? { correct: s.correct, answered: s.answered } : null);
    if (!progress) return;
    savedRef.current = true;
    const pct = Math.round((progress.correct / progress.answered) * 100);
    saveHighScore(buildConfigKey("perfekt", s.chapter, undefined, s.difficulty), pct);
    saveAttempt({
      mode: "perfekt",
      chapter: s.chapter ?? null,
      category: s.exceptionsOnly ? "exceptions" : null,
      difficulty: s.difficulty ?? null,
      correct: progress.correct,
      total: progress.answered,
      percentage: pct,
      timestamp: Date.now(),
    });
  }, []);
  useEffect(() => {
    window.addEventListener("pagehide", saveOnLeave);
    return () => {
      window.removeEventListener("pagehide", saveOnLeave);
      saveOnLeave();
    };
  }, [saveOnLeave]);

  const filterItems = useCallback(
    (
      ch?: number,
      excOnly?: boolean,
      diff?: Difficulty,
      mistakes?: boolean
    ) => {
      let filtered = getVerbsWithPerfekt(ch, diff);
      if (excOnly) {
        filtered = filtered.filter(
          (v) => v.perfekt.perfektType !== "regular"
        );
      }
      if (mistakes) {
        const wrong = new Set(getWrongWords("perfekt"));
        filtered = filtered.filter((v) => wrong.has(v.infinitive));
      }
      return shuffle(filtered);
    },
    []
  );

  const restart = useCallback(
    (
      ch?: number,
      excOnly?: boolean,
      diff?: Difficulty,
      mistakes?: boolean
    ) => {
      const m = mistakes ?? mistakesOnly;
      if (m && !mistakesOnly && answered > 0 && !finished) {
        pausedProgress.current = { correct, answered };
      } else if (!m) {
        pausedProgress.current = null;
        savedRef.current = false;
      }
      setChapter(ch);
      setDifficulty(diff);
      setExceptionsOnly(excOnly ?? exceptionsOnly);
      setMistakesOnly(m);
      setItems(
        filterItems(ch, excOnly ?? exceptionsOnly, diff ?? difficulty, m)
      );
      setIndex(0);
      setCorrect(0);
      setAnswered(0);
      setAuxInput("");
      setPartInput("");
      setResult(null);
      setFinished(false);
      setWrongCount(getWrongWordCount("perfekt"));
    },
    [filterItems, exceptionsOnly, difficulty, mistakesOnly, answered, correct, finished]
  );

  const current = items[index];

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (result) return;

    const auxCorrect =
      auxInput.toLowerCase().trim() === current.perfekt.auxiliary;
    const partCorrect =
      partInput.toLowerCase().trim() ===
      current.perfekt.partizipII.toLowerCase();

    setResult({ auxCorrect, partCorrect });
    setAnswered((a) => a + 1);

    if (auxCorrect && partCorrect) {
      setCorrect((c) => c + 1);
      removeWrongWord("perfekt", current.infinitive);
    } else {
      addWrongWord("perfekt", current.infinitive);
    }
    setWrongCount(getWrongWordCount("perfekt"));
  };

  const next = () => {
    if (index + 1 >= items.length) {
      if (mistakesOnly) {
        const refreshed = filterItems(
          chapter,
          exceptionsOnly,
          difficulty,
          true
        );
        if (refreshed.length > 0) {
          setItems(refreshed);
          setIndex(0);
          setAuxInput("");
          setPartInput("");
          setResult(null);
          setWrongCount(refreshed.length);
          return;
        }
      }
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
      setAuxInput("");
      setPartInput("");
      setResult(null);
    }
  };

  const configKey = buildConfigKey("perfekt", chapter, undefined, difficulty);

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <ChapterFilter
            value={chapter}
            onChange={(ch) => restart(ch, exceptionsOnly, difficulty)}
          />
          <DifficultyFilter
            value={difficulty}
            onChange={(d) => restart(chapter, exceptionsOnly, d)}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={mistakesOnly}
              onChange={(e) =>
                restart(chapter, exceptionsOnly, difficulty, e.target.checked)
              }
              className="h-4 w-4"
            />
            Practice mistakes{wrongCount > 0 ? ` (${wrongCount})` : ""}
          </label>
        </div>
        <p>
          {mistakesOnly
            ? "No mistakes to practice!"
            : "No verbs found for this filter."}
        </p>
      </div>
    );
  }

  if (finished) {
    const pct = answered > 0 ? Math.round((correct / answered) * 100) : 0;

    if (mistakesOnly) {
      return (
        <div className="space-y-6 text-center">
          <h2 className="text-2xl font-bold text-green-600">All Done</h2>
          <p className="text-lg text-gray-600">No more mistakes to practice!</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => restart(chapter, exceptionsOnly, difficulty, false)}
              className="w-full rounded-xl bg-blue-600 py-3 text-lg font-medium text-white active:bg-blue-700 sm:w-auto sm:px-8"
            >
              Back to Test
            </button>
            <a
              href="/"
              className="w-full rounded-xl border-2 border-blue-600 py-3 text-lg font-medium text-blue-600 active:bg-blue-50 sm:w-auto sm:px-8"
            >
              Home
            </a>
          </div>
        </div>
      );
    }

    saveHighScore(configKey, pct);
    saveAttempt({
      mode: "perfekt",
      chapter: chapter ?? null,
      category: exceptionsOnly ? "exceptions" : null,
      difficulty: difficulty ?? null,
      correct,
      total: answered,
      percentage: pct,
      timestamp: Date.now(),
    });
    const best = getHighScore(configKey);
    const isNewBest = best === pct;

    return (
      <div className="space-y-6 text-center">
        <h2 className="text-2xl font-bold">Test Complete</h2>
        <p className="text-5xl font-bold">
          {correct}/{answered}
        </p>
        <p className="text-gray-600">
          {answered > 0 ? `${pct}% fully correct` : ""}
        </p>
        {isNewBest && pct > 0 && (
          <p className="text-lg font-semibold text-amber-500">
            New high score!
          </p>
        )}
        {best !== null && !isNewBest && (
          <p className="text-sm text-gray-500">Best: {best}%</p>
        )}
        <button
          onClick={() => restart(chapter, exceptionsOnly, difficulty)}
          className="w-full rounded-xl bg-blue-600 py-3 text-lg font-medium text-white active:bg-blue-700 sm:w-auto sm:px-8"
        >
          Try Again
        </button>
      </div>
    );
  }

  const typeLabel: Record<string, string> = {
    regular: "regular (ge...t)",
    irregular: "irregular (ge...en)",
    "no-ge": "no ge- prefix",
    separable: "separable prefix",
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <ChapterFilter
          value={chapter}
          onChange={(ch) => restart(ch, exceptionsOnly, difficulty)}
        />
        <DifficultyFilter
          value={difficulty}
          onChange={(d) => restart(chapter, exceptionsOnly, d)}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={exceptionsOnly}
            onChange={(e) =>
              restart(chapter, e.target.checked, difficulty)
            }
            className="h-4 w-4"
          />
          Exceptions only
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={mistakesOnly}
            onChange={(e) =>
              restart(chapter, exceptionsOnly, difficulty, e.target.checked)
            }
            className="h-4 w-4"
          />
          Practice mistakes{wrongCount > 0 ? ` (${wrongCount})` : ""}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showHint}
            onChange={(e) => setShowHint(e.target.checked)}
            className="h-4 w-4"
          />
          Show hint
        </label>
      </div>

      <ScoreDisplay
        correct={correct}
        total={answered}
        current={index + 1}
        count={items.length}
      />

      <div className="rounded-xl border bg-white p-5 shadow-sm sm:p-8">
        <div className="text-center">
          <p className="text-3xl font-bold sm:text-4xl">
            {current.infinitive}
          </p>
          <p className="mt-1 text-base text-gray-600">{current.english}</p>
          {showHint && (
            <span className="mt-2 inline-block rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800">
              {typeLabel[current.perfekt.perfektType]}
            </span>
          )}
        </div>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <label className="w-24 shrink-0 text-right text-sm font-medium text-gray-700">
              Auxiliary
            </label>
            <div className="flex flex-1 gap-2">
              {(["haben", "sein"] as const).map((aux) => (
                <button
                  key={aux}
                  type="button"
                  disabled={!!result}
                  onClick={() => setAuxInput(aux)}
                  className={`flex-1 rounded-lg border px-3 py-2.5 text-base font-medium transition-colors ${
                    result
                      ? aux === current.perfekt.auxiliary
                        ? "border-green-500 bg-green-50 text-green-700"
                        : aux === auxInput && !result.auxCorrect
                          ? "border-red-500 bg-red-50 text-red-700"
                          : "border-gray-200 text-gray-400"
                      : auxInput === aux
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300 text-gray-700"
                  }`}
                >
                  {aux}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <label className="w-24 shrink-0 text-right text-sm font-medium text-gray-700">
              Partizip II
            </label>
            <input
              type="text"
              value={partInput}
              onChange={(e) => setPartInput(e.target.value)}
              disabled={!!result}
              className={`min-w-0 flex-1 rounded-lg border px-3 py-2.5 text-base ${
                result
                  ? result.partCorrect
                    ? "border-green-500 bg-green-50"
                    : "border-red-500 bg-red-50"
                  : "border-gray-300"
              }`}
              placeholder="e.g. gemacht"
              autoComplete="off"
              autoCapitalize="off"
            />
            {result && !result.partCorrect && (
              <span className="shrink-0 text-sm font-medium text-red-600">
                {current.perfekt.partizipII}
              </span>
            )}
            {result && result.partCorrect && (
              <span className="shrink-0 text-sm text-green-600">&#10003;</span>
            )}
          </div>

          {!result && (
            <div className="pt-3">
              <button
                type="submit"
                disabled={!auxInput}
                className="w-full rounded-xl bg-blue-600 py-3 text-lg font-medium text-white active:bg-blue-700 disabled:bg-gray-300 sm:w-auto sm:px-8"
              >
                Check
              </button>
            </div>
          )}
        </form>

        {result && (
          <div className="mt-4 text-center">
            {result.auxCorrect && result.partCorrect ? (
              <p className="mb-3 text-lg font-semibold text-green-600">
                Correct!
              </p>
            ) : (
              <p className="mb-3 text-sm text-gray-600">
                {current.perfekt.auxiliary} {current.perfekt.partizipII}
              </p>
            )}
            <button
              onClick={next}
              className="w-full rounded-xl bg-blue-600 py-3 text-lg font-medium text-white active:bg-blue-700 sm:w-auto sm:px-8"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
