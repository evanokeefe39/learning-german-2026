"use client";

import { VerbGrid } from "@/components/verb-grid";
import Link from "next/link";

export default function VerbsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Verb Conjugation Grid</h1>
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          Back to home
        </Link>
      </div>
      <VerbGrid />
    </div>
  );
}
