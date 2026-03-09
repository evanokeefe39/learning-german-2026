"use client";

import { useState, useCallback } from "react";
import { Noun, getNounsByChapter, shuffle } from "@/lib/data";
import { ChapterFilter } from "./chapter-filter";
import { ScoreDisplay } from "./score-display";

const ARTICLES = ["der", "die", "das"] as const;

export function NounTest() {
  const [chapter, setChapter] = useState<number | undefined>(undefined);
  const [items, setItems] = useState<Noun[]>(() => shuffle(getNounsByChapter()));
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  const restart = useCallback(
    (ch?: number) => {
      setChapter(ch);
      setItems(shuffle(getNounsByChapter(ch)));
      setIndex(0);
      setCorrect(0);
      setAnswered(0);
      setSelected(null);
      setFinished(false);
    },
    []
  );

  const current = items[index];

  const pick = (article: string) => {
    if (selected) return;
    setSelected(article);
    setAnswered((a) => a + 1);
    if (article === current.article) {
      setCorrect((c) => c + 1);
    }
  };

  const next = () => {
    if (index + 1 >= items.length) {
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <ChapterFilter value={chapter} onChange={restart} />
        <p>No nouns found for this filter.</p>
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
          {Math.round((correct / answered) * 100)}% correct
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

  const isCorrect = selected === current.article;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <ChapterFilter value={chapter} onChange={restart} />
      </div>

      <ScoreDisplay
        correct={correct}
        total={answered}
        current={index + 1}
        count={items.length}
      />

      <div className="rounded-lg border bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-gray-500">{current.category}</p>
        <p className="mt-2 text-4xl font-bold">{current.german}</p>
        <p className="mt-1 text-gray-600">{current.english}</p>

        <div className="mt-8 flex justify-center gap-4">
          {ARTICLES.map((a) => {
            let cls =
              "rounded-lg border-2 px-8 py-3 text-lg font-semibold transition";
            if (!selected) {
              cls += " border-gray-300 hover:border-blue-500 hover:bg-blue-50";
            } else if (a === current.article) {
              cls += " border-green-500 bg-green-50 text-green-700";
            } else if (a === selected) {
              cls += " border-red-500 bg-red-50 text-red-700";
            } else {
              cls += " border-gray-200 text-gray-400";
            }
            return (
              <button
                key={a}
                onClick={() => pick(a)}
                disabled={!!selected}
                className={cls}
              >
                {a}
              </button>
            );
          })}
        </div>

        {selected && (
          <div className="mt-6">
            <p
              className={`text-lg font-semibold ${
                isCorrect ? "text-green-600" : "text-red-600"
              }`}
            >
              {isCorrect
                ? "Correct!"
                : `Wrong — it's ${current.article} ${current.german}`}
            </p>
            <button
              onClick={next}
              className="mt-4 rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
