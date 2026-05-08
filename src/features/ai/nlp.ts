import { clip, paragraphs, splitSentences, words } from "../../lib/text/text";
import type { Citation, DocumentRecord, QuestionAnswer, RewriteStyle } from "../../shared/types";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "has",
  "have",
  "i",
  "in",
  "is",
  "it",
  "its",
  "of",
  "on",
  "or",
  "that",
  "the",
  "their",
  "this",
  "to",
  "was",
  "we",
  "with",
  "you",
  "your"
]);

function meaningfulWords(input: string): string[] {
  return words(input).filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

function frequencies(input: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const word of meaningfulWords(input)) {
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return counts;
}

function sentenceScore(sentence: string, corpusCounts: Map<string, number>, index: number): number {
  const sentenceWords = meaningfulWords(sentence);
  if (sentenceWords.length === 0) {
    return 0;
  }

  const lexicalScore = sentenceWords.reduce(
    (score, word) => score + (corpusCounts.get(word) ?? 0),
    0
  );
  const positionBoost = index < 2 ? 1.35 : 1;
  const lengthPenalty = sentenceWords.length > 36 ? 0.75 : 1;
  return (lexicalScore / Math.sqrt(sentenceWords.length)) * positionBoost * lengthPenalty;
}

export function summarizeDocuments(documents: DocumentRecord[], maxSentences = 5): string {
  if (documents.length === 0) {
    return "Import or load documents first, then run a summary.";
  }

  const corpus = documents.map((document) => `${document.title}\n${document.content}`).join("\n\n");
  const counts = frequencies(corpus);
  const candidates = documents.flatMap((document) =>
    splitSentences(document.content).map((sentence, index) => ({
      document,
      sentence,
      index,
      score: sentenceScore(sentence, counts, index)
    }))
  );

  const selected = candidates
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences)
    .sort((a, b) => a.document.title.localeCompare(b.document.title) || a.index - b.index);

  if (selected.length === 0) {
    return clip(corpus, 700);
  }

  return selected.map((candidate) => `- ${candidate.sentence}`).join("\n");
}

const replacements: Record<RewriteStyle, Array<[RegExp, string]>> = {
  clear: [
    [/\bin order to\b/gi, "to"],
    [/\bdue to the fact that\b/gi, "because"],
    [/\bat this point in time\b/gi, "now"],
    [/\butilize\b/gi, "use"],
    [/\bfacilitate\b/gi, "help"]
  ],
  short: [
    [/\bvery\b/gi, ""],
    [/\breally\b/gi, ""],
    [/\bin order to\b/gi, "to"],
    [/\bthat is to say\b/gi, ""],
    [/\bthe fact that\b/gi, ""]
  ],
  polished: [
    [/\bcan't\b/gi, "cannot"],
    [/\bwon't\b/gi, "will not"],
    [/\bwe need to\b/gi, "the next step is to"],
    [/\bthing\b/gi, "item"],
    [/\bstuff\b/gi, "materials"]
  ]
};

export function rewriteText(input: string, style: RewriteStyle): string {
  const sentences = splitSentences(input);
  if (sentences.length === 0) {
    return "Select or write text first, then run a rewrite.";
  }

  const transformed = sentences
    .map((sentence) =>
      replacements[style].reduce(
        (current, [pattern, replacement]) => current.replace(pattern, replacement),
        sentence
      )
    )
    .map((sentence) => sentence.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  if (style === "short") {
    return transformed
      .filter((sentence) => meaningfulWords(sentence).length > 3)
      .map((sentence) => sentence.replace(/,\s*which\s+/gi, " and "))
      .join(" ");
  }

  if (style === "polished") {
    return transformed
      .map((sentence) => sentence.charAt(0).toUpperCase() + sentence.slice(1))
      .join(" ")
      .replace(/\s+/g, " ");
  }

  return transformed.join(" ");
}

function scorePassage(questionTerms: Set<string>, passage: string): number {
  const passageTerms = meaningfulWords(passage);
  if (passageTerms.length === 0) {
    return 0;
  }

  const overlap = passageTerms.filter((term) => questionTerms.has(term)).length;
  const density = overlap / Math.sqrt(passageTerms.length);
  const exactPhraseBonus = Array.from(questionTerms).some((term) =>
    passage.toLowerCase().includes(term)
  )
    ? 0.4
    : 0;
  return density + exactPhraseBonus;
}

export function answerQuestion(
  question: string,
  documents: DocumentRecord[],
  limit = 3
): QuestionAnswer {
  const questionTerms = new Set(meaningfulWords(question));
  if (documents.length === 0) {
    return {
      answer: "Import or load documents first, then ask a question.",
      citations: []
    };
  }

  if (questionTerms.size === 0) {
    return {
      answer: "Ask a more specific question so the local index has terms to match.",
      citations: []
    };
  }

  const citations: Citation[] = documents
    .flatMap((document) => {
      const passages = paragraphs(document.content);
      const units = passages.length > 0 ? passages : splitSentences(document.content);
      return units.map((passage) => ({
        documentId: document.id,
        title: document.title,
        excerpt: clip(passage, 260),
        score: scorePassage(questionTerms, passage)
      }));
    })
    .filter((citation) => citation.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  if (citations.length === 0) {
    return {
      answer: "I could not find a strong local match in the imported documents.",
      citations: []
    };
  }

  return {
    answer: citations
      .map((citation, index) => `${index + 1}. ${citation.title}: ${citation.excerpt}`)
      .join("\n\n"),
    citations
  };
}
