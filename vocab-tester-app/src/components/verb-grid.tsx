"use client";

import { useState, useCallback, FormEvent } from "react";
import { Verb, getVerbsByChapter, shuffle } from "@/lib/data";
import { ChapterFilter } from "./chapter-filter";
import { ScoreDisplay } from "./score-display";

const PERSONS = ["ich", "du", "er/sie/es", "wir", "ihr", "sie/Sie"] as const;

export function VerbGrid() {
  const [chapter, setChapter] = useState<number | undefined>(undefined);
  const [irregularOnly, setIrregularOnly] = useState(false);
  const [items, setItems] = useState<Verb[]>(() => shuffle(getVerbsByChapter()));
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [inputs, setInputs] = useState<Record<string, string>>(
    Object.fromEntries(PERSONS.map((p) => [p, ""]))
  );
  const [result, setResult] = useState<Record<string, boolean> | null>(null);
  const [finished, setFinished] = useState(false);

  const filterItems = useCallback(
    (ch?: number, irrOnly?: boolean) => {
      let filtered = getVerbsByChapter(ch);
      if (irrOnly) {
        filtered = filtered.filter(
          (v) => v.type === "irregular" || v.type === "modal"
        );
      }
      return shuffle(filtered);
    },
    []
  );

  const restart = useCallback(
    (ch?: number, irrOnly?: boolean) => {
      setChapter(ch);
      setIrregularOnly(irrOnly ?? irregularOnly);
      setItems(filterItems(ch, irrOnly ?? irregularOnly));
      setIndex(0);
      setCorrect(0);
      setAnswered(0);
      setInputs(Object.fromEntries(PERSONS.map((p) => [p, ""])));
      setResult(null);
      setFinished(false);
    },
    [filterItems, irregularOnly]
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
        <ChapterFilter value={chapter} onChange={(ch) => restart(ch)} />
        <p>No verbs found for this filter.</p>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="space-y-6 text-center">
        <h2 className="text-2xl font-bold">Test Complete</h2>
        <p className="text-4xl font-bold">
          {correct}/{answered}
        </p>
        <p className="text-gray-600">
          {answered > 0
            ? `${Math.round((correct / answered) * 100)}% fully correct`
            : ""}
        </p>
        <button
          onClick={() => restart(chapter)}
          className="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  const isIrregular =
    current.type === "irregular" || current.type === "modal";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <ChapterFilter value={chapter} onChange={(ch) => restart(ch)} />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={irregularOnly}
            onChange={(e) => restart(chapter, e.target.checked)}
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

      <div className="rounded-lg border bg-white p-8 shadow-sm">
        <div className="text-center">
          <p className="text-3xl font-bold">{current.infinitive}</p>
          <p className="mt-1 text-gray-600">{current.english}</p>
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
              <div key={p} className="flex items-center gap-3">
                <label className="w-24 text-right text-sm font-medium text-gray-700">
                  {p}
                </label>
                <input
                  type="text"
                  value={inputs[p]}
                  onChange={(e) =>
                    setInputs((prev) => ({ ...prev, [p]: e.target.value }))
                  }
                  disabled={!!result}
                  className={`flex-1 rounded border px-3 py-2 text-sm ${
                    isRight
                      ? "border-green-500 bg-green-50"
                      : isWrong
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                  }`}
                  placeholder={`${p} ...`}
                />
                {isWrong && (
                  <span className="text-sm text-red-600">
                    {current.conjugation[p]}
                  </span>
                )}
                {isRight && (
                  <span className="text-sm text-green-600">&#10003;</span>
                )}
              </div>
            );
          })}

          {!result && (
            <div className="pt-2 text-center">
              <button
                type="submit"
                className="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
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
              className="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
