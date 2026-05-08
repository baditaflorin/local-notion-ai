import { expect, test } from "@playwright/test";
import path from "node:path";

test("imports a document and runs local Q&A", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByRole("heading", { name: "local-notion-ai" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Star on GitHub/i })).toHaveAttribute(
    "href",
    "https://github.com/baditaflorin/local-notion-ai"
  );

  await page.getByRole("button", { name: /Load samples/i }).click();
  await page.getByLabel("Search local documents").fill("PayPal");
  await expect(page.getByText("Notion AI replacement checklist")).toBeVisible();

  await page.getByRole("button", { name: "Q&A" }).click();
  await page.getByLabel("Question").fill("Where should the repository link point?");
  await page.getByRole("button", { name: /Run locally/i }).click();
  await expect(page.getByText(/GitHub/i).last()).toBeVisible();

  await page.setInputFiles(
    "input[accept='.txt,.md,.markdown,.csv,.json,.html']",
    path.join(process.cwd(), "tests/fixtures/import-note.md")
  );
  await page.getByLabel("Search local documents").fill("");
  await expect(page.getByText("import note")).toBeVisible();
});
