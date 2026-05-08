import {
  BookOpen,
  Download,
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
  Upload
} from "lucide-preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { answerQuestion, rewriteText, summarizeDocuments } from "./features/ai/nlp";
import { LocalSearchIndex } from "./features/search/searchEngine";
import {
  createSampleDocuments,
  documentsFromFiles,
  parseExportBundle
} from "./features/workspace/importDocuments";
import { downloadJson } from "./lib/download/download";
import { WorkspaceStore } from "./lib/storage/workspaceStore";
import { buildInfo } from "./lib/version/buildInfo";
import type {
  DocumentRecord,
  RewriteStyle,
  SearchResult,
  ToastMessage,
  WorkspaceSnapshot
} from "./shared/types";

type AiMode = "summary" | "rewrite" | "qa";

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

export function App() {
  const storeRef = useRef<WorkspaceStore | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [snapshot, setSnapshot] = useState<WorkspaceSnapshot>(emptySnapshot);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [aiMode, setAiMode] = useState<AiMode>("summary");
  const [rewriteStyle, setRewriteStyle] = useState<RewriteStyle>("clear");
  const [question, setQuestion] = useState("What matters most in these docs?");
  const [aiOutput, setAiOutput] = useState("");
  const [toast, setToast] = useState<ToastMessage | null>(null);

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

    try {
      const documents = await documentsFromFiles(files);
      store().addDocuments(documents);
      setToast(
        newToast(
          "success",
          `Imported ${documents.length} document${documents.length === 1 ? "" : "s"}.`
        )
      );
    } catch {
      setToast(newToast("error", "Import failed. Try plain text, Markdown, or exported JSON."));
    } finally {
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
      const bundle = parseExportBundle(await file.text());
      store().importBundle(bundle);
      setToast(newToast("success", `Restored ${bundle.documents.length} documents.`));
    } catch {
      setToast(newToast("error", "That file is not a valid local-notion-ai export."));
    } finally {
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
    if (aiMode === "summary") {
      setAiOutput(
        summarizeDocuments(activeDocuments.length > 0 ? activeDocuments : snapshot.documents)
      );
      return;
    }

    if (aiMode === "rewrite") {
      setAiOutput(rewriteText(selectedDocument?.content ?? "", rewriteStyle));
      return;
    }

    const result = answerQuestion(question, snapshot.documents);
    setAiOutput(result.answer);
  }

  function exportWorkspace(): void {
    downloadJson("local-notion-ai-export.json", store().exportBundle());
    setToast(newToast("success", "Workspace export started."));
  }

  async function clearWorkspace(): Promise<void> {
    await store().clear();
    setAiOutput("");
    setToast(newToast("success", "Local workspace cleared."));
  }

  function loadSamples(): void {
    store().addDocuments(createSampleDocuments());
    setToast(newToast("success", "Loaded sample documents."));
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

            <button className="primary-button" onClick={runAi}>
              <RefreshCw aria-hidden="true" size={17} />
              <span>Run locally</span>
            </button>

            <div className="min-h-72 flex-1 whitespace-pre-wrap rounded border border-ink/10 bg-white p-4 text-sm leading-6 shadow-soft">
              {aiOutput || "Results appear here."}
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
        accept=".txt,.md,.markdown,.csv,.json,.html"
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
          className={`fixed bottom-4 left-1/2 z-30 -translate-x-1/2 rounded px-4 py-3 text-sm shadow-soft ${toast.tone}`}
        >
          {toast.text}
        </div>
      ) : null}
    </div>
  );
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
      <span className="block truncate text-sm font-semibold">{result.title}</span>
      <span className="mt-1 line-clamp-2 block text-xs leading-5 text-ink/60">
        {result.excerpt}
      </span>
    </button>
  );
}

function DocumentEditor({
  document,
  onChange,
  onRemove
}: {
  document: DocumentRecord;
  onChange: (patch: Partial<Pick<DocumentRecord, "title" | "content">>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex h-full min-h-[560px] flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-ink/10 p-4">
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
      <textarea
        className="min-h-[500px] flex-1 resize-none p-5 font-mono text-sm leading-6 outline-none"
        value={document.content}
        onInput={(event) => onChange({ content: event.currentTarget.value })}
        aria-label="Document content"
      />
    </div>
  );
}
