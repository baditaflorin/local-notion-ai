#!/usr/bin/env bash
set -euo pipefail

npm run build

if [[ -z "${PORT:-}" ]]; then
  PORT="$(
    node -e "const net=require('node:net');const server=net.createServer();server.listen(0,'127.0.0.1',()=>{console.log(server.address().port);server.close();});"
  )"
fi
PLAYWRIGHT_BASE_URL="http://127.0.0.1:${PORT}/local-notion-ai/"
export PORT PLAYWRIGHT_BASE_URL

node scripts/serve-pages.mjs &
SERVER_PID="$!"
trap 'kill "$SERVER_PID" >/dev/null 2>&1 || true' EXIT

for _ in $(seq 1 40); do
  if curl -fsS "$PLAYWRIGHT_BASE_URL" >/dev/null; then
    break
  fi
  if ! kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    echo "Preview server exited before it was ready" >&2
    exit 1
  fi
  sleep 0.25
done

npx playwright test
