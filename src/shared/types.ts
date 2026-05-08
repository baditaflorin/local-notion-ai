export type DocumentRecord = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  sourceName?: string;
  wordCount: number;
  tags: string[];
};

export type WorkspaceSnapshot = {
  documents: DocumentRecord[];
  activeDocumentId: string | null;
  updatedAt: string | null;
};

export type SearchResult = {
  id: string;
  title: string;
  excerpt: string;
  score: number;
};

export type RewriteStyle = "clear" | "short" | "polished";

export type Citation = {
  documentId: string;
  title: string;
  excerpt: string;
  score: number;
};

export type QuestionAnswer = {
  answer: string;
  citations: Citation[];
};

export type ToastMessage = {
  id: string;
  tone: "info" | "success" | "error";
  text: string;
};

export type ExportBundle = {
  schemaVersion: 1;
  exportedAt: string;
  documents: DocumentRecord[];
};
