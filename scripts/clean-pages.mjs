import { rm } from "node:fs/promises";

const generatedPaths = [
  "docs/assets",
  "docs/index.html",
  "docs/404.html",
  "docs/icon.svg",
  "docs/manifest.webmanifest",
  "docs/sw.js",
  "docs/version.json"
];

await Promise.all(generatedPaths.map((target) => rm(target, { recursive: true, force: true })));
