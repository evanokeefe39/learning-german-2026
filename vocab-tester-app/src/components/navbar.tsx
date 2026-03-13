"use client";

import { Settings, X, Minus, Plus, RotateCcw } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  getMasteryThreshold,
  setMasteryThreshold,
  clearAllMastery,
  clearAttempts,
  clearAllWrongWords,
  clearAllData,
} from "@/lib/storage";

function SettingsRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {description && (
          <p className="text-xs text-gray-400">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function ResetButton({
  onConfirm,
}: {
  onConfirm: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startConfirm = () => {
    setConfirming(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setConfirming(false), 5000);
  };

  const doConfirm = () => {
    onConfirm();
    setConfirming(false);
    if (timer.current) clearTimeout(timer.current);
  };

  const cancel = () => {
    setConfirming(false);
    if (timer.current) clearTimeout(timer.current);
  };

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={cancel}
          className="rounded px-2 py-1 text-xs font-medium text-gray-500 active:bg-gray-200"
        >
          Cancel
        </button>
        <button
          onClick={doConfirm}
          className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white active:bg-red-700"
        >
          Confirm
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={startConfirm}
      className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 active:bg-red-50"
    >
      <RotateCcw className="h-3 w-3" />
      Reset
    </button>
  );
}

function SettingsPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [threshold, setThreshold] = useState(3);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setThreshold(getMasteryThreshold());
  }, []);

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      document.body.style.overflow = "hidden";
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 300);
      document.body.style.overflow = "";
      return () => clearTimeout(t);
    }
  }, [open]);

  const handleThresholdChange = (delta: number) => {
    const clamped = Math.max(1, Math.min(20, threshold + delta));
    setThreshold(clamped);
    setMasteryThreshold(clamped);
  };

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Drawer (mobile) / Centered panel (desktop) */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white shadow-xl transition-transform duration-300 ease-out sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-[400px] sm:max-h-[80vh] sm:-translate-x-1/2 sm:rounded-xl sm:transition-all ${
          visible
            ? "translate-y-0 sm:-translate-y-1/2 sm:opacity-100"
            : "translate-y-full sm:-translate-y-[calc(50%-8px)] sm:opacity-0"
        }`}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-2 pt-4 sm:pt-5">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 active:bg-gray-100"
            aria-label="Close settings"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Known words threshold */}
        <SettingsRow
          label="Known words"
          description={`Word is known after ${threshold} correct answer${threshold !== 1 ? "s" : ""}`}
        >
          <div className="flex items-center rounded-lg border">
            <button
              onClick={() => handleThresholdChange(-1)}
              disabled={threshold <= 1}
              className="px-3 py-2 text-gray-600 disabled:text-gray-300 active:bg-gray-100"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center text-sm font-semibold">
              {threshold}
            </span>
            <button
              onClick={() => handleThresholdChange(1)}
              disabled={threshold >= 20}
              className="px-3 py-2 text-gray-600 disabled:text-gray-300 active:bg-gray-100"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </SettingsRow>

        <div className="mx-5 my-2 border-t" />

        {/* Reset rows */}
        <SettingsRow label="Known words" description="Reset all known word progress">
          <ResetButton onConfirm={clearAllMastery} />
        </SettingsRow>

        <SettingsRow label="Attempt history" description="Reset best attempts leaderboard">
          <ResetButton onConfirm={clearAttempts} />
        </SettingsRow>

        <SettingsRow label="Wrong words" description="Clear all wrong word lists">
          <ResetButton onConfirm={clearAllWrongWords} />
        </SettingsRow>

        <div className="mx-5 my-2 border-t" />

        <SettingsRow label="All data" description="Reset everything to defaults">
          <ResetButton
            onConfirm={() => {
              clearAllData();
              setThreshold(3);
            }}
          />
        </SettingsRow>

        <div className="h-5" />
      </div>
    </>,
    document.body
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 sm:py-4">
          <a href="/" className="text-lg font-bold sm:text-xl">
            German Vocab Tester
          </a>
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 active:bg-gray-200"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
            <span className="hidden text-sm text-gray-500 sm:inline">
              Settings
            </span>
          </button>
        </div>
      </header>

      <SettingsPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}
