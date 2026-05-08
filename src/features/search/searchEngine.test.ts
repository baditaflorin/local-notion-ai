import { describe, expect, it } from "vitest";
import { LocalSearchIndex } from "./searchEngine";
import type { DocumentRecord } from "../../shared/types";

const documents: DocumentRecord[] = [
  {
    id: "alpha",
    title: "IndexedDB persistence",
    content: "The workspace persists documents with IndexedDB and Yjs updates.",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    wordCount: 8,
    tags: []
  },
  {
    id: "beta",
    title: "Payments",
    content: "The footer links to PayPal and the public GitHub repository.",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    wordCount: 10,
    tags: []
  }
];

describe("LocalSearchIndex", () => {
  it("returns relevant documents for a query", () => {
    const index = new LocalSearchIndex(documents);
    expect(index.search("Yjs")[0]?.id).toBe("alpha");
  });

  it("returns recent documents when query is empty", () => {
    const index = new LocalSearchIndex(documents);
    expect(index.search("")).toHaveLength(2);
  });
});
