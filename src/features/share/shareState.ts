import { z } from "zod";
import { parseExportBundle } from "../workspace/importDocuments";
import type { DocumentRecord, ExportBundle } from "../../shared/types";

const SHARE_PREFIX = "state=";
const MAX_SHARE_URL_LENGTH = 60000;

const shareStateSchema = z.object({
  schemaVersion: z.literal(1),
  bundle: z.object({
    schemaVersion: z.literal(2),
    exportedAt: z.string(),
    appVersion: z.string(),
    appCommit: z.string(),
    exportDigest: z.string(),
    documents: z.array(z.unknown())
  })
});

export type ShareResult =
  | { ok: true; url: string }
  | { ok: false; title: string; why: string; nextStep: string };

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64ToBytes(value: string): Uint8Array {
  const padded = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function encodeShareBundle(bundle: ExportBundle): string {
  const payload = JSON.stringify({ schemaVersion: 1, bundle });
  return `${SHARE_PREFIX}${bytesToBase64(new TextEncoder().encode(payload))}`;
}

export function decodeShareHash(hash: string): ExportBundle | null {
  const withoutHash = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!withoutHash.startsWith(SHARE_PREFIX)) {
    return null;
  }

  const decoded = new TextDecoder().decode(base64ToBytes(withoutHash.slice(SHARE_PREFIX.length)));
  const parsed = shareStateSchema.safeParse(JSON.parse(decoded));
  if (!parsed.success) {
    return null;
  }

  return parseExportBundle(JSON.stringify(parsed.data.bundle));
}

export function shareUrlForBundle(
  bundle: ExportBundle,
  currentHref: string,
  limit = MAX_SHARE_URL_LENGTH
): ShareResult {
  const url = new URL(currentHref);
  url.search = "";
  url.hash = encodeShareBundle(bundle);
  const nextUrl = url.toString();

  if (nextUrl.length > limit) {
    return {
      ok: false,
      title: "The workspace is too large for a share link.",
      why: `This browser URL would be ${nextUrl.length.toLocaleString()} characters, above the ${limit.toLocaleString()} character safety limit.`,
      nextStep: "Use the JSON workspace export instead."
    };
  }

  return { ok: true, url: nextUrl };
}

export function documentsFromShareHash(hash: string): DocumentRecord[] {
  return decodeShareHash(hash)?.documents ?? [];
}
