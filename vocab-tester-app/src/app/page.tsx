"use client";

import Link from "next/link";
import { getChapters, nouns, verbs } from "@/lib/data";

export default function Home() {
  const chapters = getChapters();

  const modes = [
    {
      title: "Noun Gender Test",
      description: "der, die, or das? Pick the correct article for each noun.",
      href: "/test/nouns",
      count: nouns.length,
      label: "nouns",
    },
    {
      title: "Verb Conjugation Grid",
      description:
        "Fill in all six conjugation forms for each verb.",
      href: "/test/verbs",
      count: verbs.length,
      label: "verbs",
    },
    {
      title: "Flashcard Mode",
      description:
        "Read a hint, type the German word with its article.",
      href: "/test/flashcards",
      count: nouns.length,
      label: "flashcards",
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modes.map((mode) => (
          <Link
            key={mode.href}
            href={mode.href}
            className="rounded-lg border bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <h2 className="text-lg font-semibold">{mode.title}</h2>
            <p className="mt-2 text-sm text-gray-600">{mode.description}</p>
            <p className="mt-4 text-xs text-gray-400">
              {mode.count} {mode.label}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
