"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
  incrementMastery,
  getMasteredWords,
  getMasteredWordCount,
} from "@/lib/storage";

const ARTICLES = ["der", "die", "das"] as const;

export function NounTest() {
  const [chapter, setChapter] = useState<number | undefined>(undefined);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [difficulty, setDifficulty] = useState<Difficulty | undefined>(undefined);
  const [mistakesOnly, setMistakesOnly] = useState(false);
  const [excludeMastered, setExcludeMastered] = useState(false);
  const [items, setItems] = useState<Noun[]>(() => shuffle(getNounsByFilter()));
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [wrongCount, setWrongCount] = useState(0);
  const [masteredCount, setMasteredCount] = useState(0);

  useEffect(() => {
    setWrongCount(getWrongWordCount("nouns"));
    setMasteredCount(getMasteredWordCount("nouns"));
  }, []);

  const stateRef = useRef({ correct, answered, finished, mistakesOnly, excludeMastered, chapter, category, difficulty });
  useEffect(() => {
    stateRef.current = { correct, answered, finished, mistakesOnly, excludeMastered, chapter, category, difficulty };
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
    saveHighScore(buildConfigKey("nouns", s.chapter, s.category, s.difficulty), pct);
    saveAttempt({
      mode: "nouns",
      chapter: s.chapter ?? null,
      category: s.category ?? null,
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

  const applyFilter = useCallback(
    (ch?: number, cat?: string, diff?: Difficulty, mistakes?: boolean, excludeMast?: boolean) => {
      let filtered = getNounsByFilter(ch, cat, diff);
      if (mistakes) {
        const wrong = new Set(getWrongWords("nouns"));
        filtered = filtered.filter((n) => wrong.has(n.german));
      }
      if (excludeMast) {
        const mastered = getMasteredWords("nouns");
        filtered = filtered.filter((n) => !mastered.has(n.german));
      }
      return shuffle(filtered);
    },
    []
  );

  const restart = useCallback(
    (ch?: number, cat?: string, diff?: Difficulty, mistakes?: boolean, excludeMast?: boolean) => {
      const m = mistakes ?? mistakesOnly;
      const em = excludeMast ?? excludeMastered;
      if (m && !mistakesOnly && answered > 0 && !finished) {
        pausedProgress.current = { correct, answered };
      } else if (!m) {
        pausedProgress.current = null;
        savedRef.current = false;
      }
      setChapter(ch);
      setCategory(cat);
      setDifficulty(diff);
      setMistakesOnly(m);
      setExcludeMastered(em);
      setItems(applyFilter(ch, cat, diff, m, em));
      setIndex(0);
      setCorrect(0);
      setAnswered(0);
      setSelected(null);
      setFinished(false);
      setWrongCount(getWrongWordCount("nouns"));
      setMasteredCount(getMasteredWordCount("nouns"));
    },
    [applyFilter, mistakesOnly, excludeMastered, answered, correct, finished]
  );

  const current = items[index];

  const pick = (article: string) => {
    if (selected) return;
    setSelected(article);
    setAnswered((a) => a + 1);
    if (article === current.article) {
      setCorrect((c) => c + 1);
      removeWrongWord("nouns", current.german);
      if (!mistakesOnly) incrementMastery("nouns", current.german);
    } else {
      addWrongWord("nouns", current.german);
    }
    setWrongCount(getWrongWordCount("nouns"));
  };

  const next = () => {
    if (index + 1 >= items.length) {
      if (mistakesOnly) {
        const refreshed = applyFilter(chapter, category, difficulty, true);
        if (refreshed.length > 0) {
          setItems(refreshed);
          setIndex(0);
          setSelected(null);
          setWrongCount(refreshed.length);
          return;
        }
      }
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
    }
  };

  const configKey = buildConfigKey("nouns", chapter, category, difficulty);

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
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={excludeMastered}
              onChange={(e) => restart(chapter, category, difficulty, mistakesOnly, e.target.checked)}
              className="h-4 w-4"
            />
            Exclude mastered{masteredCount > 0 ? ` (${masteredCount})` : ""}
          </label>
        </div>
        <p>{mistakesOnly ? "No mistakes to practice!" : "No nouns found for this filter."}</p>
      </div>
    );
  }

  if (finished) {
    const pct = Math.round((correct / answered) * 100);

    if (mistakesOnly) {
      return (
        <div className="space-y-6 text-center">
          <h2 className="text-2xl font-bold text-green-600">All Done</h2>
          <p className="text-lg text-gray-600">No more mistakes to practice!</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => restart(chapter, category, difficulty, false)}
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
      mode: "nouns",
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

  const isCorrect = selected === current.article;

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
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={excludeMastered}
            onChange={(e) => restart(chapter, category, difficulty, mistakesOnly, e.target.checked)}
            className="h-4 w-4"
          />
          Exclude mastered{masteredCount > 0 ? ` (${masteredCount})` : ""}
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
        <p className="mt-3 text-4xl font-bold sm:text-5xl">{current.german}</p>
        <p className="mt-2 text-base text-gray-600">{current.english}</p>

        <div className="mt-6 grid grid-cols-3 gap-3 sm:mt-8 sm:flex sm:justify-center sm:gap-4">
          {ARTICLES.map((a) => {
            let cls =
              "rounded-xl border-2 py-4 text-lg font-semibold transition sm:px-10";
            if (!selected) {
              cls += " border-gray-300 active:bg-blue-50 sm:hover:border-blue-500 sm:hover:bg-blue-50";
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
