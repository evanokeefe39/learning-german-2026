type Mode = "nouns" | "verbs" | "flashcards" | "perfekt" | "praeteritum";

const ALL_MODES: Mode[] = ["nouns", "verbs", "flashcards", "perfekt", "praeteritum"];

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

// --- Mastery Tracking ---

function masteryKey(mode: Mode): string {
  return `mastery:${mode}`;
}

function loadMasteryMap(mode: Mode): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(masteryKey(mode));
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function saveMasteryMap(mode: Mode, map: Record<string, number>) {
  localStorage.setItem(masteryKey(mode), JSON.stringify(map));
}

export function incrementMastery(mode: Mode, identifier: string) {
  const map = loadMasteryMap(mode);
  map[identifier] = (map[identifier] ?? 0) + 1;
  saveMasteryMap(mode, map);
}

export function getMasteredWords(mode: Mode, threshold?: number): Set<string> {
  const t = threshold ?? getMasteryThreshold();
  const map = loadMasteryMap(mode);
  const set = new Set<string>();
  for (const [key, count] of Object.entries(map)) {
    if (count >= t) set.add(key);
  }
  return set;
}

export function getMasteredWordCount(mode: Mode): number {
  return getMasteredWords(mode).size;
}

export function clearMastery(mode: Mode) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(masteryKey(mode));
}

export function clearAllMastery() {
  for (const mode of ALL_MODES) clearMastery(mode);
}

// --- Settings ---

const SETTINGS_KEY = "settings";

interface Settings {
  masteryThreshold: number;
}

function loadSettings(): Settings {
  if (typeof window === "undefined") return { masteryThreshold: 3 };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? (JSON.parse(raw) as Settings) : { masteryThreshold: 3 };
  } catch {
    return { masteryThreshold: 3 };
  }
}

function saveSettings(settings: Settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getMasteryThreshold(): number {
  return loadSettings().masteryThreshold;
}

export function setMasteryThreshold(n: number) {
  const settings = loadSettings();
  settings.masteryThreshold = n;
  saveSettings(settings);
}

// --- Reset Helpers ---

export function clearAttempts() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ATTEMPTS_KEY);
}

export function clearHighScores() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(HS_KEY);
}

export function clearAllWrongWords() {
  for (const mode of ALL_MODES) clearWrongWords(mode);
}

export function clearAllData() {
  clearAllWrongWords();
  clearAllMastery();
  clearAttempts();
  clearHighScores();
  if (typeof window !== "undefined") localStorage.removeItem(SETTINGS_KEY);
}
