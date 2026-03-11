type Mode = "nouns" | "verbs" | "flashcards" | "perfekt" | "praeteritum";

// --- Wrong Words ---

function wrongKey(mode: Mode): string {
  return `wrong:${mode}`;
}

function getWrongSet(mode: Mode): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(wrongKey(mode));
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveWrongSet(mode: Mode, set: Set<string>) {
  localStorage.setItem(wrongKey(mode), JSON.stringify([...set]));
}

export function addWrongWord(mode: Mode, identifier: string) {
  const set = getWrongSet(mode);
  set.add(identifier);
  saveWrongSet(mode, set);
}

export function removeWrongWord(mode: Mode, identifier: string) {
  const set = getWrongSet(mode);
  set.delete(identifier);
  saveWrongSet(mode, set);
}

export function getWrongWords(mode: Mode): string[] {
  return [...getWrongSet(mode)];
}

export function getWrongWordCount(mode: Mode): number {
  return getWrongSet(mode).size;
}

export function clearWrongWords(mode: Mode) {
  localStorage.removeItem(wrongKey(mode));
}

// --- High Scores ---

const HS_KEY = "highscores";

type HighScores = Record<string, number>;

function loadHighScores(): HighScores {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(HS_KEY);
    return raw ? (JSON.parse(raw) as HighScores) : {};
  } catch {
    return {};
  }
}

function persistHighScores(scores: HighScores) {
  localStorage.setItem(HS_KEY, JSON.stringify(scores));
}

export function buildConfigKey(
  mode: string,
  chapter?: number,
  category?: string,
  difficulty?: string
): string {
  return `${mode}|${chapter ?? "all"}|${category ?? "all"}|${difficulty ?? "all"}`;
}

export function getHighScore(configKey: string): number | null {
  const scores = loadHighScores();
  return configKey in scores ? scores[configKey] : null;
}

export function saveHighScore(configKey: string, percentage: number) {
  const scores = loadHighScores();
  const existing = scores[configKey];
  if (existing === undefined || percentage > existing) {
    scores[configKey] = percentage;
    persistHighScores(scores);
  }
}

export function getAllHighScores(): HighScores {
  return loadHighScores();
}

// --- Attempt Records (Personal Leaderboard) ---

export interface AttemptRecord {
  mode: string;
  chapter: number | null;
  category: string | null;
  difficulty: string | null;
  correct: number;
  total: number;
  percentage: number;
  timestamp: number;
}

const ATTEMPTS_KEY = "attempts";
const MAX_ATTEMPTS = 200;

export function saveAttempt(record: AttemptRecord) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(ATTEMPTS_KEY);
    const attempts: AttemptRecord[] = raw ? JSON.parse(raw) : [];
    attempts.push(record);
    if (attempts.length > MAX_ATTEMPTS) {
      attempts.splice(0, attempts.length - MAX_ATTEMPTS);
    }
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
  } catch {}
}

export function getAttempts(): AttemptRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ATTEMPTS_KEY);
    return raw ? (JSON.parse(raw) as AttemptRecord[]) : [];
  } catch {
    return [];
  }
}

export function getLeaderboard(mode?: string, limit = 3): AttemptRecord[] {
  let attempts = getAttempts();
  if (mode) {
    attempts = attempts.filter((a) => a.mode === mode);
  }
  attempts.sort((a, b) => b.total - a.total || b.percentage - a.percentage);
  return attempts.slice(0, limit);
}
