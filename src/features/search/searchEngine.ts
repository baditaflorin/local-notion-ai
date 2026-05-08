import MiniSearch from "minisearch";
import { clip } from "../../lib/text/text";
import type { DocumentRecord, SearchResult } from "../../shared/types";

type IndexedDocument = {
  id: string;
  title: string;
  content: string;
};

export class LocalSearchIndex {
  private readonly miniSearch: MiniSearch<IndexedDocument>;
  private readonly documentsById: Map<string, DocumentRecord>;

  constructor(documents: DocumentRecord[]) {
    this.documentsById = new Map(documents.map((document) => [document.id, document]));
    this.miniSearch = new MiniSearch<IndexedDocument>({
      fields: ["title", "content"],
      storeFields: ["title", "content"],
      searchOptions: {
        boost: { title: 2 },
        fuzzy: 0.2,
        prefix: true
      }
    });

    this.miniSearch.addAll(
      documents.map((document) => ({
        id: document.id,
        title: document.title,
        content: document.content
      }))
    );
  }

  search(query: string, limit = 8): SearchResult[] {
    const trimmed = query.trim();
    if (!trimmed) {
      return Array.from(this.documentsById.values())
        .slice(0, limit)
        .map((document) => ({
          id: document.id,
          title: document.title,
          excerpt: clip(document.content, 180),
          score: 1
        }));
    }

    return this.miniSearch
      .search(trimmed)
      .slice(0, limit)
      .map((result) => {
        const document = this.documentsById.get(String(result.id));
        return {
          id: String(result.id),
          title: String(result.title ?? document?.title ?? "Untitled"),
          excerpt: clip(document?.content ?? String(result.content ?? ""), 220),
          score: result.score
        };
      });
  }
}
