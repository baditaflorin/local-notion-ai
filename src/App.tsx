import {
  AlertTriangle,
  BadgeInfo,
  BookOpen,
  Download,
  FileSearch,
  Github,
  Heart,
  Import,
  Loader2,
  MessageSquareText,
  PanelLeft,
  PencilLine,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X
} from "lucide-preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { answerQuestion, rewriteText, summarizeDocuments } from "./features/ai/nlp";
import { LocalSearchIndex } from "./features/search/searchEngine";
import {
  createSampleDocuments,
  describeImportError,
  documentsFromFiles,
  parseExportBundle
} from "./features/workspace/importDocuments";
import { downloadJson } from "./lib/download/download";
import { WorkspaceStore } from "./lib/storage/workspaceStore";
import { buildInfo } from "./lib/version/buildInfo";
import type {
  Citation,
  DocumentRecord,
  QuestionAnswer,
  RewriteStyle,
  SearchResult,
  ToastMessage,
  WorkspaceSnapshot
} from "./shared/types";

type AiMode = "summary" | "rewrite" | "qa";

type OperationState = {
  kind: "import" | "restore" | "run-ai";
  message: string;
  progress?: string;
  cancellable?: boolean;
};

type AiState = {
  mode: AiMode;
  text: string;
  confidence: number;
  confidenceLabel: "high" | "medium" | "low";
  explanation: string;
  citations: Citation[];
} | null;

const emptySnapshot: WorkspaceSnapshot = {
  documents: [],
  activeDocumentId: null,
  updatedAt: null
};

function newToast(tone: ToastMessage["tone"], text: string): ToastMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    tone,
    text
  };
}

function shortCommit(commit: string): string {
  return commit.length > 12 ? commit.slice(0, 12) : commit;
}

function percentLabel(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function labelForConfidence(level: "high" | "medium" | "low"): string {
  return level === "high"
    ? "High confidence"
    : level === "medium"
      ? "Medium confidence"
      : "Low confidence";
}

export function App() {
  const storeRef = useRef<WorkspaceStore | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const importAbortRef = useRef<AbortController | null>(null);
  const [snapshot, setSnapshot] = useState<WorkspaceSnapshot>(emptySnapshot);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [aiMode, setAiMode] = useState<AiMode>("summary");
  const [rewriteStyle, setRewriteStyle] = useState<RewriteStyle>("clear");
  const [question, setQuestion] = useState("What matters most in these docs?");
  const [aiState, setAiState] = useState<AiState>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [operation, setOperation] = useState<OperationState | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    const store = new WorkspaceStore();
    storeRef.current = store;
    const unsubscribe = store.subscribe(setSnapshot);

    void store
      .load()
      .catch(() => {
        setToast(newToast("error", "Could not load the local workspace."));
      })
      .finally(() => {
        setIsLoading(false);
      });

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setShowDebug(params.get("debug") === "1");
    }

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = setTimeout(() => setToast(null), 3400);
    return () => clearTimeout(timer);
  }, [toast]);

  const selectedDocument = useMemo(
    () => snapshot.documents.find((document) => document.id === snapshot.activeDocumentId) ?? null,
    [snapshot.activeDocumentId, snapshot.documents]
  );

  const searchIndex = useMemo(() => new LocalSearchIndex(snapshot.documents), [snapshot.documents]);
  const searchResults = useMemo(() => searchIndex.search(query), [query, searchIndex]);
  const activeDocuments = selectedDocument ? [selectedDocument] : snapshot.documents;

  function store(): WorkspaceStore {
    if (!storeRef.current) {
      throw new Error("Workspace store is not ready");
    }
    return storeRef.current;
  }

  async function handleTextImport(files: FileList | null): Promise<void> {
    if (!files || files.length === 0) {
      return;
    }

    const abortController = new AbortController();
    importAbortRef.current = abortController;

    try {
      setOperation({
        kind: "import",
        message: "Analyzing local files",
        progress: `0/${files.length}`,
        cancellable: true
      });

      const documents = await documentsFromFiles(files, {
        signal: abortController.signal,
        onProgress: (current, total, fileName) => {
          setOperation({
            kind: "import",
            message: `Analyzing ${fileName}`,
            progress: `${current}/${total}`,
            cancellable: true
          });
        }
      });
      store().addDocuments(documents);
      setToast(
        newToast(
          "success",
          `Imported ${documents.length} document${documents.length === 1 ? "" : "s"}.`
        )
      );
    } catch (error) {
      const detail = describeImportError(error);
      setToast(newToast("error", `${detail.title} ${detail.why} ${detail.nextStep}`));
    } finally {
      setOperation(null);
      importAbortRef.current = null;
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleBundleImport(files: FileList | null): Promise<void> {
    const file = files?.[0];
    if (!file) {
      return;
    }

    try {
      setOperation({
        kind: "restore",
        message: `Restoring ${file.name}`,
        cancellable: false
      });
      const bundle = parseExportBundle(await file.text());
      store().importBundle(bundle);
      setToast(newToast("success", `Restored ${bundle.documents.length} documents.`));
    } catch (error) {
      const detail = describeImportError(error);
      setToast(newToast("error", `${detail.title} ${detail.why} ${detail.nextStep}`));
    } finally {
      setOperation(null);
      if (importInputRef.current) {
        importInputRef.current.value = "";
      }
    }
  }

  function updateDocument(
    document: DocumentRecord,
    patch: Partial<Pick<DocumentRecord, "title" | "content">>
  ): void {
    store().upsertDocument({ ...document, ...patch });
  }

  function runAi(): void {
    setOperation({
      kind: "run-ai",
      message:
        aiMode === "summary"
          ? "Summarizing normalized content"
          : aiMode === "rewrite"
            ? "Applying deterministic rewrite rules"
            : "Searching normalized chunks",
      cancellable: false
    });

    window.setTimeout(() => {
      if (aiMode === "summary") {
        const result = summarizeDocuments(
          activeDocuments.length > 0 ? activeDocuments : snapshot.documents
        );
        setAiState({
          mode: aiMode,
          text: result.text,
          confidence: result.confidence,
          confidenceLabel: result.confidenceLabel,
          explanation: result.explanation,
          citations: []
        });
        setOperation(null);
        return;
      }

      if (aiMode === "rewrite") {
        const result = rewriteText(
          selectedDocument?.content ?? "",
          rewriteStyle,
          selectedDocument ?? undefined
        );
        setAiState({
          mode: aiMode,
          text: result.text,
          confidence: result.confidence,
          confidenceLabel: result.confidenceLabel,
          explanation: result.explanation,
          citations: []
        });
        setOperation(null);
        return;
      }

      const result = answerQuestion(question, snapshot.documents);
      setAiState(resultToState(aiMode, result));
      setOperation(null);
    }, 0);
  }

  function exportWorkspace(): void {
    downloadJson(
      "local-notion-ai-export.json",
      store().exportBundle({ version: buildInfo.version, commit: buildInfo.commit })
    );
    setToast(newToast("success", "Workspace export started."));
  }

  async function clearWorkspace(): Promise<void> {
    await store().clear();
    setAiState(null);
    setToast(newToast("success", "Local workspace cleared."));
  }

  function loadSamples(): void {
    store().addDocuments(createSampleDocuments());
    setToast(newToast("success", "Loaded sample documents."));
  }

  function cancelOperation(): void {
    importAbortRef.current?.abort();
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-20 border-b border-ink/10 bg-paper/95 backdrop-blur">
        <div className="flex min-h-16 flex-wrap items-center gap-3 px-4 py-3 lg:px-6">
          <div className="flex min-w-56 items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded bg-moss text-white">
              <Sparkles aria-hidden="true" size={20} />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight">local-notion-ai</h1>
              <p className="text-xs text-ink/60">
                v{buildInfo.version} · {shortCommit(buildInfo.commit)}
              </p>
            </div>
          </div>

          <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
            <button
              className="tool-button"
              onClick={() => fileInputRef.current?.click()}
              title="Import documents"
            >
              <Upload aria-hidden="true" size={17} />
              <span>Import</span>
            </button>
            <button
              className="icon-button"
              onClick={() => importInputRef.current?.click()}
              title="Restore export"
            >
              <Import aria-hidden="true" size={17} />
            </button>
            <button className="icon-button" onClick={exportWorkspace} title="Export workspace">
              <Download aria-hidden="true" size={17} />
            </button>
            <button
              className={`icon-button ${showDebug ? "bg-moss/12 text-moss" : ""}`}
              onClick={() => setShowDebug((current) => !current)}
              title="Toggle debug surface"
            >
              <BadgeInfo aria-hidden="true" size={17} />
            </button>
            <a
              className="tool-button"
              href={buildInfo.repositoryUrl}
              target="_blank"
              rel="noreferrer"
            >
              <Github aria-hidden="true" size={17} />
              <span>Star on GitHub</span>
            </a>
            <a
              className="icon-button text-coral"
              href={buildInfo.paypalUrl}
              target="_blank"
              rel="noreferrer"
              title="Support on PayPal"
            >
              <Heart aria-hidden="true" size={17} />
            </a>
          </div>
        </div>
      </header>

      {operation ? (
        <div className="flex items-center justify-between border-b border-moss/20 bg-moss/8 px-4 py-2 text-sm text-ink/80">
          <div className="flex items-center gap-2">
            <Loader2 className="animate-spin text-moss" size={16} />
            <span>{operation.message}</span>
            {operation.progress ? (
              <span className="rounded bg-white px-2 py-1 text-xs text-ink/60">
                {operation.progress}
              </span>
            ) : null}
          </div>
          {operation.cancellable ? (
            <button className="icon-button" onClick={cancelOperation} title="Cancel operation">
              <X aria-hidden="true" size={16} />
            </button>
          ) : null}
        </div>
      ) : null}

      <main className="grid min-h-[calc(100vh-65px)] grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)_380px]">
        <aside className="border-b border-ink/10 bg-white/55 lg:border-b-0 lg:border-r">
          <div className="space-y-4 p-4">
            <div className="flex items-center gap-2 rounded border border-ink/15 bg-white px-3 py-2">
              <Search aria-hidden="true" size={17} className="text-ink/55" />
              <input
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink/45"
                value={query}
                onInput={(event) => setQuery(event.currentTarget.value)}
                placeholder="Search local docs"
                aria-label="Search local documents"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <PanelLeft aria-hidden="true" size={16} />
                Workspace
              </div>
              <span className="rounded bg-gold/15 px-2 py-1 text-xs text-gold">
                {snapshot.documents.length} docs
              </span>
            </div>

            {snapshot.documents.length === 0 && !isLoading ? (
              <div className="rounded border border-dashed border-ink/25 bg-white p-4">
                <p className="text-sm text-ink/70">No local documents yet.</p>
                <button className="mt-3 w-full justify-center tool-button" onClick={loadSamples}>
                  <BookOpen aria-hidden="true" size={17} />
                  <span>Load samples</span>
                </button>
              </div>
            ) : null}

            <div className="space-y-2" aria-label="Document search results">
              {searchResults.map((result) => (
                <DocumentRow
                  key={result.id}
                  result={result}
                  isActive={result.id === snapshot.activeDocumentId}
                  onSelect={() => store().setActiveDocument(result.id)}
                />
              ))}
            </div>
          </div>
        </aside>

        <section className="min-h-[560px] bg-white">
          {selectedDocument ? (
            <DocumentEditor
              document={selectedDocument}
              onChange={(patch) => updateDocument(selectedDocument, patch)}
              onRemove={() => store().removeDocument(selectedDocument.id)}
              showDebug={showDebug}
            />
          ) : (
            <div className="grid h-full min-h-[560px] place-items-center p-6">
              <div className="max-w-sm text-center">
                <Loader2
                  className={`mx-auto mb-3 text-moss ${isLoading ? "animate-spin" : ""}`}
                  size={28}
                />
                <p className="text-sm text-ink/65">
                  {isLoading
                    ? "Opening local workspace..."
                    : "Import a document or load samples to begin."}
                </p>
              </div>
            </div>
          )}
        </section>

        <aside className="border-t border-ink/10 bg-[#f4f8f5] lg:border-l lg:border-t-0">
          <div className="flex h-full min-h-[560px] flex-col gap-4 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <MessageSquareText aria-hidden="true" size={17} />
              Local AI
            </div>

            <div className="grid grid-cols-3 rounded border border-ink/15 bg-white p-1 text-sm">
              {(["summary", "rewrite", "qa"] as const).map((mode) => (
                <button
                  key={mode}
                  className={`rounded px-2 py-2 capitalize ${aiMode === mode ? "bg-moss text-white" : "text-ink/70 hover:bg-ink/5"}`}
                  onClick={() => setAiMode(mode)}
                >
                  {mode === "qa" ? "Q&A" : mode}
                </button>
              ))}
            </div>

            {aiMode === "rewrite" ? (
              <label className="grid gap-1 text-sm">
                <span className="text-xs font-medium uppercase tracking-wide text-ink/55">
                  Style
                </span>
                <select
                  className="rounded border border-ink/15 bg-white px-3 py-2 outline-none focus:border-moss"
                  value={rewriteStyle}
                  onChange={(event) => setRewriteStyle(event.currentTarget.value as RewriteStyle)}
                >
                  <option value="clear">Clear</option>
                  <option value="short">Short</option>
                  <option value="polished">Polished</option>
                </select>
              </label>
            ) : null}

            {aiMode === "qa" ? (
              <label className="grid gap-1 text-sm">
                <span className="text-xs font-medium uppercase tracking-wide text-ink/55">
                  Question
                </span>
                <textarea
                  className="min-h-24 resize-y rounded border border-ink/15 bg-white px-3 py-2 outline-none focus:border-moss"
                  value={question}
                  onInput={(event) => setQuestion(event.currentTarget.value)}
                />
              </label>
            ) : null}

            <button
              className="primary-button"
              onClick={runAi}
              disabled={operation?.kind === "import"}
            >
              <RefreshCw aria-hidden="true" size={17} />
              <span>Run locally</span>
            </button>

            <div className="space-y-3 rounded border border-ink/10 bg-white p-4 shadow-soft">
              {aiState ? (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded px-2 py-1 text-xs ${aiState.confidenceLabel === "high" ? "bg-moss/12 text-moss" : aiState.confidenceLabel === "medium" ? "bg-gold/12 text-gold" : "bg-coral/12 text-coral"}`}
                    >
                      {labelForConfidence(aiState.confidenceLabel)}
                    </span>
                    <span className="text-xs text-ink/55">{percentLabel(aiState.confidence)}</span>
                  </div>
                  <div className="min-h-48 whitespace-pre-wrap text-sm leading-6">
                    {aiState.text}
                  </div>
                  <div className="rounded bg-paper px-3 py-2 text-xs leading-5 text-ink/70">
                    {aiState.explanation}
                  </div>
                  {aiState.citations.length > 0 ? (
                    <div className="space-y-2 border-t border-ink/10 pt-3">
                      {aiState.citations.map((citation) => (
                        <div
                          key={`${citation.documentId}:${citation.chunkLabel ?? citation.title}`}
                          className="rounded border border-ink/10 bg-paper px-3 py-2 text-xs leading-5"
                        >
                          <div className="font-semibold text-ink">
                            {citation.title}
                            {citation.chunkLabel ? ` · ${citation.chunkLabel}` : ""}
                          </div>
                          <div className="text-ink/65">{citation.reason}</div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="min-h-72 text-sm leading-6 text-ink/65">Results appear here.</div>
              )}
            </div>

            <button className="danger-button" onClick={() => void clearWorkspace()}>
              <Trash2 aria-hidden="true" size={17} />
              <span>Clear local data</span>
            </button>
          </div>
        </aside>
      </main>

      <input
        ref={fileInputRef}
        className="sr-only"
        type="file"
        multiple
        accept=".txt,.md,.markdown,.csv,.json,.html,.eml"
        onChange={(event) => void handleTextImport(event.currentTarget.files)}
      />
      <input
        ref={importInputRef}
        className="sr-only"
        type="file"
        accept=".json"
        onChange={(event) => void handleBundleImport(event.currentTarget.files)}
      />

      <div className="sr-only" aria-live="polite">
        {toast?.text}
      </div>
      {toast ? (
        <div
          className={`fixed bottom-4 left-1/2 z-30 w-[min(720px,calc(100vw-32px))] -translate-x-1/2 rounded px-4 py-3 text-sm shadow-soft ${toast.tone}`}
        >
          {toast.text}
        </div>
      ) : null}
    </div>
  );
}

function resultToState(mode: AiMode, result: QuestionAnswer): AiState {
  return {
    mode,
    text: result.answer,
    confidence: result.confidence,
    confidenceLabel: result.confidenceLabel,
    explanation: result.explanation,
    citations: result.citations
  };
}

function DocumentRow({
  result,
  isActive,
  onSelect
}: {
  result: SearchResult;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={`w-full rounded border p-3 text-left transition ${isActive ? "border-moss bg-moss/10" : "border-ink/10 bg-white hover:border-moss/60"}`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="block truncate text-sm font-semibold">{result.title}</span>
        {result.kind ? (
          <span className="rounded bg-ink/6 px-2 py-1 text-[10px] uppercase tracking-wide text-ink/55">
            {result.kind}
          </span>
        ) : null}
      </div>
      <span className="mt-1 line-clamp-2 block text-xs leading-5 text-ink/60">
        {result.excerpt}
      </span>
      {result.confidenceLabel ? (
        <span className="mt-2 inline-flex rounded bg-paper px-2 py-1 text-[10px] uppercase tracking-wide text-ink/55">
          {result.confidenceLabel} confidence
        </span>
      ) : null}
    </button>
  );
}

function DocumentEditor({
  document,
  onChange,
  onRemove,
  showDebug
}: {
  document: DocumentRecord;
  onChange: (patch: Partial<Pick<DocumentRecord, "title" | "content">>) => void;
  onRemove: () => void;
  showDebug: boolean;
}) {
  const analysis = document.analysis;

  return (
    <div className="flex h-full min-h-[560px] flex-col">
      <div className="space-y-3 border-b border-ink/10 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <PencilLine aria-hidden="true" size={18} className="text-moss" />
          <input
            className="min-w-64 flex-1 bg-transparent text-xl font-semibold outline-none"
            value={document.title}
            onInput={(event) => onChange({ title: event.currentTarget.value })}
            aria-label="Document title"
          />
          <span className="rounded bg-sky/10 px-2 py-1 text-xs text-sky">
            {document.wordCount} words
          </span>
          <button className="icon-button" onClick={onRemove} title="Remove document">
            <Trash2 aria-hidden="true" size={16} />
          </button>
        </div>

        {analysis ? (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded bg-moss/12 px-2 py-1 text-moss">{analysis.kind}</span>
            <span
              className={`rounded px-2 py-1 ${analysis.confidenceLabel === "high" ? "bg-moss/12 text-moss" : analysis.confidenceLabel === "medium" ? "bg-gold/12 text-gold" : "bg-coral/12 text-coral"}`}
            >
              {labelForConfidence(analysis.confidenceLabel)}
            </span>
            <span className="rounded bg-paper px-2 py-1 text-ink/60">
              digest {analysis.sourceDigest}
            </span>
          </div>
        ) : null}

        {analysis?.warnings.length ? (
          <div className="space-y-2">
            {analysis.warnings.map((warning) => (
              <div
                key={warning.code}
                className="flex items-start gap-2 rounded border border-coral/20 bg-coral/6 px-3 py-2 text-xs leading-5 text-ink/75"
              >
                <AlertTriangle
                  aria-hidden="true"
                  size={14}
                  className="mt-0.5 shrink-0 text-coral"
                />
                <div>
                  <div>{warning.message}</div>
                  {warning.nextStep ? <div className="text-ink/55">{warning.nextStep}</div> : null}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <textarea
        className="min-h-[360px] flex-1 resize-none p-5 font-mono text-sm leading-6 outline-none"
        value={document.content}
        onInput={(event) => onChange({ content: event.currentTarget.value })}
        aria-label="Document content"
      />

      {analysis ? (
        <div className="border-t border-ink/10 bg-paper/70 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <FileSearch aria-hidden="true" size={16} />
            Analysis
          </div>
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="rounded border border-ink/10 bg-white p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/55">
                Detected fields
              </div>
              <div className="space-y-2 text-xs leading-5">
                {analysis.detectedFields.length ? (
                  analysis.detectedFields.map((field) => (
                    <div key={`${field.key}:${field.value}`} className="rounded bg-paper px-2 py-2">
                      <div className="font-semibold text-ink">
                        {field.key}: {field.value}
                      </div>
                      <div className="text-ink/60">
                        {field.type} · {percentLabel(field.confidence)} · {field.reason}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-ink/55">
                    No field-level inference was strong enough to surface.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded border border-ink/10 bg-white p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/55">
                Normalized preview
              </div>
              <div className="whitespace-pre-wrap text-xs leading-5 text-ink/70">
                {analysis.normalizedText.slice(0, 600) || "No normalized text available."}
              </div>
            </div>
          </div>

          {showDebug ? (
            <div className="mt-3 rounded border border-ink/10 bg-white p-3 text-xs leading-5 text-ink/70">
              <div className="mb-2 font-semibold text-ink">Debug</div>
              <div>signals: {analysis.debug.signals.join(", ") || "none"}</div>
              <div>chars: {analysis.debug.charCount}</div>
              <div>lines: {analysis.debug.lineCount}</div>
              <div>chunks: {analysis.chunks.length}</div>
              <div>hint: {analysis.summaryHint}</div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
