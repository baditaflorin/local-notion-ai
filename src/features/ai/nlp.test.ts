import { describe, expect, it } from "vitest";
import { answerQuestion, rewriteText, summarizeDocuments } from "./nlp";
import type { DocumentRecord } from "../../shared/types";

const docs: DocumentRecord[] = [
  {
    id: "one",
    title: "Local privacy",
    content:
      "Local AI keeps private documents in the browser. Browser storage allows offline search. Users can export their workspace.",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    wordCount: 15,
    tags: []
  },
  {
    id: "two",
    title: "Static deploy",
    content:
      "GitHub Pages serves static assets. The app does not need a runtime backend or secrets.",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    wordCount: 14,
    tags: []
  }
];

describe("local AI helpers", () => {
  it("summarizes the highest signal sentences", () => {
    expect(summarizeDocuments(docs, 2).text).toContain("Local AI keeps private documents");
  });

  it("rewrites verbose text with the selected style", () => {
    expect(
      rewriteText("In order to utilize the tool, we need to import notes.", "clear").text
    ).toContain("to use the tool");
  });

  it("answers from matching local passages", () => {
    const result = answerQuestion("Where are private documents kept?", docs);
    expect(result.answer).toContain("Local privacy");
    expect(result.citations).toHaveLength(1);
  });
});
