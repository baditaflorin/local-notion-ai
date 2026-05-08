import { z } from "zod";
import { countWords, titleFromSource } from "../../lib/text/text";
import type { DocumentRecord, ExportBundle } from "../../shared/types";

const exportBundleSchema = z.object({
  schemaVersion: z.literal(1),
  exportedAt: z.string(),
  documents: z.array(
    z.object({
      id: z.string(),
      title: z.string().min(1),
      content: z.string(),
      createdAt: z.string(),
      updatedAt: z.string(),
      sourceName: z.string().optional(),
      wordCount: z.number().int().nonnegative(),
      tags: z.array(z.string())
    })
  )
});

function randomId(): string {
  if ("crypto" in globalThis && "randomUUID" in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }

  return `doc-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createDocument(
  title: string,
  content: string,
  sourceName?: string
): DocumentRecord {
  const now = new Date().toISOString();
  return {
    id: randomId(),
    title: title.trim() || "Untitled document",
    content,
    createdAt: now,
    updatedAt: now,
    sourceName,
    wordCount: countWords(content),
    tags: []
  };
}

export async function documentsFromFiles(files: FileList | File[]): Promise<DocumentRecord[]> {
  const readableFiles = Array.from(files).filter((file) => file.size > 0);
  const parsed = await Promise.all(
    readableFiles.map(async (file, index) => {
      const content = await file.text();
      const title = titleFromSource(file.name, `Imported document ${index + 1}`);
      return createDocument(title, content, file.name);
    })
  );

  return parsed.filter((document) => document.content.trim().length > 0);
}

export function createSampleDocuments(): DocumentRecord[] {
  return [
    createDocument(
      "Offline AI workspace notes",
      [
        "Local-first AI tools are useful when documents are private, temporary, or sensitive.",
        "A static GitHub Pages app can keep the interface public while keeping the workspace private inside the browser.",
        "Summaries, rewriting, and question answering can start with deterministic local retrieval and grow toward heavier model adapters later.",
        "The important product boundary is that user documents are never uploaded by default."
      ].join("\n\n"),
      "sample-offline-ai.md"
    ),
    createDocument(
      "Notion AI replacement checklist",
      [
        "The v1 workflow should import Markdown and text files, index them locally, and persist them in IndexedDB.",
        "The interface should expose a fast search box, a document editor, and three AI actions: summarize, rewrite, and ask.",
        "Build metadata should be visible so people can connect the live page to the exact GitHub commit.",
        "The repository and PayPal links should be visible without interrupting the workspace."
      ].join("\n\n"),
      "sample-checklist.md"
    )
  ];
}

export function parseExportBundle(input: string): ExportBundle {
  const parsed: unknown = JSON.parse(input);
  return exportBundleSchema.parse(parsed);
}
