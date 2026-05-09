import { z } from "zod";
import { analyzeDocumentInput } from "../analysis/documentAnalysis";
import { stableHash } from "../../lib/text/text";
import type { DocumentRecord, ExportBundle, ImportError } from "../../shared/types";

const documentSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  content: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  sourceName: z.string().optional(),
  wordCount: z.number().int().nonnegative(),
  tags: z.array(z.string()),
  analysis: z.unknown().optional()
});

const exportBundleV1Schema = z.object({
  schemaVersion: z.literal(1),
  exportedAt: z.string(),
  documents: z.array(documentSchema)
});

const exportBundleV2Schema = z.object({
  schemaVersion: z.literal(2),
  exportedAt: z.string(),
  appVersion: z.string(),
  appCommit: z.string(),
  exportDigest: z.string(),
  documents: z.array(documentSchema)
});

function stableDocumentId(sourceName: string | undefined, normalizedContent: string): string {
  return `doc-${stableHash(`${sourceName ?? "inline"}\n${normalizedContent}`)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function createDocument(
  title: string,
  content: string,
  sourceName?: string
): DocumentRecord {
  const analyzed = analyzeDocumentInput({ title, rawContent: content, sourceName });
  const now = nowIso();

  return {
    id: stableDocumentId(sourceName ?? title, analyzed.normalizedContent),
    title: analyzed.normalizedTitle,
    content,
    createdAt: now,
    updatedAt: now,
    sourceName,
    wordCount: analyzed.wordCount,
    tags: [],
    analysis: analyzed.analysis
  };
}

function importError(title: string, why: string, nextStep: string): Error {
  const error = new Error(title) as Error & { detail: ImportError };
  error.detail = { title, why, nextStep };
  return error;
}

function importErrorFromDetail(detail: ImportError): Error {
  return importError(detail.title, detail.why, detail.nextStep);
}

export function describeImportError(error: unknown): ImportError {
  const detail =
    typeof error === "object" && error !== null && "detail" in error
      ? (error as { detail?: ImportError }).detail
      : undefined;

  return (
    detail ?? {
      title: "Import failed.",
      why: "The file could not be read into a supported local text format.",
      nextStep: "Try plain text, Markdown, CSV, HTML, JSON, or a local-notion-ai export."
    }
  );
}

export async function documentsFromFiles(
  files: FileList | File[],
  options?: {
    onProgress?: (current: number, total: number, fileName: string) => void;
    signal?: AbortSignal;
  }
): Promise<DocumentRecord[]> {
  const result = await documentsFromFilesPartial(files, options);
  if (result.failures.length > 0) {
    throw importErrorFromDetail(result.failures[0].detail);
  }

  return result.documents;
}

export type FileImportFailure = {
  fileName: string;
  detail: ImportError;
};

export type FileImportBatch = {
  documents: DocumentRecord[];
  failures: FileImportFailure[];
};

async function documentFromFile(file: File): Promise<DocumentRecord> {
  if (file.size === 0) {
    throw importError(
      "The file was empty.",
      `${file.name} had no readable text content.`,
      "Pick a file that contains text, or export a supported text representation first."
    );
  }

  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith(".pdf")) {
    throw importError(
      "PDF import is not supported in v2 substance.",
      `${file.name} is a binary PDF, and the local app only analyzes text-like formats directly.`,
      "Extract the PDF text first, then import the extracted text or markdown."
    );
  }

  const content = await file.text();
  if (!content.trim()) {
    throw importError(
      "The file had no readable text after decoding.",
      `${file.name} decoded to empty or whitespace-only content.`,
      "Check the file encoding or export the source as UTF-8 text."
    );
  }

  return createDocument("", content, file.name);
}

export async function documentsFromFilesPartial(
  files: FileList | File[],
  options?: {
    onProgress?: (current: number, total: number, fileName: string) => void;
    signal?: AbortSignal;
  }
): Promise<FileImportBatch> {
  const readableFiles = Array.from(files);
  const documents: DocumentRecord[] = [];
  const failures: FileImportFailure[] = [];

  for (const [index, file] of readableFiles.entries()) {
    if (options?.signal?.aborted) {
      failures.push({
        fileName: file.name,
        detail: {
          title: "Import cancelled.",
          why: "The import was stopped before every file finished processing.",
          nextStep: "Start the import again when you are ready."
        }
      });
      break;
    }

    options?.onProgress?.(index + 1, readableFiles.length, file.name);

    try {
      documents.push(await documentFromFile(file));
    } catch (error) {
      failures.push({
        fileName: file.name,
        detail: describeImportError(error)
      });
    }
  }

  return { documents, failures };
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
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(input);
  } catch {
    throw importError(
      "The export file is not valid JSON.",
      "The file could not be parsed as a local-notion-ai export bundle.",
      "Open the file and check whether it was truncated or saved in a different format."
    );
  }

  const v2 = exportBundleV2Schema.safeParse(parsedJson);
  if (v2.success) {
    const documents = v2.data.documents.map((document) =>
      createDocument(document.title, document.content, document.sourceName)
    );
    return {
      ...v2.data,
      documents
    };
  }

  const v1 = exportBundleV1Schema.safeParse(parsedJson);
  if (v1.success) {
    const documents = v1.data.documents.map((document) =>
      createDocument(document.title, document.content, document.sourceName)
    );
    return {
      schemaVersion: 2,
      exportedAt: v1.data.exportedAt,
      appVersion: "legacy-v1",
      appCommit: "legacy-v1",
      exportDigest: stableHash(JSON.stringify(documents.map((document) => document.id))),
      documents
    };
  }

  throw importError(
    "The export file uses an unsupported schema.",
    "The JSON parsed successfully, but it does not match the local-notion-ai export contract.",
    "Use an export produced by this app, or convert the source into plain text and import it directly."
  );
}
