"use client";

import { NounTest } from "@/components/noun-test";
import Link from "next/link";

export default function NounsPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <Link href="/" className="text-sm text-blue-600 active:text-blue-800">
          &larr; Back
        </Link>
        <h1 className="mt-1 text-xl font-bold sm:text-2xl">Noun Gender Test</h1>
      </div>
      <NounTest />
    </div>
  );
}
