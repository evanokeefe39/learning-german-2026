"use client";

import { useState, useCallback, useEffect, useRef, FormEvent } from "react";
import { Noun, Difficulty, getNounsByFilter, shuffle } from "@/lib/data";
import { ChapterFilter } from "./chapter-filter";
import { CategoryFilter } from "./category-filter";
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

export function Flashcard() {
  const [chapter, setChapter] = useState<number | undefined>(undefined);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [difficulty, setDifficulty] = useState<Difficulty | undefined>(undefined);
  const [mistakesOnly, setMistakesOnly] = useState(false);
  const [items, setItems] = useState<Noun[]>(() => shuffle(getNounsByFilter()));
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [input, setInput] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [finished, setFinished] = useState(false);
  const [wrongCount, setWrongCount] = useState(0);

  useEffect(() => {
    setWrongCount(getWrongWordCount("flashcards"));
  }, []);

  const stateRef = useRef({ correct, answered, finished, mistakesOnly, chapter, category, difficulty });
  useEffect(() => {
    stateRef.current = { correct, answered, finished, mistakesOnly, chapter, category, difficulty };
  });
  useEffect(() => {
    return () => {
      const s = stateRef.current;
      if (s.answered > 0 && !s.finished && !s.mistakesOnly) {
        const pct = Math.round((s.correct / s.answered) * 100);
        saveHighScore(buildConfigKey("flashcards", s.chapter, s.category, s.difficulty), pct);
        saveAttempt({
          mode: "flashcards",
          chapter: s.chapter ?? null,
          category: s.category ?? null,
          difficulty: s.difficulty ?? null,
          correct: s.correct,
          total: s.answered,
          percentage: pct,
          timestamp: Date.now(),
        });
      }
    };
  }, []);

  const applyFilter = useCallback(
    (ch?: number, cat?: string, diff?: Difficulty, mistakes?: boolean) => {
      let filtered = getNounsByFilter(ch, cat, diff);
      if (mistakes) {
        const wrong = new Set(getWrongWords("flashcards"));
        filtered = filtered.filter((n) => wrong.has(n.german));
      }
      return shuffle(filtered);
    },
    []
  );

  const restart = useCallback(
    (ch?: number, cat?: string, diff?: Difficulty, mistakes?: boolean) => {
      const m = mistakes ?? mistakesOnly;
      setChapter(ch);
      setCategory(cat);
      setDifficulty(diff);
      setMistakesOnly(m);
      setItems(applyFilter(ch, cat, diff, m));
      setIndex(0);
      setCorrect(0);
      setAnswered(0);
      setInput("");
      setRevealed(false);
      setIsCorrect(false);
      setFinished(false);
      setWrongCount(getWrongWordCount("flashcards"));
    },
    [applyFilter, mistakesOnly]
  );

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
    if (match) {
      setCorrect((c) => c + 1);
      removeWrongWord("flashcards", current.german);
    } else {
      addWrongWord("flashcards", current.german);
    }
  };

  const next = () => {
    if (index + 1 >= items.length) {
      if (mistakesOnly) {
        const refreshed = applyFilter(chapter, category, difficulty, true);
        if (refreshed.length > 0) {
          setItems(refreshed);
          setIndex(0);
          setInput("");
          setRevealed(false);
          setIsCorrect(false);
          setWrongCount(refreshed.length);
          return;
        }
      }
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
      setInput("");
      setRevealed(false);
      setIsCorrect(false);
    }
  };

  const configKey = buildConfigKey("flashcards", chapter, category, difficulty);

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <ChapterFilter value={chapter} onChange={(ch) => restart(ch, category, difficulty)} />
          <CategoryFilter value={category} chapter={chapter} onChange={(cat) => restart(chapter, cat, difficulty)} />
          <DifficultyFilter value={difficulty} onChange={(d) => restart(chapter, category, d)} />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={mistakesOnly}
              onChange={(e) => restart(chapter, category, difficulty, e.target.checked)}
              className="h-4 w-4"
            />
            Practice mistakes{wrongCount > 0 ? ` (${wrongCount})` : ""}
          </label>
        </div>
        <p>{mistakesOnly ? "No mistakes to practice!" : "No flashcards found for this filter."}</p>
      </div>
    );
  }

  if (finished) {
    const pct = Math.round((correct / answered) * 100);

    if (mistakesOnly) {
      return (
        <div className="space-y-6 text-center">
          <h2 className="text-2xl font-bold text-green-600">Practice Complete</h2>
          <p className="text-5xl font-bold">
            {correct}/{answered}
          </p>
          <p className="text-gray-600">{pct}% correct</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => restart(chapter, category, difficulty, false)}
              className="w-full rounded-xl bg-blue-600 py-3 text-lg font-medium text-white active:bg-blue-700 sm:w-auto sm:px-8"
            >
              Back to Test
            </button>
            <button
              onClick={() => restart(chapter, category, difficulty, true)}
              className="w-full rounded-xl border-2 border-blue-600 py-3 text-lg font-medium text-blue-600 active:bg-blue-50 sm:w-auto sm:px-8"
            >
              Practice Again
            </button>
          </div>
        </div>
      );
    }

    saveHighScore(configKey, pct);
    saveAttempt({
      mode: "flashcards",
      chapter: chapter ?? null,
      category: category ?? null,
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
        <p className="text-gray-600">{pct}% correct</p>
        {isNewBest && pct > 0 && (
          <p className="text-lg font-semibold text-amber-500">New high score!</p>
        )}
        {best !== null && !isNewBest && (
          <p className="text-sm text-gray-500">Best: {best}%</p>
        )}
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
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={mistakesOnly}
            onChange={(e) => restart(chapter, category, difficulty, e.target.checked)}
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
