import { describe, expect, it } from "vitest";
import { createDocument } from "./importDocuments";
import { aiReportToText, documentsToCsv } from "./exportFormats";

describe("workspace export formats", () => {
  it("exports deterministic document analysis CSV", () => {
    const first = createDocument("B", "price,total\n10,20", "b.csv");
    const second = createDocument("A", "hello world", "a.md");

    const csv = documentsToCsv([first, second]);

    expect(csv).toContain('"id","title","source_name"');
    expect(csv.indexOf(second.id)).toBeLessThan(csv.indexOf(first.id));
    expect(csv).toContain('"csv"');
  });

  it("creates a text report with provenance", () => {
    const report = aiReportToText(
      {
        mode: "summary",
        text: "Useful summary.",
        confidence: 0.82,
        confidenceLabel: "high",
        explanation: "Detected notes.",
        citations: []
      },
      { version: "0.3.0", commit: "abc123" }
    );

    expect(report).toContain("version: 0.3.0");
    expect(report).toContain("commit: abc123");
    expect(report).toContain("Useful summary.");
  });
});
