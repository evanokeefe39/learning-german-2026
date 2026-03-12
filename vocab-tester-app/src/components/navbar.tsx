"use client";

import { Settings } from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import {
  getMasteryThreshold,
  setMasteryThreshold,
  getMasteredWordCount,
  clearAllMastery,
  clearAttempts,
  clearHighScores,
  clearAllWrongWords,
  clearAllData,
} from "@/lib/storage";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [threshold, setThreshold] = useState(3);
  const [confirmingReset, setConfirmingReset] = useState<string | null>(null);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setThreshold(getMasteryThreshold());
  }, []);

  // close on outside tap
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleThresholdChange = (n: number) => {
    const clamped = Math.max(1, Math.min(20, n));
    setThreshold(clamped);
    setMasteryThreshold(clamped);
  };

  const handleReset = (key: string, action: () => void) => {
    if (confirmingReset === key) {
      action();
      setConfirmingReset(null);
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    } else {
      setConfirmingReset(key);
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      confirmTimer.current = setTimeout(() => setConfirmingReset(null), 3000);
    }
  };

  const resets: [string, string, () => void][] = [
    ["mastery", "Mastered words", clearAllMastery],
    ["attempts", "Attempt history", clearAttempts],
    ["highscores", "High scores", clearHighScores],
    ["wrong", "Wrong words", clearAllWrongWords],
    ["all", "All data", () => { clearAllData(); setThreshold(3); }],
  ];

  return (
    <header className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 sm:py-4">
        <a href="/" className="text-lg font-bold sm:text-xl">
          German Vocab Tester
        </a>
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setOpen(!open)}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 active:bg-gray-200"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border bg-white p-4 shadow-lg space-y-4">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm text-gray-700">Answers to master</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={threshold}
                  onChange={(e) => handleThresholdChange(Number(e.target.value))}
                  className="w-16 rounded border border-gray-300 px-2 py-1 text-sm text-center"
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Reset data</p>
                <div className="flex flex-col gap-1">
                  {resets.map(([key, label, action]) => (
                    <button
                      key={key}
                      onClick={() => handleReset(key, action)}
                      className={`rounded px-2 py-1.5 text-left text-sm ${
                        confirmingReset === key
                          ? "bg-red-100 text-red-700 font-medium"
                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                      }`}
                    >
                      {confirmingReset === key ? `Reset ${label.toLowerCase()}?` : `Reset ${label.toLowerCase()}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
