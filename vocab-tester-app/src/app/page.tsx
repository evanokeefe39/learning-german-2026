"use client";

import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { getChapters, nouns, verbs, perfektEntries, praeteritumEntries } from "@/lib/data";
import {
  getWrongWordCount,
  getLeaderboard,
  AttemptRecord,
  getMasteredWordCount,
} from "@/lib/storage";

export default function Home() {
  const chapters = getChapters();
  const [wrongCounts, setWrongCounts] = useState<Record<string, number>>({});
  const [masteredCounts, setMasteredCounts] = useState<Record<string, number>>({});
  const [topByMode, setTopByMode] = useState<Record<string, AttemptRecord[]>>({});
  const refreshCounts = useCallback(() => {
    setWrongCounts({
      nouns: getWrongWordCount("nouns"),
      verbs: getWrongWordCount("verbs"),
      flashcards: getWrongWordCount("flashcards"),
      perfekt: getWrongWordCount("perfekt"),
      praeteritum: getWrongWordCount("praeteritum"),
    });
    setMasteredCounts({
      nouns: getMasteredWordCount("nouns"),
      verbs: getMasteredWordCount("verbs"),
      flashcards: getMasteredWordCount("flashcards"),
      perfekt: getMasteredWordCount("perfekt"),
    });
  }, []);

  const refreshLeaderboard = useCallback(() => {
    const modes = ["nouns", "verbs", "perfekt", "praeteritum", "flashcards"];
    const top: Record<string, AttemptRecord[]> = {};
    for (const m of modes) {
      const entries = getLeaderboard(m, 3);
      if (entries.length > 0) top[m] = entries;
    }
    setTopByMode(top);
  }, []);

  useEffect(() => {
    refreshCounts();
    refreshLeaderboard();
  }, [refreshCounts, refreshLeaderboard]);

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
      title: "Perfekt (Past Tense)",
      description: "Pick haben or sein and type the Partizip II for each verb.",
      href: "/test/perfekt",
      count: perfektEntries.length,
      label: "verbs",
      mode: "perfekt",
    },
    // Past Tense Mix (Perfekt & Präteritum combined) — hidden while rethinking approach
    // {
    //   title: "Past Tense Mix",
    //   description: "Fill in Perfekt and Präteritum forms, and identify which tense is which.",
    //   href: "/test/praeteritum",
    //   count: praeteritumEntries.length * 6 + perfektEntries.length * 2,
    //   label: "questions",
    //   mode: "praeteritum",
    // },
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
            <div className="mt-auto pt-3 space-y-1.5">
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                <span>{mode.count} {mode.label}</span>
                {wrongCounts[mode.mode] > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-yellow-700">
                    <TriangleAlert className="h-3 w-3" />
                    {wrongCounts[mode.mode]} to practice
                  </span>
                )}
                {masteredCounts[mode.mode] > 0 && (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-green-700">
                    {masteredCounts[mode.mode]} mastered
                  </span>
                )}
              </div>
              {topByMode[mode.mode] && topByMode[mode.mode].length > 0 && (
                <div className="space-y-0.5">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Best attempts</p>
                  {topByMode[mode.mode].map((a, i) => {
                    const diffColor = a.difficulty === "easy"
                      ? "text-green-600"
                      : a.difficulty === "medium"
                        ? "text-orange-500"
                        : a.difficulty === "hard"
                          ? "text-red-600"
                          : "text-gray-400";
                    return (
                      <p key={i} className="text-xs text-gray-500">
                        {a.correct}/{a.total} ({a.percentage}%)
                        {a.chapter !== null && (
                          <span className="ml-1 text-gray-400">Ch.{a.chapter}</span>
                        )}
                        {a.category && (
                          <span className="ml-1 text-gray-400">{a.category}</span>
                        )}
                        {a.difficulty && (
                          <span className={`ml-1 ${diffColor}`}>{a.difficulty}</span>
                        )}
                      </p>
                    );
                  })}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
