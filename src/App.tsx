import {
  BadgeInfo,
  BookOpen,
  Clipboard,
  Copy,
  Download,
  FileSpreadsheet,
  Github,
  Heart,
  Import,
  Link,
  Loader2,
  MessageSquareText,
  PanelLeft,
  Printer,
  RefreshCw,
  Search,
  Settings,
  Share2,
  Sparkles,
  Trash2,
  Upload,
  X
} from "lucide-preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { answerQuestion, rewriteText, summarizeDocuments } from "./features/ai/nlp";
import { LocalSearchIndex } from "./features/search/searchEngine";
import {
  createDocument,
  createSampleDocuments,
  describeImportError,
  documentsFromFilesPartial,
  parseExportBundle
} from "./features/workspace/importDocuments";
import {
  DocumentEditor,
  DocumentRow,
  SettingsPanel
} from "./features/workspace/workspaceComponents";
import { aiReportToText, documentsToCsv } from "./features/workspace/exportFormats";
import { decodeShareHash, shareUrlForBundle } from "./features/share/shareState";
import { downloadJson, downloadText } from "./lib/download/download";
import { loadSettings, saveSettings } from "./lib/settings/settingsStore";
import type { UserSettings } from "./lib/settings/settingsStore";
import { WorkspaceStore } from "./lib/storage/workspaceStore";
import { labelForConfidence, percentLabel } from "./lib/ui/labels";
import { buildInfo } from "./lib/version/buildInfo";
import type {
  AiMode,
  Citation,
  DocumentRecord,
  QuestionAnswer,
  RewriteStyle,
  ToastMessage,
  WorkspaceSnapshot
} from "./shared/types";

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

function isRewriteStyle(value: string): value is RewriteStyle {
  return value === "clear" || value === "short" || value === "polished";
}

async function copyToClipboard(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();

  if (!copied) {
    throw new Error("copy failed");
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function App() {
  const storeRef = useRef<WorkspaceStore | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const importAbortRef = useRef<AbortController | null>(null);
  const [settings, setSettings] = useState<UserSettings>(() => loadSettings());
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
  const [showSettings, setShowSettings] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);

  useEffect(() => {
    const store = new WorkspaceStore();
    storeRef.current = store;
    const unsubscribe = store.subscribe(setSnapshot);

    void store
      .load()
      .then(() => {
        if (typeof window === "undefined") {
          return;
        }

        const bundle = decodeShareHash(window.location.hash);
        if (bundle) {
          store.importBundle(bundle);
          setToast(newToast("success", `Loaded ${bundle.documents.length} shared documents.`));
        } else if (window.location.hash.startsWith("#state=")) {
          setToast(
            newToast(
              "error",
              "The shared workspace link could not be opened. The hash is invalid or truncated. Ask for a JSON export instead."
            )
          );
        }
      })
      .catch(() => {
        setToast(newToast("error", "Could not load the local workspace."));
      })
      .finally(() => {
        setIsLoading(false);
      });

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setShowDebug(params.get("debug") === "1" || settings.debugByDefault);
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

  function finishImportedDocuments(
    documents: DocumentRecord[],
    failures: { fileName: string; detail: { title: string; why: string; nextStep: string } }[] = []
  ): void {
    if (documents.length > 0) {
      store().addDocuments(documents);

      if (settings.autoRunSummaryAfterImport) {
        const result = summarizeDocuments(documents);
        setAiMode("summary");
        setAiState({
          mode: "summary",
          text: result.text,
          confidence: result.confidence,
          confidenceLabel: result.confidenceLabel,
          explanation: result.explanation,
          citations: []
        });
      }
    }

    if (documents.length > 0 && failures.length > 0) {
      setToast(
        newToast(
          "info",
          `Imported ${documents.length} document${documents.length === 1 ? "" : "s"}; ${failures.length} file${failures.length === 1 ? "" : "s"} need attention. ${failures[0]?.detail.title ?? ""}`
        )
      );
      return;
    }

    if (documents.length > 0) {
      setToast(
        newToast(
          "success",
          `Imported ${documents.length} document${documents.length === 1 ? "" : "s"}.`
        )
      );
      return;
    }

    if (failures.length > 0) {
      const detail = failures[0]!.detail;
      setToast(newToast("error", `${detail.title} ${detail.why} ${detail.nextStep}`));
    }
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

      const result = await documentsFromFilesPartial(files, {
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
      finishImportedDocuments(result.documents, result.failures);
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

  function importRawText(content: string, sourceName: string, title: string): void {
    if (!content.trim()) {
      setToast(
        newToast(
          "error",
          "Nothing readable was found. The input was empty or whitespace only. Paste text or choose a text-like file."
        )
      );
      return;
    }

    finishImportedDocuments([createDocument(title, content, sourceName)]);
  }

  function handlePastedTextImport(): void {
    importRawText(pasteText, "pasted-content.txt", "Pasted content");
    setPasteText("");
  }

  async function handleClipboardImport(): Promise<void> {
    try {
      if (!navigator.clipboard?.readText) {
        throw new Error("clipboard unavailable");
      }

      importRawText(await navigator.clipboard.readText(), "clipboard.txt", "Clipboard content");
    } catch {
      setToast(
        newToast(
          "error",
          "Clipboard import was blocked. The browser did not grant clipboard text access. Paste the text into the paste box instead."
        )
      );
    }
  }

  async function handleUrlImport(): Promise<void> {
    let url: URL;
    try {
      url = new URL(urlInput);
    } catch {
      setToast(
        newToast(
          "error",
          "The URL could not be read. It is not a complete web URL. Paste a full https:// URL or paste the page text instead."
        )
      );
      return;
    }

    try {
      setOperation({
        kind: "import",
        message: `Fetching ${url.hostname}`,
        cancellable: false
      });

      const response = await fetch(url.toString(), {
        headers: {
          Accept: "text/html,text/plain,application/json,text/*,*/*;q=0.8"
        }
      });

      if (!response.ok) {
        throw new Error(`status ${response.status}`);
      }

      const content = await response.text();
      importRawText(content, url.toString(), url.hostname);
      setUrlInput("");
    } catch {
      setToast(
        newToast(
          "error",
          "The URL could not be imported from this static page. The browser blocked the request or the page did not return readable text. Open the page, copy the rendered text or HTML, and paste it here."
        )
      );
    } finally {
      setOperation(null);
    }
  }

  function handleDrop(event: DragEvent): void {
    event.preventDefault();
    setIsDragActive(false);

    if (event.dataTransfer?.files.length) {
      void handleTextImport(event.dataTransfer.files);
      return;
    }

    const html = event.dataTransfer?.getData("text/html") ?? "";
    const text = event.dataTransfer?.getData("text/plain") ?? "";
    importRawText(html || text, "dropped-content.txt", "Dropped content");
  }

  function updateSettings(patch: Partial<UserSettings>): void {
    const nextSettings: UserSettings = {
      ...settings,
      ...patch,
      schemaVersion: 1
    };
    setSettings(nextSettings);
    saveSettings(nextSettings);

    if (patch.debugByDefault === true) {
      setShowDebug(true);
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

  function exportWorkspaceCsv(): void {
    if (snapshot.documents.length === 0) {
      setToast(
        newToast(
          "error",
          "CSV export needs documents. The workspace is empty. Import or paste text first."
        )
      );
      return;
    }

    downloadText(
      "local-notion-ai-documents.csv",
      documentsToCsv(snapshot.documents),
      "text/csv;charset=utf-8"
    );
    setToast(newToast("success", "CSV export started."));
  }

  async function shareWorkspace(): Promise<void> {
    if (snapshot.documents.length === 0) {
      setToast(
        newToast(
          "error",
          "Share link needs documents. The workspace is empty. Import or paste text first."
        )
      );
      return;
    }

    const result = shareUrlForBundle(
      store().exportBundle({ version: buildInfo.version, commit: buildInfo.commit }),
      window.location.href
    );

    if (!result.ok) {
      setToast(newToast("error", `${result.title} ${result.why} ${result.nextStep}`));
      return;
    }

    try {
      await copyToClipboard(result.url);
      setToast(newToast("success", "Share link copied."));
    } catch {
      setToast(
        newToast(
          "error",
          "The share link could not be copied. Browser clipboard access was blocked. Use JSON export instead."
        )
      );
    }
  }

  function currentAiReportText(): string | null {
    if (!aiState) {
      return null;
    }

    return aiReportToText(aiState, { version: buildInfo.version, commit: buildInfo.commit });
  }

  async function copyAiOutput(): Promise<void> {
    const report = currentAiReportText();
    if (!report) {
      setToast(newToast("error", "There is no AI output to copy. Run a local AI action first."));
      return;
    }

    try {
      await copyToClipboard(report);
      setToast(newToast("success", "AI output copied."));
    } catch {
      setToast(
        newToast(
          "error",
          "The AI output could not be copied. Browser clipboard access was blocked. Select the text manually or export JSON."
        )
      );
    }
  }

  function printAiOutput(): void {
    const report = currentAiReportText();
    if (!report) {
      setToast(newToast("error", "There is no AI output to print. Run a local AI action first."));
      return;
    }

    const popup = window.open("", "_blank", "width=760,height=900");
    if (!popup) {
      setToast(
        newToast(
          "error",
          "The print window was blocked. Allow popups for this site, then run print again."
        )
      );
      return;
    }

    popup.document.write(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>local-notion-ai report</title>
  <style>
    body { color: #17231f; font-family: system-ui, sans-serif; margin: 32px; }
    pre { white-space: pre-wrap; font: 14px/1.6 ui-monospace, SFMono-Regular, Menlo, monospace; }
  </style>
</head>
<body>
  <pre>${escapeHtml(report)}</pre>
</body>
</html>`);
    popup.document.close();
    popup.focus();
    popup.print();
  }

  async function clearWorkspace(): Promise<void> {
    await store().clear();
    setAiState(null);
    if (typeof window !== "undefined" && window.location.hash.startsWith("#state=")) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }
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
    <div
      className={`min-h-screen bg-paper text-ink ${isDragActive ? "ring-4 ring-inset ring-moss/25" : ""}`}
      onDragEnter={(event) => {
        event.preventDefault();
        setIsDragActive(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragActive(true);
      }}
      onDragLeave={() => setIsDragActive(false)}
      onDrop={handleDrop}
    >
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
            <button className="icon-button" onClick={exportWorkspaceCsv} title="Export CSV">
              <FileSpreadsheet aria-hidden="true" size={17} />
            </button>
            <button
              className="icon-button"
              onClick={() => void shareWorkspace()}
              title="Copy share link"
            >
              <Share2 aria-hidden="true" size={17} />
            </button>
            <button
              className={`icon-button ${showDebug ? "bg-moss/12 text-moss" : ""}`}
              onClick={() => setShowDebug((current) => !current)}
              title="Toggle debug surface"
            >
              <BadgeInfo aria-hidden="true" size={17} />
            </button>
            <button
              className={`icon-button ${showSettings ? "bg-moss/12 text-moss" : ""}`}
              onClick={() => setShowSettings((current) => !current)}
              title="Settings"
            >
              <Settings aria-hidden="true" size={17} />
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

            <div className="space-y-2 rounded border border-ink/10 bg-white p-3">
              <label className="grid gap-1 text-sm">
                <span className="text-xs font-medium uppercase tracking-wide text-ink/55">
                  Paste text or HTML
                </span>
                <textarea
                  className="min-h-24 resize-y rounded border border-ink/15 bg-paper px-3 py-2 text-sm outline-none focus:border-moss"
                  value={pasteText}
                  onInput={(event) => setPasteText(event.currentTarget.value)}
                  aria-label="Paste text or HTML"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button className="tool-button justify-center" onClick={handlePastedTextImport}>
                  <Upload aria-hidden="true" size={16} />
                  <span>Import paste</span>
                </button>
                <button
                  className="tool-button justify-center"
                  onClick={() => void handleClipboardImport()}
                >
                  <Clipboard aria-hidden="true" size={16} />
                  <span>Clipboard</span>
                </button>
              </div>

              <label className="grid gap-1 text-sm">
                <span className="text-xs font-medium uppercase tracking-wide text-ink/55">URL</span>
                <div className="flex gap-2">
                  <input
                    className="min-w-0 flex-1 rounded border border-ink/15 bg-paper px-3 py-2 text-sm outline-none focus:border-moss"
                    value={urlInput}
                    onInput={(event) => setUrlInput(event.currentTarget.value)}
                    placeholder="https://example.com"
                    aria-label="Import URL"
                  />
                  <button
                    className="icon-button"
                    onClick={() => void handleUrlImport()}
                    title="Import URL"
                  >
                    <Link aria-hidden="true" size={16} />
                  </button>
                </div>
              </label>
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
              showNormalizedPreview={settings.showNormalizedPreview}
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

            {showSettings ? <SettingsPanel settings={settings} onChange={updateSettings} /> : null}

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
                  onChange={(event) => {
                    const nextStyle = event.currentTarget.value;
                    if (isRewriteStyle(nextStyle)) {
                      setRewriteStyle(nextStyle);
                    }
                  }}
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
                    <span className="flex-1" />
                    <button
                      className="icon-button"
                      onClick={() => void copyAiOutput()}
                      title="Copy AI output"
                    >
                      <Copy aria-hidden="true" size={15} />
                    </button>
                    <button className="icon-button" onClick={printAiOutput} title="Print AI output">
                      <Printer aria-hidden="true" size={15} />
                    </button>
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
          aria-hidden="true"
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
