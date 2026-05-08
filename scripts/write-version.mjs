import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));

function gitCommit() {
  if (process.env.VITE_GIT_COMMIT) {
    return process.env.VITE_GIT_COMMIT;
  }

  try {
    return execFileSync("git", ["rev-parse", "--short=12", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    return "local";
  }
}

const metadata = {
  version: process.env.VITE_APP_VERSION ?? packageJson.version,
  commit: gitCommit(),
  repositoryUrl:
    process.env.VITE_REPOSITORY_URL ?? "https://github.com/baditaflorin/local-notion-ai",
  paypalUrl: process.env.VITE_PAYPAL_URL ?? "https://www.paypal.com/paypalme/florinbadita",
  builtAt: new Date().toISOString()
};

await writeFile("docs/version.json", `${JSON.stringify(metadata, null, 2)}\n`);
