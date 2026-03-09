import nounsData from "../../data/nouns.json";
import verbsData from "../../data/verbs.json";

export type Noun = {
  chapter: number;
  german: string;
  article: "der" | "die" | "das";
  english: string;
  category: string;
  hint: string;
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
};

export const nouns: Noun[] = nounsData as Noun[];
export const verbs: Verb[] = verbsData as Verb[];

export function getNounsByChapter(chapter?: number): Noun[] {
  if (!chapter) return nouns;
  return nouns.filter((n) => n.chapter === chapter);
}

export function getVerbsByChapter(chapter?: number): Verb[] {
  if (!chapter) return verbs;
  return verbs.filter((v) => v.chapter === chapter);
}

export function getCategories(): string[] {
  return [...new Set(nouns.map((n) => n.category))];
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
