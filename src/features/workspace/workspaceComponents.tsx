import { AlertTriangle, FileSearch, PencilLine, Settings, Trash2 } from "lucide-preact";
import { labelForConfidence, percentLabel } from "../../lib/ui/labels";
import type { UserSettings } from "../../lib/settings/settingsStore";
import type { DocumentRecord, SearchResult } from "../../shared/types";

export function SettingsPanel({
  settings,
  onChange
}: {
  settings: UserSettings;
  onChange: (patch: Partial<UserSettings>) => void;
}) {
  return (
    <div className="space-y-3 rounded border border-ink/10 bg-white p-3 text-sm">
      <div className="flex items-center gap-2 font-semibold">
        <Settings aria-hidden="true" size={16} />
        Settings
      </div>
      <label className="flex items-center justify-between gap-3">
        <span>Open debug by default</span>
        <input
          type="checkbox"
          checked={settings.debugByDefault}
          onChange={(event) => onChange({ debugByDefault: event.currentTarget.checked })}
        />
      </label>
      <label className="flex items-center justify-between gap-3">
        <span>Auto-summary after import</span>
        <input
          type="checkbox"
          checked={settings.autoRunSummaryAfterImport}
          onChange={(event) => onChange({ autoRunSummaryAfterImport: event.currentTarget.checked })}
        />
      </label>
      <label className="flex items-center justify-between gap-3">
        <span>Normalized preview</span>
        <input
          type="checkbox"
          checked={settings.showNormalizedPreview}
          onChange={(event) => onChange({ showNormalizedPreview: event.currentTarget.checked })}
        />
      </label>
    </div>
  );
}

export function DocumentRow({
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

export function DocumentEditor({
  document,
  onChange,
  onRemove,
  showDebug,
  showNormalizedPreview
}: {
  document: DocumentRecord;
  onChange: (patch: Partial<Pick<DocumentRecord, "title" | "content">>) => void;
  onRemove: () => void;
  showDebug: boolean;
  showNormalizedPreview: boolean;
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

            {showNormalizedPreview ? (
              <div className="rounded border border-ink/10 bg-white p-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/55">
                  Normalized preview
                </div>
                <div className="whitespace-pre-wrap text-xs leading-5 text-ink/70">
                  {analysis.normalizedText.slice(0, 600) || "No normalized text available."}
                </div>
              </div>
            ) : null}
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
