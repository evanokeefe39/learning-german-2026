"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getChapters, nouns, verbs } from "@/lib/data";
import { getWrongWordCount, getAllHighScores } from "@/lib/storage";

export default function Home() {
  const chapters = getChapters();
  const [wrongCounts, setWrongCounts] = useState<Record<string, number>>({});
  const [topScores, setTopScores] = useState<Record<string, number>>({});

  useEffect(() => {
    setWrongCounts({
      nouns: getWrongWordCount("nouns"),
      verbs: getWrongWordCount("verbs"),
      flashcards: getWrongWordCount("flashcards"),
    });

    const all = getAllHighScores();
    const best: Record<string, number> = {};
    for (const [key, score] of Object.entries(all)) {
      const mode = key.split("|")[0];
      if (best[mode] === undefined || score > best[mode]) {
        best[mode] = score;
      }
    }
    setTopScores(best);
  }, []);

  const modes = [
    {
      title: "Noun Gender Test",
      description: "der, die, or das? Pick the correct article for each noun.",
      href: "/test/nouns",
      count: nouns.length,
      label: "nouns",
      mode: "nouns",
    },
    {
      title: "Verb Conjugation Grid",
      description: "Fill in all six conjugation forms for each verb.",
      href: "/test/verbs",
      count: verbs.length,
      label: "verbs",
      mode: "verbs",
    },
    {
      title: "Flashcard Mode",
      description: "Read a hint, type the German word with its article.",
      href: "/test/flashcards",
      count: nouns.length,
      label: "flashcards",
      mode: "flashcards",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Choose a Test Mode</h1>
        <p className="mt-1 text-gray-600">
          Chapters available: {chapters.join(", ")}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {modes.map((mode) => (
          <Link
            key={mode.href}
            href={mode.href}
            className="flex flex-col rounded-xl border bg-white p-5 shadow-sm active:bg-gray-50 sm:p-6 sm:hover:shadow-md"
          >
            <h2 className="text-base font-semibold sm:text-lg">{mode.title}</h2>
            <p className="mt-1.5 text-sm text-gray-600">{mode.description}</p>
            <div className="mt-auto pt-3 flex flex-wrap items-center gap-3 text-xs text-gray-400">
              <span>{mode.count} {mode.label}</span>
              {wrongCounts[mode.mode] > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-700">
                  {wrongCounts[mode.mode]} to practice
                </span>
              )}
              {topScores[mode.mode] !== undefined && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">
                  Best: {topScores[mode.mode]}%
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
