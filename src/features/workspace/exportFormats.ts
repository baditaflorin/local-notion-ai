import { stableHash } from "../../lib/text/text";
import type { AiMode } from "../../shared/types";
import type { Citation, DocumentRecord } from "../../shared/types";

export type AiReport = {
  mode: AiMode;
  text: string;
  confidence: number;
  confidenceLabel: "high" | "medium" | "low";
  explanation: string;
  citations: Citation[];
};

function csvCell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function stableDocuments(documents: DocumentRecord[]): DocumentRecord[] {
  return [...documents].sort((a, b) => a.id.localeCompare(b.id));
}

export function documentsToCsv(documents: DocumentRecord[]): string {
  const headers = [
    "id",
    "title",
    "source_name",
    "kind",
    "confidence_label",
    "confidence",
    "word_count",
    "warnings",
    "detected_fields",
    "source_digest"
  ];

  const rows = stableDocuments(documents).map((document) => {
    const analysis = document.analysis;
    return [
      document.id,
      document.title,
      document.sourceName ?? "",
      analysis?.kind ?? "unknown",
      analysis?.confidenceLabel ?? "low",
      analysis ? analysis.kindConfidence.toFixed(3) : "0.000",
      document.wordCount,
      analysis?.warnings.map((warning) => warning.code).join(";") ?? "",
      analysis?.detectedFields.map((field) => `${field.key}:${field.type}`).join(";") ?? "",
      analysis?.sourceDigest ?? stableHash(document.content)
    ].map(csvCell);
  });

  return [[...headers.map(csvCell)], ...rows].map((row) => row.join(",")).join("\n") + "\n";
}

export function aiReportToText(
  report: AiReport,
  build: { version: string; commit: string }
): string {
  const lines = [
    "local-notion-ai report",
    `version: ${build.version}`,
    `commit: ${build.commit}`,
    `mode: ${report.mode}`,
    `confidence: ${report.confidenceLabel} (${Math.round(report.confidence * 100)}%)`,
    "",
    report.text,
    "",
    `reason: ${report.explanation}`
  ];

  if (report.citations.length > 0) {
    lines.push("", "citations:");
    for (const citation of report.citations) {
      lines.push(
        `- ${citation.title}${citation.chunkLabel ? ` / ${citation.chunkLabel}` : ""}: ${citation.reason}`
      );
    }
  }

  return `${lines.join("\n")}\n`;
}
