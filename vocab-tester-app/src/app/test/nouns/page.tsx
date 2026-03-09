"use client";

import { NounTest } from "@/components/noun-test";
import Link from "next/link";

export default function NounsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Noun Gender Test</h1>
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          Back to home
        </Link>
      </div>
      <NounTest />
    </div>
  );
}
