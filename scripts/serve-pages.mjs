import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const root = normalize(join(process.cwd(), "docs"));
const base = "/local-notion-ai/";
const port = Number(process.env.PORT ?? "4173");

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".md", "text/markdown; charset=utf-8"]
]);

function resolvePath(urlPath) {
  const pathWithinBase = urlPath.startsWith(base)
    ? urlPath.slice(base.length)
    : urlPath.replace(/^\/+/, "");
  const safePath = normalize(pathWithinBase).replace(/^(\.\.(\/|\\|$))+/, "");
  const candidate = join(root, safePath || "index.html");

  if (existsSync(candidate) && statSync(candidate).isFile()) {
    return candidate;
  }

  return join(root, "index.html");
}

const server = createServer((request, response) => {
  const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
  if (requestUrl.pathname === "/") {
    response.writeHead(302, { Location: base });
    response.end();
    return;
  }

  const filePath = resolvePath(requestUrl.pathname);
  response.setHeader(
    "content-type",
    mimeTypes.get(extname(filePath)) ?? "application/octet-stream"
  );
  createReadStream(filePath).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`Serving docs at http://127.0.0.1:${port}${base}\n`);
});
