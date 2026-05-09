import { describe, expect, it } from "vitest";
import { createDocument, documentsFromFilesPartial, parseExportBundle } from "./importDocuments";

describe("workspace import helpers", () => {
  function textFile(name: string, content: string): File {
    const file = new File([content], name, { type: "text/plain" });
    Object.defineProperty(file, "text", {
      value: async () => content
    });
    return file;
  }

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

  it("imports valid files when one file in a batch fails", async () => {
    const result = await documentsFromFilesPartial([
      textFile("good.md", "hello world"),
      textFile("empty.txt", "")
    ]);

    expect(result.documents).toHaveLength(1);
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]?.detail.title).toBe("The file was empty.");
  });
});
