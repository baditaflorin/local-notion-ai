import { performance } from "node:perf_hooks";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { analyzeDocumentInput } from "../src/features/analysis/documentAnalysis";

const fixturesDir = path.join(process.cwd(), "tests/fixtures/realdata");
const fixtureFiles = readdirSync(fixturesDir).filter(
  (file) => !file.endsWith(".expected.json") && file !== "broken-export.json"
);

const samples = fixtureFiles.map((file) => {
  const raw = readFileSync(path.join(fixturesDir, file), "utf8");
  const startedAt = performance.now();
  analyzeDocumentInput({ sourceName: file, rawContent: raw });
  return {
    file,
    ms: performance.now() - startedAt
  };
});

const times = samples
  .map((sample) => sample.ms)
  .slice()
  .sort((left, right) => left - right);

const median = times[Math.floor(times.length / 2)] ?? 0;
const p95 = times[Math.max(0, Math.ceil(times.length * 0.95) - 1)] ?? 0;
const worst = times[times.length - 1] ?? 0;

process.stdout.write(
  `${JSON.stringify(
    {
      samples,
      median,
      p95,
      worst
    },
    null,
    2
  )}\n`
);
