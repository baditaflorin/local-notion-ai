export type DocumentKind =
  | "note"
  | "markdown"
  | "html"
  | "csv"
  | "json"
  | "transcript"
  | "email"
  | "invoice"
  | "legal"
  | "code"
  | "unknown";

export type ConfidenceLevel = "high" | "medium" | "low";

export type AnalysisWarning = {
  code:
    | "empty-content"
    | "large-input"
    | "partial-input"
    | "quoted-history"
    | "boilerplate-noise"
    | "weak-match"
    | "unsupported-structure"
    | "encoding-normalized"
    | "mixed-shape"
    | "truncated-json"
    | "parse-fallback";
  message: string;
  nextStep?: string;
};

export type DetectedField = {
  key: string;
  type: "date" | "price" | "url" | "email" | "id" | "speaker" | "timestamp" | "text";
  value: string;
  confidence: number;
  reason: string;
};

export type AnalysisChunk = {
  id: string;
  label: string;
  text: string;
  confidence: number;
  reason: string;
};

export type DocumentAnalysis = {
  schemaVersion: 1;
  kind: DocumentKind;
  kindConfidence: number;
  confidenceLabel: ConfidenceLevel;
  normalizedText: string;
  normalizedTitle: string;
  chunks: AnalysisChunk[];
  warnings: AnalysisWarning[];
  detectedFields: DetectedField[];
  summaryHint: string;
  sourceDigest: string;
  debug: {
    signals: string[];
    lineCount: number;
    charCount: number;
  };
};

export type DocumentRecord = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  sourceName?: string;
  wordCount: number;
  tags: string[];
  analysis?: DocumentAnalysis;
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
  kind?: DocumentKind;
  confidenceLabel?: ConfidenceLevel;
};

export type AiMode = "summary" | "rewrite" | "qa";

export type RewriteStyle = "clear" | "short" | "polished";

export type Citation = {
  documentId: string;
  title: string;
  excerpt: string;
  score: number;
  kind?: DocumentKind;
  chunkLabel?: string;
  confidence: number;
  reason: string;
};

export type QuestionAnswer = {
  answer: string;
  citations: Citation[];
  confidence: number;
  confidenceLabel: ConfidenceLevel;
  explanation: string;
};

export type SummaryResult = {
  text: string;
  confidence: number;
  confidenceLabel: ConfidenceLevel;
  explanation: string;
};

export type RewriteResult = {
  text: string;
  confidence: number;
  confidenceLabel: ConfidenceLevel;
  explanation: string;
};

export type ToastMessage = {
  id: string;
  tone: "info" | "success" | "error";
  text: string;
};

export type ExportBundle = {
  schemaVersion: 2;
  exportedAt: string;
  appVersion: string;
  appCommit: string;
  exportDigest: string;
  documents: DocumentRecord[];
};

export type ImportError = {
  title: string;
  why: string;
  nextStep: string;
};
