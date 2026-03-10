"use client";

import { PerfektTest } from "@/components/perfekt-test";
import Link from "next/link";

export default function PerfektPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <Link href="/" className="text-sm text-blue-600 active:text-blue-800">
          &larr; Back
        </Link>
        <h1 className="mt-1 text-xl font-bold sm:text-2xl">
          Perfekt (Past Tense)
        </h1>
      </div>
      <PerfektTest />
    </div>
  );
}
