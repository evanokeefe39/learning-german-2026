import nounsData from "../../data/nouns.json";
import verbsData from "../../data/verbs.json";

export type Difficulty = "easy" | "medium" | "hard";

export type Noun = {
  chapter: number;
  german: string;
  article: "der" | "die" | "das";
  english: string;
  category: string;
  hint: string;
  frequency: number;
  chapterSpread: number;
  difficulty: Difficulty;
};

export type Verb = {
  chapter: number;
  infinitive: string;
  english: string;
  type: "regular" | "irregular" | "modal";
  stemChangePattern: string;
  conjugation: {
    ich: string;
    du: string;
    "er/sie/es": string;
    wir: string;
    ihr: string;
    "sie/Sie": string;
  };
  frequency: number;
  chapterSpread: number;
  difficulty: Difficulty;
};

export const nouns: Noun[] = nounsData as Noun[];
export const verbs: Verb[] = verbsData as Verb[];

export function getNounsByChapter(chapter?: number): Noun[] {
  if (!chapter) return nouns;
  return nouns.filter((n) => n.chapter === chapter);
}

export function getNounsByFilter(chapter?: number, category?: string, difficulty?: Difficulty): Noun[] {
  return nouns.filter((n) => {
    if (chapter && n.chapter !== chapter) return false;
    if (category && n.category !== category) return false;
    if (difficulty && n.difficulty !== difficulty) return false;
    return true;
  });
}

export function getVerbsByFilter(chapter?: number, difficulty?: Difficulty): Verb[] {
  return verbs.filter((v) => {
    if (chapter && v.chapter !== chapter) return false;
    if (difficulty && v.difficulty !== difficulty) return false;
    return true;
  });
}

export function getVerbsByChapter(chapter?: number): Verb[] {
  if (!chapter) return verbs;
  return verbs.filter((v) => v.chapter === chapter);
}

export function getCategories(chapter?: number): string[] {
  const source = chapter ? nouns.filter((n) => n.chapter === chapter) : nouns;
  return [...new Set(source.map((n) => n.category))].sort();
}

export function getChapters(): number[] {
  const chapters = new Set([
    ...nouns.map((n) => n.chapter),
    ...verbs.map((v) => v.chapter),
  ]);
  return [...chapters].sort();
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
