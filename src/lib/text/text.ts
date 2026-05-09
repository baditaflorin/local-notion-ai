const WORD_RE = /[\p{L}\p{N}][\p{L}\p{N}'-]*/gu;

export function words(input: string): string[] {
  return Array.from(input.toLowerCase().matchAll(WORD_RE), (match) =>
    match[0].replace(/^'|'$/g, "")
  );
}

export function countWords(input: string): number {
  return words(input).length;
}

export function normalizeLineEndings(input: string): string {
  return input.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

export function normalizeWhitespace(input: string, preserveParagraphs = false): string {
  const normalized = normalizeLineEndings(input).trim();
  if (!preserveParagraphs) {
    return normalized.replace(/\s+/g, " ");
  }

  return normalized
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function splitSentences(input: string): string[] {
  const normalized = input.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return [];
  }

  const matches = normalized.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
  return (matches ?? [normalized]).map((sentence) => sentence.trim()).filter(Boolean);
}

export function paragraphs(input: string): string[] {
  return input
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function clip(input: string, maxLength: number): string {
  const normalized = input.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  const clipped = normalized.slice(0, maxLength - 1);
  const lastSpace = clipped.lastIndexOf(" ");
  return `${clipped.slice(0, Math.max(24, lastSpace)).trim()}...`;
}

export function titleFromSource(sourceName: string, fallback: string): string {
  const withoutExtension = sourceName.replace(/\.[^.]+$/, "");
  const spaced = withoutExtension.replace(/[-_]+/g, " ").trim();
  return spaced || fallback;
}

export function stableHash(input: string): string {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `h${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
