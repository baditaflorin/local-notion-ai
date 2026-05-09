import { del, get, set } from "idb-keyval";
import * as Y from "yjs";
import { stableHash } from "../text/text";
import { reanalyzeDocument } from "../../features/analysis/documentAnalysis";
import type { DocumentRecord, ExportBundle, WorkspaceSnapshot } from "../../shared/types";

const STORAGE_KEY = "local-notion-ai:yjs-update:v1";
const META_ACTIVE_ID = "activeDocumentId";
const META_UPDATED_AT = "updatedAt";

type Listener = (snapshot: WorkspaceSnapshot) => void;

export class WorkspaceStore {
  private readonly ydoc = new Y.Doc();
  private readonly documents = this.ydoc.getMap<DocumentRecord>("documents");
  private readonly meta = this.ydoc.getMap<string>("meta");
  private readonly listeners = new Set<Listener>();
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.ydoc.on("update", () => {
      this.schedulePersist();
      this.emit();
    });
  }

  async load(): Promise<WorkspaceSnapshot> {
    const stored = await get<Uint8Array | number[]>(STORAGE_KEY);
    if (stored) {
      Y.applyUpdate(this.ydoc, stored instanceof Uint8Array ? stored : Uint8Array.from(stored));
      this.ydoc.transact(() => {
        for (const [id, document] of this.documents.entries()) {
          this.documents.set(id, reanalyzeDocument(document));
        }
      });
    }

    return this.snapshot();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  snapshot(): WorkspaceSnapshot {
    const documents = Array.from(this.documents.values()).sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt)
    );

    return {
      documents,
      activeDocumentId: this.meta.get(META_ACTIVE_ID) ?? documents[0]?.id ?? null,
      updatedAt: this.meta.get(META_UPDATED_AT) ?? null
    };
  }

  upsertDocument(document: DocumentRecord, makeActive = true): void {
    const updatedDocument = reanalyzeDocument({
      ...document,
      updatedAt: new Date().toISOString()
    });

    this.ydoc.transact(() => {
      this.documents.set(updatedDocument.id, updatedDocument);
      this.meta.set(META_UPDATED_AT, updatedDocument.updatedAt);
      if (makeActive) {
        this.meta.set(META_ACTIVE_ID, updatedDocument.id);
      }
    });
  }

  addDocuments(documents: DocumentRecord[]): void {
    if (documents.length === 0) {
      return;
    }

    this.ydoc.transact(() => {
      for (const document of documents) {
        this.documents.set(document.id, reanalyzeDocument(document));
      }
      this.meta.set(META_ACTIVE_ID, documents[documents.length - 1]?.id ?? documents[0]?.id);
      this.meta.set(META_UPDATED_AT, new Date().toISOString());
    });
  }

  setActiveDocument(id: string): void {
    if (!this.documents.has(id)) {
      return;
    }

    this.meta.set(META_ACTIVE_ID, id);
  }

  removeDocument(id: string): void {
    this.ydoc.transact(() => {
      this.documents.delete(id);
      const remaining = Array.from(this.documents.keys());
      if (this.meta.get(META_ACTIVE_ID) === id) {
        this.meta.set(META_ACTIVE_ID, remaining[0] ?? "");
      }
      this.meta.set(META_UPDATED_AT, new Date().toISOString());
    });
  }

  async clear(): Promise<void> {
    this.ydoc.transact(() => {
      for (const id of Array.from(this.documents.keys())) {
        this.documents.delete(id);
      }
      this.meta.delete(META_ACTIVE_ID);
      this.meta.set(META_UPDATED_AT, new Date().toISOString());
    });
    await del(STORAGE_KEY);
  }

  exportBundle(build: { version: string; commit: string }): ExportBundle {
    const documents = this.snapshot().documents;
    return {
      schemaVersion: 2,
      exportedAt: new Date().toISOString(),
      appVersion: build.version,
      appCommit: build.commit,
      exportDigest: stableHash(
        JSON.stringify(
          documents.map((document) => ({
            id: document.id,
            digest: document.analysis?.sourceDigest ?? document.id,
            updatedAt: document.updatedAt
          }))
        )
      ),
      documents
    };
  }

  importBundle(bundle: ExportBundle): void {
    this.ydoc.transact(() => {
      for (const document of bundle.documents) {
        this.documents.set(document.id, reanalyzeDocument(document));
      }
      this.meta.set(META_ACTIVE_ID, bundle.documents[0]?.id ?? "");
      this.meta.set(META_UPDATED_AT, new Date().toISOString());
    });
  }

  private schedulePersist(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }

    this.saveTimer = setTimeout(() => {
      const update = Y.encodeStateAsUpdate(this.ydoc);
      void set(STORAGE_KEY, update);
      this.saveTimer = null;
    }, 80);
  }

  private emit(): void {
    const snapshot = this.snapshot();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}
