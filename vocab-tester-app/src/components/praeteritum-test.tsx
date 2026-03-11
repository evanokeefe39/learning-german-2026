"use client";

import { useState, useCallback, useEffect, useRef, FormEvent } from "react";
import {
  PraeteritumEntry,
  praeteritumEntries,
  perfektEntries,
  PerfektEntry,
  shuffle,
} from "@/lib/data";
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
type Person = (typeof PERSONS)[number];

const HABEN_PRESENT: Record<Person, string> = {
  ich: "habe", du: "hast", "er/sie/es": "hat",
  wir: "haben", ihr: "habt", "sie/Sie": "haben",
};
const SEIN_PRESENT: Record<Person, string> = {
  ich: "bin", du: "bist", "er/sie/es": "ist",
  wir: "sind", ihr: "seid", "sie/Sie": "sind",
};

type FillQuestion = {
  type: "fill";
  verb: string;
  english?: string;
  person: Person;
  tense: "perfekt" | "präteritum";
  answer: string;
};

type IdentifyQuestion = {
  type: "identify";
  sentence: string;
  verb: string;
  answer: "perfekt" | "präteritum";
};

type Question = FillQuestion | IdentifyQuestion;

function buildQuestions(): Question[] {
  const questions: Question[] = [];

  // Fill-in-the-blank: Präteritum (person × verb)
  for (const entry of praeteritumEntries) {
    for (const person of PERSONS) {
      questions.push({
        type: "fill",
        verb: entry.infinitive,
        english: entry.english,
        person,
        tense: "präteritum",
        answer: entry.conjugation[person],
      });
    }
  }

  // Fill-in-the-blank: Perfekt (person × verb) — pick a random person per verb
  for (const entry of perfektEntries) {
    const person = PERSONS[Math.floor(Math.random() * PERSONS.length)];
    const auxTable = entry.auxiliary === "haben" ? HABEN_PRESENT : SEIN_PRESENT;
    questions.push({
      type: "fill",
      verb: entry.infinitive,
      person,
      tense: "perfekt",
      answer: `${auxTable[person]} ${entry.partizipII}`,
    });
  }

  // Identify the tense: generate from both datasets
  // Präteritum examples
  for (const entry of praeteritumEntries) {
    const person = PERSONS[Math.floor(Math.random() * PERSONS.length)];
    questions.push({
      type: "identify",
      sentence: `${person} ${entry.conjugation[person]}`,
      verb: entry.infinitive,
      answer: "präteritum",
    });
  }
  // Perfekt examples
  for (const entry of perfektEntries) {
    const person = PERSONS[Math.floor(Math.random() * PERSONS.length)];
    const auxTable = entry.auxiliary === "haben" ? HABEN_PRESENT : SEIN_PRESENT;
    questions.push({
      type: "identify",
      sentence: `${person} ${auxTable[person]} ${entry.partizipII}`,
      verb: entry.infinitive,
      answer: "perfekt",
    });
  }

  return shuffle(questions);
}

export function PraeteritumTest() {
  const [mistakesOnly, setMistakesOnly] = useState(false);
  const [items, setItems] = useState<Question[]>(() => buildQuestions());
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [input, setInput] = useState("");
  const [picked, setPicked] = useState<"perfekt" | "präteritum" | null>(null);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [finished, setFinished] = useState(false);
  const [wrongCount, setWrongCount] = useState(0);

  useEffect(() => {
    setWrongCount(getWrongWordCount("praeteritum"));
  }, []);

  const stateRef = useRef({ correct, answered, finished, mistakesOnly });
  useEffect(() => {
    stateRef.current = { correct, answered, finished, mistakesOnly };
  });
  const savedRef = useRef(false);
  const pausedProgress = useRef<{ correct: number; answered: number } | null>(null);
  const saveOnLeave = useCallback(() => {
    if (savedRef.current) return;
    const s = stateRef.current;
    const progress = s.mistakesOnly
      ? pausedProgress.current
      : s.answered > 0 && !s.finished
        ? { correct: s.correct, answered: s.answered }
        : null;
    if (!progress) return;
    savedRef.current = true;
    const pct = Math.round((progress.correct / progress.answered) * 100);
    saveHighScore(buildConfigKey("praeteritum"), pct);
    saveAttempt({
      mode: "praeteritum",
      chapter: null,
      category: null,
      difficulty: null,
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

  const filterItems = useCallback((mistakes?: boolean) => {
    let questions = buildQuestions();
    if (mistakes) {
      const wrong = new Set(getWrongWords("praeteritum"));
      questions = questions.filter((q) => wrong.has(q.verb));
    }
    return questions;
  }, []);

  const restart = useCallback(
    (mistakes?: boolean) => {
      const m = mistakes ?? mistakesOnly;
      if (m && !mistakesOnly && answered > 0 && !finished) {
        pausedProgress.current = { correct, answered };
      } else if (!m) {
        pausedProgress.current = null;
        savedRef.current = false;
      }
      setMistakesOnly(m);
      setItems(filterItems(m));
      setIndex(0);
      setCorrect(0);
      setAnswered(0);
      setInput("");
      setPicked(null);
      setResult(null);
      setFinished(false);
      setWrongCount(getWrongWordCount("praeteritum"));
    },
    [filterItems, mistakesOnly, answered, correct, finished]
  );

  const current = items[index];

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (result) return;

    let isCorrect = false;
    if (current.type === "fill") {
      isCorrect = input.toLowerCase().trim() === current.answer.toLowerCase().trim();
    } else {
      if (!picked) return;
      isCorrect = picked === current.answer;
    }

    setResult(isCorrect ? "correct" : "wrong");
    setAnswered((a) => a + 1);
    if (isCorrect) {
      setCorrect((c) => c + 1);
      removeWrongWord("praeteritum", current.verb);
    } else {
      addWrongWord("praeteritum", current.verb);
    }
    setWrongCount(getWrongWordCount("praeteritum"));
  };

  const next = () => {
    if (index + 1 >= items.length) {
      if (mistakesOnly) {
        const refreshed = filterItems(true);
        if (refreshed.length > 0) {
          setItems(refreshed);
          setIndex(0);
          setInput("");
          setPicked(null);
          setResult(null);
          setWrongCount(getWrongWordCount("praeteritum"));
          return;
        }
      }
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
      setInput("");
      setPicked(null);
      setResult(null);
    }
  };

  const configKey = buildConfigKey("praeteritum");

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={mistakesOnly}
              onChange={(e) => restart(e.target.checked)}
              className="h-4 w-4"
            />
            Practice mistakes{wrongCount > 0 ? ` (${wrongCount})` : ""}
          </label>
        </div>
        <p>
          {mistakesOnly
            ? "No mistakes to practice!"
            : "No verbs found."}
        </p>
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
              onClick={() => restart(false)}
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
      mode: "praeteritum",
      chapter: null,
      category: null,
      difficulty: null,
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
          {answered > 0 ? `${pct}%` : ""}
        </p>
        {isNewBest && pct > 0 && (
          <p className="text-lg font-semibold text-amber-500">
            New high score!
          </p>
        )}
        {best !== null && !isNewBest && (
          <p className="text-sm text-gray-500">Best: {best}%</p>
        )}
        <button
          onClick={() => restart()}
          className="w-full rounded-xl bg-blue-600 py-3 text-lg font-medium text-white active:bg-blue-700 sm:w-auto sm:px-8"
        >
          Try Again
        </button>
      </div>
    );
  }

  const tenseBadgeColor = current.type === "fill"
    ? current.tense === "perfekt"
      ? "bg-purple-100 text-purple-800"
      : "bg-orange-100 text-orange-800"
    : "bg-blue-100 text-blue-800";

  const tenseBadgeText = current.type === "fill"
    ? current.tense === "perfekt" ? "Perfekt" : "Präteritum"
    : "Identify the tense";

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={mistakesOnly}
            onChange={(e) => restart(e.target.checked)}
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
        {current.type === "fill" ? (
          <>
            <div className="text-center">
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${tenseBadgeColor}`}>
                {tenseBadgeText}
              </span>
              <p className="mt-3 text-3xl font-bold sm:text-4xl">
                {current.verb}
              </p>
              {current.english && (
                <p className="mt-1 text-base text-gray-600">{current.english}</p>
              )}
            </div>

            <form onSubmit={submit} className="mt-6">
              <div className="flex items-center justify-center gap-3">
                <label className="text-lg font-medium text-gray-700">
                  {current.person}
                </label>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={!!result}
                  className={`w-48 rounded-lg border px-3 py-2.5 text-base sm:w-64 ${
                    result === "correct"
                      ? "border-green-500 bg-green-50"
                      : result === "wrong"
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                  }`}
                  placeholder={current.tense === "perfekt" ? "habe/bin + ..." : "..."}
                  autoComplete="off"
                  autoCapitalize="off"
                  autoFocus
                />
                {result === "wrong" && (
                  <span className="text-sm font-medium text-red-600">
                    {current.answer}
                  </span>
                )}
                {result === "correct" && (
                  <span className="text-sm text-green-600">&#10003;</span>
                )}
              </div>

              {!result && (
                <div className="mt-4 text-center">
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-blue-600 py-3 text-lg font-medium text-white active:bg-blue-700 sm:w-auto sm:px-8"
                  >
                    Check
                  </button>
                </div>
              )}
            </form>
          </>
        ) : (
          <>
            <div className="text-center">
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${tenseBadgeColor}`}>
                {tenseBadgeText}
              </span>
              <p className="mt-4 text-3xl font-bold sm:text-4xl">
                {current.sentence}
              </p>
              <p className="mt-2 text-base text-gray-500">({current.verb})</p>
            </div>

            <form onSubmit={submit} className="mt-6">
              <div className="flex justify-center gap-3">
                {(["perfekt", "präteritum"] as const).map((tense) => (
                  <button
                    key={tense}
                    type="button"
                    disabled={!!result}
                    onClick={() => setPicked(tense)}
                    className={`rounded-xl border-2 px-6 py-3 text-lg font-medium transition-colors ${
                      result
                        ? tense === current.answer
                          ? "border-green-500 bg-green-50 text-green-700"
                          : tense === picked && result === "wrong"
                            ? "border-red-500 bg-red-50 text-red-700"
                            : "border-gray-200 text-gray-400"
                        : picked === tense
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-300 text-gray-700"
                    }`}
                  >
                    {tense === "perfekt" ? "Perfekt" : "Präteritum"}
                  </button>
                ))}
              </div>

              {!result && (
                <div className="mt-4 text-center">
                  <button
                    type="submit"
                    disabled={!picked}
                    className="w-full rounded-xl bg-blue-600 py-3 text-lg font-medium text-white active:bg-blue-700 disabled:bg-gray-300 sm:w-auto sm:px-8"
                  >
                    Check
                  </button>
                </div>
              )}
            </form>
          </>
        )}

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
