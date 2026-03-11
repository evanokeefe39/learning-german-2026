"use client";

import { useState, useCallback, useEffect, useRef, FormEvent } from "react";
import { Verb, Difficulty, getVerbsByFilter, shuffle, getPerfektEntry } from "@/lib/data";
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

const PERSONS = ["ich", "du", "er/sie/es", "wir", "ihr", "sie/Sie"] as const;

export function VerbGrid() {
  const [chapter, setChapter] = useState<number | undefined>(undefined);
  const [difficulty, setDifficulty] = useState<Difficulty | undefined>(undefined);
  const [irregularOnly, setIrregularOnly] = useState(false);
  const [mistakesOnly, setMistakesOnly] = useState(false);
  const [items, setItems] = useState<Verb[]>(() => shuffle(getVerbsByFilter()));
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [inputs, setInputs] = useState<Record<string, string>>(
    Object.fromEntries(PERSONS.map((p) => [p, ""]))
  );
  const [result, setResult] = useState<Record<string, boolean> | null>(null);
  const [finished, setFinished] = useState(false);
  const [wrongCount, setWrongCount] = useState(0);

  useEffect(() => {
    setWrongCount(getWrongWordCount("verbs"));
  }, []);

  const stateRef = useRef({ correct, answered, finished, mistakesOnly, chapter, irregularOnly, difficulty });
  useEffect(() => {
    stateRef.current = { correct, answered, finished, mistakesOnly, chapter, irregularOnly, difficulty };
  });
  const savedRef = useRef(false);
  const saveOnLeave = useCallback(() => {
    const s = stateRef.current;
    if (savedRef.current || s.answered === 0 || s.finished || s.mistakesOnly) return;
    savedRef.current = true;
    const pct = Math.round((s.correct / s.answered) * 100);
    saveHighScore(buildConfigKey("verbs", s.chapter, undefined, s.difficulty), pct);
    saveAttempt({
      mode: "verbs",
      chapter: s.chapter ?? null,
      category: s.irregularOnly ? "irregular" : null,
      difficulty: s.difficulty ?? null,
      correct: s.correct,
      total: s.answered,
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
    (ch?: number, irrOnly?: boolean, diff?: Difficulty, mistakes?: boolean) => {
      let filtered = getVerbsByFilter(ch, diff);
      if (irrOnly) {
        filtered = filtered.filter(
          (v) => v.type === "irregular" || v.type === "modal"
        );
      }
      if (mistakes) {
        const wrong = new Set(getWrongWords("verbs"));
        filtered = filtered.filter((v) => wrong.has(v.infinitive));
      }
      return shuffle(filtered);
    },
    []
  );

  const restart = useCallback(
    (ch?: number, irrOnly?: boolean, diff?: Difficulty, mistakes?: boolean) => {
      saveOnLeave();
      const m = mistakes ?? mistakesOnly;
      setChapter(ch);
      setDifficulty(diff);
      setIrregularOnly(irrOnly ?? irregularOnly);
      setMistakesOnly(m);
      setItems(filterItems(ch, irrOnly ?? irregularOnly, diff ?? difficulty, m));
      setIndex(0);
      setCorrect(0);
      setAnswered(0);
      setInputs(Object.fromEntries(PERSONS.map((p) => [p, ""])));
      setResult(null);
      setFinished(false);
      setWrongCount(getWrongWordCount("verbs"));
      savedRef.current = false;
    },
    [filterItems, irregularOnly, difficulty, mistakesOnly]
  );

  const current = items[index];

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (result) return;

    const res: Record<string, boolean> = {};
    let allCorrect = true;
    for (const p of PERSONS) {
      const expected = current.conjugation[p].toLowerCase().trim();
      const given = inputs[p].toLowerCase().trim();
      res[p] = given === expected;
      if (!res[p]) allCorrect = false;
    }
    setResult(res);
    setAnswered((a) => a + 1);
    if (allCorrect) {
      setCorrect((c) => c + 1);
      removeWrongWord("verbs", current.infinitive);
    } else {
      addWrongWord("verbs", current.infinitive);
    }
    setWrongCount(getWrongWordCount("verbs"));
  };

  const next = () => {
    if (index + 1 >= items.length) {
      if (mistakesOnly) {
        const refreshed = filterItems(chapter, irregularOnly, difficulty, true);
        if (refreshed.length > 0) {
          setItems(refreshed);
          setIndex(0);
          setInputs(Object.fromEntries(PERSONS.map((p) => [p, ""])));
          setResult(null);
          setWrongCount(refreshed.length);
          return;
        }
      }
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
      setInputs(Object.fromEntries(PERSONS.map((p) => [p, ""])));
      setResult(null);
    }
  };

  const configKey = buildConfigKey("verbs", chapter, undefined, difficulty);

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <ChapterFilter value={chapter} onChange={(ch) => restart(ch, irregularOnly, difficulty)} />
          <DifficultyFilter value={difficulty} onChange={(d) => restart(chapter, irregularOnly, d)} />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={mistakesOnly}
              onChange={(e) => restart(chapter, irregularOnly, difficulty, e.target.checked)}
              className="h-4 w-4"
            />
            Practice mistakes{wrongCount > 0 ? ` (${wrongCount})` : ""}
          </label>
        </div>
        <p>{mistakesOnly ? "No mistakes to practice!" : "No verbs found for this filter."}</p>
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
              onClick={() => restart(chapter, irregularOnly, difficulty, false)}
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
      mode: "verbs",
      chapter: chapter ?? null,
      category: irregularOnly ? "irregular" : null,
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
          <p className="text-lg font-semibold text-amber-500">New high score!</p>
        )}
        {best !== null && !isNewBest && (
          <p className="text-sm text-gray-500">Best: {best}%</p>
        )}
        <button
          onClick={() => restart(chapter, irregularOnly, difficulty)}
          className="w-full rounded-xl bg-blue-600 py-3 text-lg font-medium text-white active:bg-blue-700 sm:w-auto sm:px-8"
        >
          Try Again
        </button>
      </div>
    );
  }

  const isIrregular = current.type === "irregular" || current.type === "modal";

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <ChapterFilter value={chapter} onChange={(ch) => restart(ch, irregularOnly, difficulty)} />
        <DifficultyFilter value={difficulty} onChange={(d) => restart(chapter, irregularOnly, d)} />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={irregularOnly}
            onChange={(e) => restart(chapter, e.target.checked, difficulty)}
            className="h-4 w-4"
          />
          Irregular/modal only
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={mistakesOnly}
            onChange={(e) => restart(chapter, irregularOnly, difficulty, e.target.checked)}
            className="h-4 w-4"
          />
          Practice mistakes{wrongCount > 0 ? ` (${wrongCount})` : ""}
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
          {isIrregular && (
            <span className="mt-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
              {current.stemChangePattern}
            </span>
          )}
        </div>

        <form onSubmit={submit} className="mt-6 space-y-3">
          {PERSONS.map((p) => {
            const isWrong = result && !result[p];
            const isRight = result && result[p];
            return (
              <div key={p} className="flex items-center gap-2 sm:gap-3">
                <label className="w-20 shrink-0 text-right text-sm font-medium text-gray-700 sm:w-24">
                  {p}
                </label>
                <input
                  type="text"
                  value={inputs[p]}
                  onChange={(e) =>
                    setInputs((prev) => ({ ...prev, [p]: e.target.value }))
                  }
                  disabled={!!result}
                  className={`min-w-0 flex-1 rounded-lg border px-3 py-2.5 text-base ${
                    isRight
                      ? "border-green-500 bg-green-50"
                      : isWrong
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                  }`}
                  placeholder={`${p} ...`}
                  autoComplete="off"
                  autoCapitalize="off"
                />
                {isWrong && (
                  <span className="shrink-0 text-sm font-medium text-red-600">
                    {current.conjugation[p]}
                  </span>
                )}
                {isRight && (
                  <span className="shrink-0 text-sm text-green-600">
                    &#10003;
                  </span>
                )}
              </div>
            );
          })}

          {!result && (
            <div className="pt-3">
              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-3 text-lg font-medium text-white active:bg-blue-700 sm:w-auto sm:px-8"
              >
                Check
              </button>
            </div>
          )}
        </form>

        {result && (
          <div className="mt-4 text-center">
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
