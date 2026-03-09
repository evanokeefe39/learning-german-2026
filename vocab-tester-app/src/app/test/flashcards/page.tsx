"use client";

import { Flashcard } from "@/components/flashcard";
import Link from "next/link";

export default function FlashcardsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Flashcard Mode</h1>
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          Back to home
        </Link>
      </div>
      <Flashcard />
    </div>
  );
}
