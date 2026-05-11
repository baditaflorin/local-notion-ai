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

  it("collapses several wordy patterns at once with the clear style", () => {
    const result = rewriteText(
      "Due to the fact that we want to ascertain the impact, please be advised that we will commence the audit prior to the launch.",
      "clear"
    );
    const lower = result.text.toLowerCase();
    expect(lower).toContain("because");
    expect(lower).toContain("find out");
    expect(lower).toContain("start");
    expect(lower).toContain("before");
    expect(lower).not.toMatch(/due to the fact/i);
    expect(lower).not.toMatch(/please be advised/i);
    expect(result.confidence).toBeGreaterThan(0.7);
    expect(result.explanation).toMatch(/applied [0-9]+ /i);
  });

  it("strips intensifiers and dead-weight phrases with the short style", () => {
    const result = rewriteText(
      "Honestly, I think that we basically need to, at the end of the day, really finish the proposal.",
      "short"
    );
    const lower = result.text.toLowerCase();
    expect(lower).not.toMatch(/\bbasically\b/);
    expect(lower).not.toMatch(/\bat the end of the day\b/);
    expect(lower).not.toMatch(/\bi think (that\s+)?/);
    expect(lower).not.toMatch(/\breally\b/);
  });

  it("expands contractions and upgrades vague nouns with the polished style", () => {
    const result = rewriteText(
      "We can't deal with all this stuff, but it's okay because we'll come up with a plan.",
      "polished"
    );
    expect(result.text).toContain("cannot");
    expect(result.text).toContain("materials");
    expect(result.text).toContain("address");
    expect(result.text).toContain("develop");
    expect(result.text).not.toMatch(/\bcan't\b/i);
    expect(result.text).not.toMatch(/\bit's\b/i);
  });

  it("reports zero applied rules when the text already matches the style", () => {
    const result = rewriteText("The audit will start tomorrow.", "clear");
    expect(result.explanation.toLowerCase()).toContain("no");
    expect(result.confidence).toBeLessThan(0.7);
  });

  it("answers from matching local passages", () => {
    const result = answerQuestion("Where are private documents kept?", docs);
    expect(result.answer).toContain("Local privacy");
    expect(result.citations).toHaveLength(1);
  });
});
