"use client";

import { useState, useCallback, useEffect, useRef, FormEvent } from "react";
import { Noun, Difficulty, getNounsByFilter, shuffle } from "@/lib/data";
import { ChapterFilter } from "./chapter-filter";
import { CategoryFilter } from "./category-filter";
import { DifficultyFilter } from "./difficulty-filter";
import { ScoreDisplay } from "./score-display";
import { FilterBar } from "./filter-bar";
import { FinishedScreen, MistakesFinishedScreen } from "./finished-screen";
import { EmptyState } from "./empty-state";
import { PracticeBanner } from "./practice-banner";
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

export function Flashcard() {
  const [chapter, setChapter] = useState<number | undefined>(undefined);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [difficulty, setDifficulty] = useState<Difficulty | undefined>(undefined);
  const [mistakesOnly, setMistakesOnly] = useState(false);
  const [excludeMastered, setExcludeMastered] = useState(false);
  const [items, setItems] = useState<Noun[]>(() => shuffle(getNounsByFilter()));
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [input, setInput] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [finished, setFinished] = useState(false);
  const [wrongCount, setWrongCount] = useState(0);
  const [masteredCount, setMasteredCount] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    setWrongCount(getWrongWordCount("flashcards"));
    setMasteredCount(getMasteredWordCount("flashcards"));
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
    saveHighScore(buildConfigKey("flashcards", s.chapter, s.category, s.difficulty), pct);
    saveAttempt({
      mode: "flashcards",
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
        const wrong = new Set(getWrongWords("flashcards"));
        filtered = filtered.filter((n) => wrong.has(n.german));
      }
      if (excludeMast) {
        const mastered = getMasteredWords("flashcards");
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
      setInput("");
      setRevealed(false);
      setIsCorrect(false);
      setFinished(false);
      setWrongCount(getWrongWordCount("flashcards"));
      setMasteredCount(getMasteredWordCount("flashcards"));
    },
    [applyFilter, mistakesOnly, excludeMastered, answered, correct, finished]
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
    setAnimKey((k) => k + 1);
    if (match) {
      setCorrect((c) => c + 1);
      removeWrongWord("flashcards", current.german);
      if (!mistakesOnly) incrementMastery("flashcards", current.german);
    } else {
      addWrongWord("flashcards", current.german);
    }
    setWrongCount(getWrongWordCount("flashcards"));
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

  // Enter-to-advance when answer is revealed
  useEffect(() => {
    if (!revealed) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed, index, items.length]);

  const configKey = buildConfigKey("flashcards", chapter, category, difficulty);

  const filterBar = (
    <FilterBar
      dropdowns={
        <>
          <ChapterFilter value={chapter} onChange={(ch) => restart(ch, category, difficulty)} />
          <CategoryFilter value={category} chapter={chapter} onChange={(cat) => restart(chapter, cat, difficulty)} />
          <DifficultyFilter value={difficulty} onChange={(d) => restart(chapter, category, d)} />
        </>
      }
      toggles={[
        { key: "mistakes", label: "Practice mistakes", count: wrongCount, checked: mistakesOnly, onChange: (v) => restart(chapter, category, difficulty, v), variant: "warning" },
        { key: "mastered", label: "Exclude known words", count: masteredCount, checked: excludeMastered, onChange: (v) => restart(chapter, category, difficulty, mistakesOnly, v) },
      ]}
    />
  );

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        {filterBar}
        <EmptyState mistakesOnly={mistakesOnly} modeLabel="flashcards" />
      </div>
    );
  }

  if (finished) {
    const pct = Math.round((correct / answered) * 100);
    if (mistakesOnly) {
      return <MistakesFinishedScreen onBackToTest={() => restart(chapter, category, difficulty, false)} />;
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
      <FinishedScreen
        correct={correct}
        answered={answered}
        percentage={pct}
        isNewBest={isNewBest && pct > 0}
        bestScore={(!isNewBest && best) || null}
        onTryAgain={() => restart(chapter, category, difficulty)}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {filterBar}

      {mistakesOnly && (
        <PracticeBanner
          count={items.length}
          onExit={() => restart(chapter, category, difficulty, false)}
        />
      )}

      <ScoreDisplay
        correct={correct}
        total={answered}
        current={index + 1}
        count={items.length}
        practiceMode={mistakesOnly}
      />

      <div
        key={animKey}
        className={`rounded-xl border bg-white p-5 text-center shadow-sm sm:p-8${
          revealed ? (isCorrect ? " animate-pop" : " animate-shake") : ""
        }`}
      >
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
