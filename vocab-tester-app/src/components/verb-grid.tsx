"use client";

import { useState, useCallback, useEffect, useRef, FormEvent } from "react";
import { Verb, Difficulty, getVerbsByFilter, shuffle, getPerfektEntry } from "@/lib/data";
import { ChapterFilter } from "./chapter-filter";
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

const PERSONS = ["ich", "du", "er/sie/es", "wir", "ihr", "sie/Sie"] as const;

export function VerbGrid() {
  const [chapter, setChapter] = useState<number | undefined>(undefined);
  const [difficulty, setDifficulty] = useState<Difficulty | undefined>(undefined);
  const [irregularOnly, setIrregularOnly] = useState(false);
  const [mistakesOnly, setMistakesOnly] = useState(false);
  const [excludeMastered, setExcludeMastered] = useState(false);
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
  const [masteredCount, setMasteredCount] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setWrongCount(getWrongWordCount("verbs"));
    setMasteredCount(getMasteredWordCount("verbs"));
  }, []);

  // Auto-focus first input when a new verb loads
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, [index]);

  const stateRef = useRef({ correct, answered, finished, mistakesOnly, excludeMastered, chapter, irregularOnly, difficulty });
  useEffect(() => {
    stateRef.current = { correct, answered, finished, mistakesOnly, excludeMastered, chapter, irregularOnly, difficulty };
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
    saveHighScore(buildConfigKey("verbs", s.chapter, undefined, s.difficulty), pct);
    saveAttempt({
      mode: "verbs",
      chapter: s.chapter ?? null,
      category: s.irregularOnly ? "irregular" : null,
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
    (ch?: number, irrOnly?: boolean, diff?: Difficulty, mistakes?: boolean, excludeMast?: boolean) => {
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
      if (excludeMast) {
        const mastered = getMasteredWords("verbs");
        filtered = filtered.filter((v) => !mastered.has(v.infinitive));
      }
      return shuffle(filtered);
    },
    []
  );

  const restart = useCallback(
    (ch?: number, irrOnly?: boolean, diff?: Difficulty, mistakes?: boolean, excludeMast?: boolean) => {
      const m = mistakes ?? mistakesOnly;
      const em = excludeMast ?? excludeMastered;
      if (m && !mistakesOnly && answered > 0 && !finished) {
        pausedProgress.current = { correct, answered };
      } else if (!m) {
        pausedProgress.current = null;
        savedRef.current = false;
      }
      setChapter(ch);
      setDifficulty(diff);
      setIrregularOnly(irrOnly ?? irregularOnly);
      setMistakesOnly(m);
      setExcludeMastered(em);
      setItems(filterItems(ch, irrOnly ?? irregularOnly, diff ?? difficulty, m, em));
      setIndex(0);
      setCorrect(0);
      setAnswered(0);
      setInputs(Object.fromEntries(PERSONS.map((p) => [p, ""])));
      setResult(null);
      setFinished(false);
      setWrongCount(getWrongWordCount("verbs"));
      setMasteredCount(getMasteredWordCount("verbs"));
    },
    [filterItems, irregularOnly, difficulty, mistakesOnly, excludeMastered, answered, correct, finished]
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
    if (!allCorrect) setAnimKey((k) => k + 1);
    setAnswered((a) => a + 1);
    if (allCorrect) {
      setCorrect((c) => c + 1);
      removeWrongWord("verbs", current.infinitive);
      if (!mistakesOnly) incrementMastery("verbs", current.infinitive);
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

  const filterBar = (
    <FilterBar
      dropdowns={
        <>
          <ChapterFilter value={chapter} onChange={(ch) => restart(ch, irregularOnly, difficulty)} />
          <DifficultyFilter value={difficulty} onChange={(d) => restart(chapter, irregularOnly, d)} />
        </>
      }
      toggles={[
        { key: "irregular", label: "Irregular/modal only", checked: irregularOnly, onChange: (v) => restart(chapter, v, difficulty) },
        { key: "mistakes", label: "Practice mistakes", count: wrongCount, checked: mistakesOnly, onChange: (v) => restart(chapter, irregularOnly, difficulty, v), variant: "warning" },
        { key: "mastered", label: "Exclude known words", count: masteredCount, checked: excludeMastered, onChange: (v) => restart(chapter, irregularOnly, difficulty, mistakesOnly, v) },
      ]}
    />
  );

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        {filterBar}
        <EmptyState mistakesOnly={mistakesOnly} modeLabel="verbs" />
      </div>
    );
  }

  if (finished) {
    const pct = answered > 0 ? Math.round((correct / answered) * 100) : 0;
    if (mistakesOnly) {
      return <MistakesFinishedScreen onBackToTest={() => restart(chapter, irregularOnly, difficulty, false)} />;
    }
    saveHighScore(configKey, pct);
    saveAttempt({ mode: "verbs", chapter: chapter ?? null, category: irregularOnly ? "irregular" : null, difficulty: difficulty ?? null, correct, total: answered, percentage: pct, timestamp: Date.now() });
    const best = getHighScore(configKey);
    const isNewBest = best === pct;
    return <FinishedScreen correct={correct} answered={answered} percentage={pct} isNewBest={isNewBest && pct > 0} bestScore={(!isNewBest && best) || null} onTryAgain={() => restart(chapter, irregularOnly, difficulty)} />;
  }

  const isIrregular = current.type === "irregular" || current.type === "modal";
  const allCorrect = result ? Object.values(result).every(Boolean) : false;

  return (
    <div className="space-y-4 sm:space-y-6">
      {filterBar}

      {mistakesOnly && (
        <PracticeBanner
          count={items.length}
          onExit={() => restart(chapter, irregularOnly, difficulty, false)}
        />
      )}

      <ScoreDisplay
        correct={correct}
        total={answered}
        current={index + 1}
        count={items.length}
        practiceMode={mistakesOnly}
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

        <div key={animKey} className={result && !allCorrect ? "animate-shake" : ""}>
          <form onSubmit={submit} className="mt-6 space-y-2">
            {PERSONS.map((p, i) => {
              const isWrong = result && !result[p];
              const isRight = result && result[p];
              return (
                <div key={p} className="flex items-center gap-2 sm:gap-3">
                  <label className="w-16 shrink-0 text-right text-sm font-medium text-gray-700 sm:w-24">
                    {p}
                  </label>
                  <input
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    value={inputs[p]}
                    onChange={(e) =>
                      setInputs((prev) => ({ ...prev, [p]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (i < PERSONS.length - 1) {
                          e.preventDefault();
                          inputRefs.current[i + 1]?.focus();
                        }
                        // Last field: let form submit naturally
                      }
                    }}
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
        </div>

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
