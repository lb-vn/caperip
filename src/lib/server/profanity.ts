import en from "naughty-words/en.json";

const MIN_LENGTH = 4;

const BAD_WORDS: string[] = [
  ...new Set(
    en
      .map((w) => w.toUpperCase())
      .filter((w) => w.length >= MIN_LENGTH && /^[A-Z0-9]+$/.test(w)),
  ),
];

const LEET_MAP: Record<string, string> = {
  "0": "O",
  "1": "I",
  "3": "E",
  "4": "A",
  "5": "S",
  "7": "T",
  "8": "B",
};

function normalizeForCheck(code: string): string {
  return code
    .toUpperCase()
    .split("")
    .map((c) => LEET_MAP[c] ?? c)
    .join("");
}

export function isProfaneCode(code: string): boolean {
  const normalized = normalizeForCheck(code);
  return BAD_WORDS.some((w) => normalized.includes(w));
}
