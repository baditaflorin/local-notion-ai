import {
  clip,
  countWords,
  normalizeLineEndings,
  normalizeWhitespace,
  splitSentences,
  stableHash,
  titleFromSource
} from "../../lib/text/text";
import type {
  AnalysisChunk,
  AnalysisWarning,
  ConfidenceLevel,
  DetectedField,
  DocumentAnalysis,
  DocumentKind,
  DocumentRecord
} from "../../shared/types";

type CsvParseResult = {
  rows: string[][];
  delimiter: "," | ";" | "\t";
};

function toConfidenceLabel(value: number): ConfidenceLevel {
  if (value >= 0.8) {
    return "high";
  }
  if (value >= 0.55) {
    return "medium";
  }
  return "low";
}

function decodeEntities(input: string): string {
  return input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function normalizeEncodingArtifacts(input: string): { text: string; changed: boolean } {
  const normalized = input
    .replace(/^\uFEFF/, "")
    .replace(/\u00A0/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  return { text: normalized, changed: normalized !== input };
}

function stripMarkdownNoise(input: string): string {
  return input
    .replace(/^```[\s\S]*?^```/gm, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/^>\s*/gm, "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/`([^`]+)`/g, "$1");
}

function extractHtmlText(input: string): string {
  return decodeEntities(
    input
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<(header|footer|nav|aside|svg)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|section|article|li|h1|h2|h3|h4|h5|h6)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  );
}

function looksLikeHtml(input: string, sourceName?: string): boolean {
  return (
    (sourceName?.toLowerCase().endsWith(".html") ?? false) ||
    /<(html|body|article|main|div|p|script|style)[\s>]/i.test(input)
  );
}

function parseCsvRows(input: string): CsvParseResult | null {
  const candidateDelimiters: Array<"," | ";" | "\t"> = [",", ";", "\t"];
  const lines = normalizeLineEndings(input)
    .split("\n")
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .slice(0, 80);

  if (lines.length < 2) {
    return null;
  }

  for (const delimiter of candidateDelimiters) {
    const rows = lines.map((line) => parseCsvLine(line, delimiter));
    const widths = rows.map((row) => row.length);
    const firstWidth = widths[0] ?? 0;
    const consistent =
      firstWidth >= 2 && widths.filter((width) => width === firstWidth).length >= 2;
    if (consistent) {
      return { rows, delimiter };
    }
  }

  return null;
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function looksLikeTranscript(input: string): boolean {
  const transcriptSignals = [
    /^\s*\[?\d{1,2}:\d{2}(?::\d{2})?]?/m,
    /^\s*\[?\d{1,2}:\d{2}(?::\d{2})?]?\s*[A-Z][A-Za-z .'-]{1,30}:\s+/m,
    /^\s*[A-Z][A-Za-z .'-]{1,30}:\s+/m,
    /^\s*Speaker \d+:\s+/im
  ];
  return transcriptSignals.filter((pattern) => pattern.test(input)).length >= 2;
}

function looksLikeEmail(input: string): boolean {
  const emailSignals = [/^from:\s+/im, /^subject:\s+/im, /^to:\s+/im, /^on .+ wrote:$/im, /^>\s+/m];
  return emailSignals.filter((pattern) => pattern.test(input)).length >= 2;
}

function looksLikeInvoice(input: string): boolean {
  const lower = input.toLowerCase();
  const terms = ["invoice", "bill to", "subtotal", "total", "tax", "due date", "invoice #"];
  return terms.filter((term) => lower.includes(term)).length >= 3;
}

function looksLikeLegal(input: string): boolean {
  const lower = input.toLowerCase();
  const terms = [
    "privacy policy",
    "terms of service",
    "data retention",
    "legal basis",
    "controller",
    "personal data"
  ];
  return terms.filter((term) => lower.includes(term)).length >= 2;
}

function looksLikeJson(input: string, sourceName?: string): boolean {
  if (sourceName?.toLowerCase().endsWith(".json")) {
    return true;
  }

  const trimmed = input.trim();
  if (!/^[{[]/.test(trimmed)) {
    return false;
  }

  try {
    JSON.parse(trimmed);
    return true;
  } catch {
    return false;
  }
}

function looksLikeMarkdown(input: string, sourceName?: string): boolean {
  return (
    !!sourceName?.toLowerCase().match(/\.(md|markdown)$/) ||
    (/^#{1,6}\s+/m.test(input) && /(?:^- |\* |\d+\.)/m.test(input))
  );
}

function looksLikeCode(input: string, sourceName?: string): boolean {
  return (
    !!sourceName?.toLowerCase().match(/\.(ts|tsx|js|jsx|py|go|rs|java|sql)$/) ||
    /(?:function\s+\w+|const\s+\w+\s*=|class\s+\w+|import\s+.+from)/.test(input)
  );
}

function inferKind(
  sourceName: string | undefined,
  raw: string
): { kind: DocumentKind; confidence: number; signals: string[] } {
  const signals: string[] = [];
  const csv = parseCsvRows(raw);

  if (looksLikeHtml(raw, sourceName)) {
    signals.push("html-tags");
    return { kind: "html", confidence: 0.92, signals };
  }

  if (csv) {
    signals.push(`csv-${csv.delimiter === "\t" ? "tab" : csv.delimiter}`);
    return { kind: "csv", confidence: 0.9, signals };
  }

  if (looksLikeTranscript(raw)) {
    signals.push("speaker-timestamps");
    return { kind: "transcript", confidence: 0.84, signals };
  }

  if (looksLikeEmail(raw)) {
    signals.push("email-headers");
    return { kind: "email", confidence: 0.83, signals };
  }

  if (looksLikeInvoice(raw)) {
    signals.push("invoice-terms");
    return { kind: "invoice", confidence: 0.79, signals };
  }

  if (looksLikeLegal(raw)) {
    signals.push("legal-terms");
    return { kind: "legal", confidence: 0.76, signals };
  }

  if (looksLikeJson(raw, sourceName)) {
    signals.push("json-shape");
    return { kind: "json", confidence: 0.82, signals };
  }

  if (looksLikeMarkdown(raw, sourceName)) {
    signals.push("markdown-headings");
    return { kind: "markdown", confidence: 0.7, signals };
  }

  if (looksLikeCode(raw, sourceName)) {
    signals.push("code-patterns");
    return { kind: "code", confidence: 0.73, signals };
  }

  return { kind: "note", confidence: 0.52, signals: ["fallback-note"] };
}

function normalizeByKind(
  kind: DocumentKind,
  raw: string
): { text: string; warnings: AnalysisWarning[] } {
  const warnings: AnalysisWarning[] = [];

  if (!raw.trim()) {
    warnings.push({
      code: "empty-content",
      message: "The input was empty after normalization.",
      nextStep: "Import a file with readable text content."
    });
    return { text: "", warnings };
  }

  if (raw.length > 5_000_000) {
    warnings.push({
      code: "large-input",
      message: "This document is large enough that analysis may take longer.",
      nextStep: "Keep the tab open while the local analysis finishes."
    });
  }

  switch (kind) {
    case "html": {
      const text = normalizeWhitespace(extractHtmlText(raw), true);
      warnings.push({
        code: "boilerplate-noise",
        message: "HTML boilerplate was stripped before analysis.",
        nextStep: "Check the extracted text if the page had important sidebar or footer content."
      });
      return { text, warnings };
    }
    case "csv": {
      const parsed = parseCsvRows(raw);
      if (!parsed) {
        warnings.push({
          code: "parse-fallback",
          message: "The table shape was weak, so the app fell back to plain text.",
          nextStep: "Check the delimiter or quoted cells in the source file."
        });
        return { text: normalizeWhitespace(raw, true), warnings };
      }

      const [headerRow, ...rows] = parsed.rows;
      const headers = headerRow.map((cell, index) => cell || `column_${index + 1}`);
      const preview = rows.slice(0, 20).map((row, rowIndex) => {
        const pairs = headers.map((header, index) => `${header}: ${row[index] ?? ""}`.trim());
        return `row ${rowIndex + 1} | ${pairs.join(" | ")}`;
      });
      const text = [
        `columns | ${headers.join(" | ")}`,
        `row_count | ${rows.length}`,
        ...preview
      ].join("\n");
      return { text, warnings };
    }
    case "transcript": {
      const normalizedLines = normalizeLineEndings(raw)
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => line.replace(/^\[(\d{1,2}:\d{2}(?::\d{2})?)\]/, "$1"));
      return { text: normalizedLines.join("\n"), warnings };
    }
    case "email": {
      const lines = normalizeLineEndings(raw).split("\n");
      const kept: string[] = [];
      for (const line of lines) {
        if (/^on .+ wrote:$/i.test(line.trim())) {
          warnings.push({
            code: "quoted-history",
            message: "Quoted reply history was down-weighted during analysis.",
            nextStep: "Open the raw document if you need older thread context."
          });
          break;
        }
        if (/^>/.test(line.trim())) {
          continue;
        }
        kept.push(line);
      }
      return { text: normalizeWhitespace(kept.join("\n"), true), warnings };
    }
    case "markdown":
      return { text: normalizeWhitespace(stripMarkdownNoise(raw), true), warnings };
    case "json": {
      try {
        const parsed = JSON.parse(raw);
        const stable = JSON.stringify(parsed, Object.keys(parsed).sort(), 2);
        return { text: normalizeWhitespace(stable, true), warnings };
      } catch {
        warnings.push({
          code: "truncated-json",
          message: "The JSON looked incomplete, so the app used a text fallback.",
          nextStep: "Validate the JSON source if you expected structured analysis."
        });
        return { text: normalizeWhitespace(raw, true), warnings };
      }
    }
    default:
      return { text: normalizeWhitespace(raw, true), warnings };
  }
}

function detectFields(kind: DocumentKind, normalizedText: string): DetectedField[] {
  const fields: DetectedField[] = [];
  const price = normalizedText.match(/(?:USD|EUR|GBP|\$|€|£)\s?\d[\d,]*(?:\.\d{2})?/);
  const date = normalizedText.match(
    /\b(?:\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|[A-Z][a-z]{2,8}\s+\d{1,2},\s+\d{4})\b/
  );
  const url = normalizedText.match(/\bhttps?:\/\/[^\s)]+/);
  const email = normalizedText.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i);
  const id = normalizedText.match(
    /\b(?:invoice|ticket|case|order|id|ref)[ #:-]*([A-Z0-9-]{4,})\b/i
  );
  const speaker =
    kind === "transcript" ? normalizedText.match(/^\s*([A-Z][A-Za-z .'-]{1,30}):/m) : null;
  const timestamp =
    kind === "transcript" ? normalizedText.match(/\b\d{1,2}:\d{2}(?::\d{2})?\b/) : null;

  if (price) {
    fields.push({
      key: "price",
      type: "price",
      value: price[0],
      confidence: 0.82,
      reason: "Matched a currency and amount pattern."
    });
  }
  if (date) {
    fields.push({
      key: "date",
      type: "date",
      value: date[0],
      confidence: 0.76,
      reason: "Matched a date-like pattern."
    });
  }
  if (url) {
    fields.push({
      key: "url",
      type: "url",
      value: url[0],
      confidence: 0.9,
      reason: "Matched an absolute URL."
    });
  }
  if (email) {
    fields.push({
      key: "email",
      type: "email",
      value: email[0],
      confidence: 0.92,
      reason: "Matched an email address."
    });
  }
  if (id?.[1]) {
    fields.push({
      key: "id",
      type: "id",
      value: id[1],
      confidence: 0.67,
      reason: "Matched an identifier keyword with an ID-like token."
    });
  }
  if (speaker?.[1]) {
    fields.push({
      key: "speaker",
      type: "speaker",
      value: speaker[1],
      confidence: 0.75,
      reason: "Detected a speaker label at the start of transcript lines."
    });
  }
  if (timestamp?.[0]) {
    fields.push({
      key: "timestamp",
      type: "timestamp",
      value: timestamp[0],
      confidence: 0.8,
      reason: "Detected a transcript-style timestamp."
    });
  }

  return fields;
}

function chunksForKind(kind: DocumentKind, normalizedText: string): AnalysisChunk[] {
  const chunkSource =
    kind === "csv"
      ? normalizedText.split("\n").filter(Boolean)
      : normalizeLineEndings(normalizedText)
          .split(/\n{2,}/)
          .map((chunk) => chunk.trim())
          .filter(Boolean);

  const baseChunks = chunkSource.length > 0 ? chunkSource : splitSentences(normalizedText);

  return baseChunks.slice(0, 120).map((text, index) => ({
    id: `chunk-${index + 1}-${stableHash(text).slice(0, 8)}`,
    label:
      kind === "csv"
        ? index === 0
          ? "table schema"
          : `row ${index}`
        : kind === "transcript"
          ? `turn ${index + 1}`
          : `section ${index + 1}`,
    text,
    confidence: Math.max(0.45, 0.92 - index * 0.01),
    reason:
      kind === "csv"
        ? "Row-oriented chunk for table-aware retrieval."
        : "Paragraph-oriented chunk for local retrieval."
  }));
}

function summaryHintForKind(
  kind: DocumentKind,
  normalizedText: string,
  fields: DetectedField[]
): string {
  switch (kind) {
    case "csv":
      return "Summarize the table schema, row count, and notable values.";
    case "transcript":
      return "Summarize decisions, speakers, and action items.";
    case "email":
      return "Summarize the latest message, requests, and unresolved questions.";
    case "invoice":
      return "Summarize vendor, total, date, and invoice identifiers.";
    case "legal":
      return "Summarize obligations, retention, user rights, and legal scope.";
    case "html":
      return "Summarize the main article content after stripping page boilerplate.";
    default:
      return fields.length > 0
        ? `Summarize the core points and include detected fields such as ${fields
            .map((field) => field.key)
            .join(", ")}.`
        : "Summarize the main points and preserve the domain-specific meaning.";
  }
}

function titleForKind(
  kind: DocumentKind,
  sourceName: string | undefined,
  normalizedText: string
): string {
  if (sourceName) {
    return titleFromSource(sourceName, "Imported document");
  }

  const firstLine = normalizeLineEndings(normalizedText)
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  if (kind === "email") {
    const subject = normalizedText.match(/^subject:\s+(.+)$/im)?.[1];
    return subject ? clip(subject, 80) : "Imported email";
  }

  return clip(firstLine ?? "Imported document", 80);
}

export function analyzeDocumentInput(params: {
  sourceName?: string;
  title?: string;
  rawContent: string;
}): {
  analysis: DocumentAnalysis;
  normalizedTitle: string;
  normalizedContent: string;
  wordCount: number;
} {
  const encoding = normalizeEncodingArtifacts(params.rawContent);
  const raw = encoding.text;
  const inferred = inferKind(params.sourceName, raw);
  const normalized = normalizeByKind(inferred.kind, raw);
  const detectedFields = detectFields(inferred.kind, normalized.text);
  const chunks = chunksForKind(inferred.kind, normalized.text);
  const warnings = [...normalized.warnings];

  if (encoding.changed) {
    warnings.push({
      code: "encoding-normalized",
      message: "Whitespace or encoding artifacts were normalized during import.",
      nextStep:
        "Review the normalized text if the original file had unusual punctuation or spacing."
    });
  }

  const normalizedTitle = params.title?.trim()
    ? params.title.trim()
    : titleForKind(inferred.kind, params.sourceName, normalized.text);
  const sourceDigest = stableHash(`${params.sourceName ?? "inline"}\n${normalized.text}`);

  const analysis: DocumentAnalysis = {
    schemaVersion: 1,
    kind: inferred.kind,
    kindConfidence: inferred.confidence,
    confidenceLabel: toConfidenceLabel(inferred.confidence),
    normalizedText: normalized.text,
    normalizedTitle,
    chunks,
    warnings,
    detectedFields,
    summaryHint: summaryHintForKind(inferred.kind, normalized.text, detectedFields),
    sourceDigest,
    debug: {
      signals: inferred.signals,
      lineCount: normalizeLineEndings(normalized.text).split("\n").length,
      charCount: normalized.text.length
    }
  };

  return {
    analysis,
    normalizedTitle,
    normalizedContent: normalized.text,
    wordCount: countWords(normalized.text)
  };
}

export function reanalyzeDocument(document: DocumentRecord): DocumentRecord {
  const analyzed = analyzeDocumentInput({
    sourceName: document.sourceName,
    title: document.title,
    rawContent: document.content
  });

  return {
    ...document,
    title: analyzed.normalizedTitle,
    wordCount: analyzed.wordCount,
    analysis: analyzed.analysis
  };
}
