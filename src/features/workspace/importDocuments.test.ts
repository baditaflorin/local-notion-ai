import { describe, expect, it } from "vitest";
import { createDocument, parseExportBundle } from "./importDocuments";

describe("workspace import helpers", () => {
  it("creates documents with word counts", () => {
    const document = createDocument("Notes", "one two three", "notes.md");
    expect(document.title).toBe("Notes");
    expect(document.wordCount).toBe(3);
  });

  it("validates exported bundles", () => {
    const document = createDocument("Notes", "content");
    const bundle = parseExportBundle(
      JSON.stringify({
        schemaVersion: 1,
        exportedAt: "2026-01-01T00:00:00.000Z",
        documents: [document]
      })
    );

    expect(bundle.documents[0]?.title).toBe("Notes");
  });
});
