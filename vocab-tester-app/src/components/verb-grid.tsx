"use client";

import { useState, useCallback, FormEvent } from "react";
import { Verb, Difficulty, getVerbsByFilter, shuffle } from "@/lib/data";
import { ChapterFilter } from "./chapter-filter";
import { DifficultyFilter } from "./difficulty-filter";
import { ScoreDisplay } from "./score-display";

const PERSONS = ["ich", "du", "er/sie/es", "wir", "ihr", "sie/Sie"] as const;

export function VerbGrid() {
  const [chapter, setChapter] = useState<number | undefined>(undefined);
  const [difficulty, setDifficulty] = useState<Difficulty | undefined>(undefined);
  const [irregularOnly, setIrregularOnly] = useState(false);
  const [items, setItems] = useState<Verb[]>(() => shuffle(getVerbsByFilter()));
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [inputs, setInputs] = useState<Record<string, string>>(
    Object.fromEntries(PERSONS.map((p) => [p, ""]))
  );
  const [result, setResult] = useState<Record<string, boolean> | null>(null);
  const [finished, setFinished] = useState(false);

  const filterItems = useCallback((ch?: number, irrOnly?: boolean, diff?: Difficulty) => {
    let filtered = getVerbsByFilter(ch, diff);
    if (irrOnly) {
      filtered = filtered.filter(
        (v) => v.type === "irregular" || v.type === "modal"
      );
    }
    return shuffle(filtered);
  }, []);

  const restart = useCallback(
    (ch?: number, irrOnly?: boolean, diff?: Difficulty) => {
      setChapter(ch);
      setDifficulty(diff);
      setIrregularOnly(irrOnly ?? irregularOnly);
      setItems(filterItems(ch, irrOnly ?? irregularOnly, diff ?? difficulty));
      setIndex(0);
      setCorrect(0);
      setAnswered(0);
      setInputs(Object.fromEntries(PERSONS.map((p) => [p, ""])));
      setResult(null);
      setFinished(false);
    },
    [filterItems, irregularOnly, difficulty]
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
    if (allCorrect) setCorrect((c) => c + 1);
  };

  const next = () => {
    if (index + 1 >= items.length) {
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
      setInputs(Object.fromEntries(PERSONS.map((p) => [p, ""])));
      setResult(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <ChapterFilter value={chapter} onChange={(ch) => restart(ch, irregularOnly, difficulty)} />
        <DifficultyFilter value={difficulty} onChange={(d) => restart(chapter, irregularOnly, d)} />
        <p>No verbs found for this filter.</p>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="space-y-6 text-center">
        <h2 className="text-2xl font-bold">Test Complete</h2>
        <p className="text-5xl font-bold">
          {correct}/{answered}
        </p>
        <p className="text-gray-600">
          {answered > 0
            ? `${Math.round((correct / answered) * 100)}% fully correct`
            : ""}
        </p>
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
