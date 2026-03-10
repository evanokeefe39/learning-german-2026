type Mode = "nouns" | "verbs" | "flashcards";

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
