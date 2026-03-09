"use client";

import { useState, useCallback, FormEvent } from "react";
import { Noun, getNounsByChapter, shuffle } from "@/lib/data";
import { ChapterFilter } from "./chapter-filter";
import { ScoreDisplay } from "./score-display";

export function Flashcard() {
  const [chapter, setChapter] = useState<number | undefined>(undefined);
  const [items, setItems] = useState<Noun[]>(() => shuffle(getNounsByChapter()));
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [input, setInput] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [finished, setFinished] = useState(false);

  const restart = useCallback((ch?: number) => {
    setChapter(ch);
    setItems(shuffle(getNounsByChapter(ch)));
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
        <ChapterFilter value={chapter} onChange={restart} />
        <p>No flashcards found for this filter.</p>
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

  return (
    <div className="space-y-6">
      <ChapterFilter value={chapter} onChange={restart} />

      <ScoreDisplay
        correct={correct}
        total={answered}
        current={index + 1}
        count={items.length}
      />

      <div className="rounded-lg border bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-gray-500">{current.category}</p>
        <p className="mt-2 text-lg text-gray-700">{current.english}</p>
        <p className="mt-4 text-sm italic text-gray-500">
          Hint: {current.hint}
        </p>

        <form onSubmit={submit} className="mt-8">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={revealed}
            placeholder="der/die/das + Noun"
            className={`w-full max-w-sm rounded border px-4 py-3 text-center text-lg ${
              revealed
                ? isCorrect
                  ? "border-green-500 bg-green-50"
                  : "border-red-500 bg-red-50"
                : "border-gray-300"
            }`}
            autoFocus
          />
          {!revealed && (
            <div className="mt-4">
              <button
                type="submit"
                className="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
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
