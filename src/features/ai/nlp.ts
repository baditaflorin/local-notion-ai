import { clip, paragraphs, splitSentences, stableHash, words } from "../../lib/text/text";
import type {
  Citation,
  DocumentRecord,
  QuestionAnswer,
  RewriteResult,
  RewriteStyle,
  SummaryResult
} from "../../shared/types";

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

function normalizeWord(word: string): string {
  if (word.length > 5 && word.endsWith("ing")) {
    return word.slice(0, -3);
  }
  if (word.length > 4 && word.endsWith("ed")) {
    return word.slice(0, -2);
  }
  if (word.length > 4 && word.endsWith("es")) {
    return word.slice(0, -2);
  }
  if (word.length > 3 && word.endsWith("s")) {
    return word.slice(0, -1);
  }
  return word;
}

function meaningfulWords(input: string): string[] {
  return words(input)
    .map(normalizeWord)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

function confidenceLabel(score: number): "high" | "medium" | "low" {
  if (score >= 0.8) {
    return "high";
  }
  if (score >= 0.55) {
    return "medium";
  }
  return "low";
}

function searchText(document: DocumentRecord): string {
  return document.analysis?.normalizedText ?? document.content;
}

function chunkText(
  document: DocumentRecord
): Array<{ label: string; text: string; confidence: number; reason: string }> {
  if (document.analysis?.chunks?.length) {
    return document.analysis.chunks;
  }

  const parts = paragraphs(searchText(document));
  return (parts.length > 0 ? parts : splitSentences(searchText(document))).map((text, index) => ({
    label: `section ${index + 1}`,
    text,
    confidence: 0.6,
    reason: "Fallback paragraph chunk."
  }));
}

function summaryForCsv(document: DocumentRecord): string {
  const lines = searchText(document).split("\n").filter(Boolean);
  const schema = lines[0]?.replace(/^columns \| /, "") ?? "unknown columns";
  const rowCount = lines[1]?.replace(/^row_count \| /, "") ?? "unknown";
  const preview = lines
    .slice(2, 5)
    .map((line) => `- ${line}`)
    .join("\n");
  return [`Table shape: ${schema}.`, `Row count: ${rowCount}.`, preview].filter(Boolean).join("\n");
}

function summaryForTranscript(document: DocumentRecord): string {
  const text = searchText(document);
  const speakers = Array.from(
    new Set(
      Array.from(
        text.matchAll(/^\s*(?:\[?\d{1,2}:\d{2}(?::\d{2})?]?\s*)?([A-Z][A-Za-z .'-]{1,30}):/gm),
        (match) => match[1]
      )
    )
  ).slice(0, 6);
  const actionLines = text
    .split("\n")
    .filter((line) => /\b(action|follow up|next step|owner|todo)\b/i.test(line))
    .slice(0, 4)
    .map((line) => `- ${clip(line, 160)}`);
  return [
    speakers.length ? `Speakers: ${speakers.join(", ")}.` : "Transcript detected.",
    actionLines.length ? "Potential actions:\n" + actionLines.join("\n") : clip(text, 420)
  ]
    .filter(Boolean)
    .join("\n");
}

function summaryForEmail(document: DocumentRecord): string {
  const text = searchText(document);
  const subject = text.match(/^subject:\s+(.+)$/im)?.[1];
  const requests = splitSentences(text)
    .filter((sentence) => /\b(please|could you|can you|need|request)\b/i.test(sentence))
    .slice(0, 3)
    .map((sentence) => `- ${sentence}`);
  return [
    subject ? `Subject: ${subject}.` : "Email thread detected.",
    requests.length ? "Latest requests:\n" + requests.join("\n") : clip(text, 360)
  ]
    .filter(Boolean)
    .join("\n");
}

function summaryForInvoice(document: DocumentRecord): string {
  const fields = document.analysis?.detectedFields ?? [];
  const parts = [
    fields.find((field) => field.key === "id")?.value
      ? `Reference: ${fields.find((field) => field.key === "id")?.value}.`
      : "",
    fields.find((field) => field.key === "date")?.value
      ? `Date: ${fields.find((field) => field.key === "date")?.value}.`
      : "",
    fields.find((field) => field.key === "price")?.value
      ? `Total-like amount: ${fields.find((field) => field.key === "price")?.value}.`
      : ""
  ].filter(Boolean);
  return parts.join(" ") || clip(searchText(document), 360);
}

function frequencies(input: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const word of meaningfulWords(input)) {
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return counts;
}

function genericSummary(document: DocumentRecord, maxSentences = 4): string {
  const corpus = searchText(document);
  const counts = frequencies(corpus);
  const candidates = splitSentences(corpus).map((sentence, index) => {
    const sentenceWords = meaningfulWords(sentence);
    const lexicalScore = sentenceWords.reduce((score, word) => score + (counts.get(word) ?? 0), 0);
    let score = sentenceWords.length > 0 ? lexicalScore / Math.sqrt(sentenceWords.length) : 0;
    if (index < 2) {
      score *= 1.25;
    }
    if (/\b(action item|next step|owner|blocked?|risk)\b/i.test(sentence)) {
      score *= 1.4;
    }
    return { sentence, score, index };
  });

  const selected = candidates
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences)
    .sort((a, b) => a.index - b.index);

  return selected.length > 0
    ? selected.map((item) => `- ${item.sentence}`).join("\n")
    : clip(corpus, 500);
}

export function summarizeDocuments(documents: DocumentRecord[], maxSentences = 5): SummaryResult {
  if (documents.length === 0) {
    return {
      text: "Import or load documents first, then run a summary.",
      confidence: 0.95,
      confidenceLabel: "high",
      explanation:
        "No documents were available, so the app returned an actionable empty-state message."
    };
  }

  if (documents.length === 1) {
    const [document] = documents;
    const text =
      document.analysis?.kind === "csv"
        ? summaryForCsv(document)
        : document.analysis?.kind === "transcript"
          ? summaryForTranscript(document)
          : document.analysis?.kind === "email"
            ? summaryForEmail(document)
            : document.analysis?.kind === "invoice"
              ? summaryForInvoice(document)
              : genericSummary(document, maxSentences);
    const confidence = document.analysis?.kindConfidence ?? 0.62;
    return {
      text,
      confidence,
      confidenceLabel: confidenceLabel(confidence),
      explanation:
        document.analysis?.summaryHint ??
        "The summary used local keyword scoring over normalized document text."
    };
  }

  const joined = documents
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((document) => `${document.title}\n${genericSummary(document, 2)}`)
    .join("\n\n");

  const confidence =
    documents.reduce((sum, document) => sum + (document.analysis?.kindConfidence ?? 0.55), 0) /
    documents.length;

  return {
    text: joined,
    confidence,
    confidenceLabel: confidenceLabel(confidence),
    explanation: "The summary merged deterministic per-document summaries in stable document order."
  };
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

export function rewriteText(
  input: string,
  style: RewriteStyle,
  document?: DocumentRecord
): RewriteResult {
  const baseInput = document?.analysis?.normalizedText ?? input;
  const sentences = splitSentences(baseInput);
  if (sentences.length === 0) {
    return {
      text: "Select or write text first, then run a rewrite.",
      confidence: 0.95,
      confidenceLabel: "high",
      explanation: "No readable text was available for rewriting."
    };
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

  let text = transformed.join(" ");
  if (style === "short") {
    text = transformed
      .filter((sentence) => meaningfulWords(sentence).length > 3)
      .map((sentence) => sentence.replace(/,\s*which\s+/gi, " and "))
      .join(" ");
  } else if (style === "polished") {
    text = transformed
      .map((sentence) => sentence.charAt(0).toUpperCase() + sentence.slice(1))
      .join(" ")
      .replace(/\s+/g, " ");
  }

  const confidence = document?.analysis?.kind === "code" ? 0.34 : 0.72;
  return {
    text,
    confidence,
    confidenceLabel: confidenceLabel(confidence),
    explanation:
      document?.analysis?.kind === "code"
        ? "This rewrite used prose rules on a code-like document, so the result should be reviewed carefully."
        : `Applied the deterministic "${style}" rewrite rules to normalized sentences.`
  };
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
      citations: [],
      confidence: 0.95,
      confidenceLabel: "high",
      explanation:
        "No documents were available, so the app returned an actionable empty-state message."
    };
  }

  if (questionTerms.size === 0) {
    return {
      answer: "Ask a more specific question so the local index has terms to match.",
      citations: [],
      confidence: 0.9,
      confidenceLabel: "high",
      explanation: "The question did not contain enough meaningful terms for local retrieval."
    };
  }

  const citations: Citation[] = documents
    .flatMap((document) =>
      chunkText(document).map((chunk) => ({
        documentId: document.id,
        title: document.title,
        excerpt: clip(chunk.text, 260),
        score: scorePassage(questionTerms, chunk.text),
        kind: document.analysis?.kind,
        chunkLabel: chunk.label,
        confidence: chunk.confidence,
        reason: chunk.reason
      }))
    )
    .filter((citation) => citation.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        stableHash(`${a.documentId}:${a.chunkLabel}`).localeCompare(
          stableHash(`${b.documentId}:${b.chunkLabel}`)
        )
    )
    .slice(0, limit);

  if (citations.length === 0) {
    return {
      answer: "I could not find a strong local match in the imported documents.",
      citations: [],
      confidence: 0.3,
      confidenceLabel: "low",
      explanation:
        "The normalized chunks did not share enough meaningful vocabulary with the question."
    };
  }

  const aggregateConfidence =
    citations.reduce(
      (sum, citation) => sum + Math.min(1, citation.score * 0.55 + citation.confidence * 0.45),
      0
    ) / citations.length;

  return {
    answer: citations
      .map(
        (citation, index) =>
          `${index + 1}. ${citation.title}${citation.chunkLabel ? ` (${citation.chunkLabel})` : ""}: ${citation.excerpt}`
      )
      .join("\n\n"),
    citations,
    confidence: aggregateConfidence,
    confidenceLabel: confidenceLabel(aggregateConfidence),
    explanation:
      "Answers are ranked from deterministic chunk overlap against the normalized local document analysis."
  };
}
