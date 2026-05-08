import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));

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

const env = {
  ...process.env,
  VITE_APP_VERSION: process.env.VITE_APP_VERSION ?? packageJson.version,
  VITE_GIT_COMMIT: gitCommit(),
  VITE_REPOSITORY_URL:
    process.env.VITE_REPOSITORY_URL ?? "https://github.com/baditaflorin/local-notion-ai",
  VITE_PAYPAL_URL: process.env.VITE_PAYPAL_URL ?? "https://www.paypal.com/paypalme/florinbadita"
};

const bin = process.platform === "win32" ? ".cmd" : "";

execFileSync("node", ["scripts/clean-pages.mjs"], { stdio: "inherit", env });
execFileSync(`node_modules/.bin/tsc${bin}`, ["--noEmit"], { stdio: "inherit", env });
execFileSync(`node_modules/.bin/vite${bin}`, ["build"], { stdio: "inherit", env });
execFileSync("node", ["scripts/write-version.mjs"], { stdio: "inherit", env });
execFileSync("node", ["scripts/write-fallback.mjs"], { stdio: "inherit", env });
