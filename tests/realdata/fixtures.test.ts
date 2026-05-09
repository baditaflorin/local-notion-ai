import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { analyzeDocumentInput } from "../../src/features/analysis/documentAnalysis";
import { answerQuestion, summarizeDocuments } from "../../src/features/ai/nlp";
import {
  createDocument,
  describeImportError,
  parseExportBundle
} from "../../src/features/workspace/importDocuments";

const fixturesDir = path.join(process.cwd(), "tests/fixtures/realdata");

const fixtureExpectationSchema = z.object({
  kind: z.string().optional(),
  minConfidence: z.number().optional(),
  normalizedIncludes: z.array(z.string()).optional(),
  warningsIncludeCodes: z.array(z.string()).optional(),
  summaryIncludes: z.array(z.string()).optional(),
  question: z.string().optional(),
  answerIncludes: z.array(z.string()).optional(),
  errorTitle: z.string().optional(),
  errorIncludes: z.array(z.string()).optional()
});

function baseName(fileName: string): string {
  return fileName.replace(/\.expected\.json$/, "").replace(/\.[^.]+$/, "");
}

describe("real-data fixtures", () => {
  const expectedFiles = readdirSync(fixturesDir).filter((file) => file.endsWith(".expected.json"));

  for (const expectedFile of expectedFiles) {
    const fixtureName = baseName(expectedFile);
    const fixturePath = readdirSync(fixturesDir).find(
      (file) => baseName(file) === fixtureName && !file.endsWith(".expected.json")
    );

    it(`handles ${fixtureName} deterministically`, () => {
      const expectation = fixtureExpectationSchema.parse(
        JSON.parse(readFileSync(path.join(fixturesDir, expectedFile), "utf8"))
      );
      const sourcePath = path.join(fixturesDir, fixturePath!);
      const raw = readFileSync(sourcePath, "utf8");

      if (expectation.errorTitle) {
        try {
          parseExportBundle(raw);
          throw new Error("Expected parseExportBundle to throw");
        } catch (error) {
          const detail = describeImportError(error);
          expect(detail.title).toBe(expectation.errorTitle);
          for (const piece of expectation.errorIncludes ?? []) {
            expect(`${detail.why} ${detail.nextStep}`).toContain(piece);
          }
        }
        return;
      }

      const first = analyzeDocumentInput({
        sourceName: path.basename(sourcePath),
        rawContent: raw
      });
      const second = analyzeDocumentInput({
        sourceName: path.basename(sourcePath),
        rawContent: raw
      });

      expect(first.analysis.kind).toBe(expectation.kind);
      expect(first.analysis.kindConfidence).toBeGreaterThanOrEqual(expectation.minConfidence ?? 0);
      expect(first.analysis).toEqual(second.analysis);

      for (const snippet of expectation.normalizedIncludes ?? []) {
        expect(first.analysis.normalizedText).toContain(snippet);
      }

      for (const code of expectation.warningsIncludeCodes ?? []) {
        expect(first.analysis.warnings.map((warning) => warning.code)).toContain(code);
      }

      const document = createDocument(path.basename(sourcePath), raw, path.basename(sourcePath));
      const summary = summarizeDocuments([document]);
      for (const snippet of expectation.summaryIncludes ?? []) {
        expect(summary.text).toContain(snippet);
      }

      if (expectation.question) {
        const answer = answerQuestion(expectation.question, [document]);
        for (const snippet of expectation.answerIncludes ?? []) {
          expect(answer.answer).toContain(snippet);
        }
      }
    });
  }
});
