import { describe, expect, it } from "vitest";
import { createDocument } from "../workspace/importDocuments";
import { decodeShareHash, encodeShareBundle, shareUrlForBundle } from "./shareState";
import type { ExportBundle } from "../../shared/types";

function bundle(): ExportBundle {
  const document = createDocument("Share me", "Copied notes about local AI.", "share.md");
  return {
    schemaVersion: 2,
    exportedAt: "2026-01-01T00:00:00.000Z",
    appVersion: "0.3.0",
    appCommit: "abc123",
    exportDigest: "h00000000",
    documents: [document]
  };
}

describe("share state", () => {
  it("round-trips a bundle through the hash payload", () => {
    const hash = encodeShareBundle(bundle());
    const decoded = decodeShareHash(`#${hash}`);

    expect(decoded?.documents[0]?.title).toBe("Share me");
  });

  it("rejects oversized share URLs with guidance", () => {
    const result = shareUrlForBundle(bundle(), "https://example.test/local-notion-ai/", 10);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.nextStep).toContain("JSON workspace export");
    }
  });
});
