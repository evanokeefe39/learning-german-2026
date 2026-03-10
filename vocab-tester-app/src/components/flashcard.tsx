"use client";

import { useState, useCallback, FormEvent } from "react";
import { Noun, Difficulty, getNounsByFilter, shuffle } from "@/lib/data";
import { ChapterFilter } from "./chapter-filter";
import { CategoryFilter } from "./category-filter";
import { DifficultyFilter } from "./difficulty-filter";
import { ScoreDisplay } from "./score-display";

export function Flashcard() {
  const [chapter, setChapter] = useState<number | undefined>(undefined);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [difficulty, setDifficulty] = useState<Difficulty | undefined>(undefined);
  const [items, setItems] = useState<Noun[]>(() => shuffle(getNounsByFilter()));
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [input, setInput] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [finished, setFinished] = useState(false);

  const restart = useCallback((ch?: number, cat?: string, diff?: Difficulty) => {
    setChapter(ch);
    setCategory(cat);
    setDifficulty(diff);
    setItems(shuffle(getNounsByFilter(ch, cat, diff)));
    setIndex(0);
    setCorrect(0);
    setAnswered(0);
    setInput("");
    setRevealed(false);
    setIsCorrect(false);
    setFinished(false);
  }, []);

  const current = items[index];

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (revealed) return;

    const expected = `${current.article} ${current.german}`.toLowerCase().trim();
    const given = input.toLowerCase().trim();
    const match = given === expected;
    setIsCorrect(match);
    setRevealed(true);
    setAnswered((a) => a + 1);
    if (match) setCorrect((c) => c + 1);
  };

  const next = () => {
    if (index + 1 >= items.length) {
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
      setInput("");
      setRevealed(false);
      setIsCorrect(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <ChapterFilter value={chapter} onChange={(ch) => restart(ch, category, difficulty)} />
          <CategoryFilter value={category} chapter={chapter} onChange={(cat) => restart(chapter, cat, difficulty)} />
          <DifficultyFilter value={difficulty} onChange={(d) => restart(chapter, category, d)} />
        </div>
        <p>No flashcards found for this filter.</p>
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
          {Math.round((correct / answered) * 100)}% correct
        </p>
        <button
          onClick={() => restart(chapter, category, difficulty)}
          className="w-full rounded-xl bg-blue-600 py-3 text-lg font-medium text-white active:bg-blue-700 sm:w-auto sm:px-8"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <ChapterFilter value={chapter} onChange={(ch) => restart(ch, category, difficulty)} />
        <CategoryFilter value={category} chapter={chapter} onChange={(cat) => restart(chapter, cat, difficulty)} />
        <DifficultyFilter value={difficulty} onChange={(d) => restart(chapter, category, d)} />
      </div>

      <ScoreDisplay
        correct={correct}
        total={answered}
        current={index + 1}
        count={items.length}
      />

      <div className="rounded-xl border bg-white p-5 text-center shadow-sm sm:p-8">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
          {current.category}
        </p>
        <p className="mt-3 text-xl font-semibold text-gray-800 sm:text-2xl">
          {current.english}
        </p>
        <p className="mt-4 text-sm italic text-gray-500">{current.hint}</p>

        <form onSubmit={submit} className="mt-6">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={revealed}
            placeholder="der/die/das + Noun"
            className={`w-full rounded-xl border px-4 py-3 text-center text-lg ${
              revealed
                ? isCorrect
                  ? "border-green-500 bg-green-50"
                  : "border-red-500 bg-red-50"
                : "border-gray-300"
            }`}
            autoFocus
            autoComplete="off"
            autoCapitalize="off"
          />
          {!revealed && (
            <div className="mt-4">
              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-3 text-lg font-medium text-white active:bg-blue-700 sm:w-auto sm:px-8"
              >
                Submit
              </button>
            </div>
          )}
        </form>

        {revealed && (
          <div className="mt-6">
            <p
              className={`text-lg font-semibold ${
                isCorrect ? "text-green-600" : "text-red-600"
              }`}
            >
              {isCorrect
                ? "Correct!"
                : `Wrong — the answer is: ${current.article} ${current.german}`}
            </p>
            <button
              onClick={next}
              className="mt-4 w-full rounded-xl bg-blue-600 py-3 text-lg font-medium text-white active:bg-blue-700 sm:w-auto sm:px-8"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
