import { copyFile } from "node:fs/promises";

await copyFile("docs/index.html", "docs/404.html");
