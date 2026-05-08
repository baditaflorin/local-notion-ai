# local-notion-ai

![GitHub Pages](https://img.shields.io/badge/live-GitHub%20Pages-246b5c)
![Mode A](https://img.shields.io/badge/deployment-Mode%20A%20static-c64f4a)
![License MIT](https://img.shields.io/badge/license-MIT-b47d13)

https://baditaflorin.github.io/local-notion-ai/

Offline-first Notion AI alternative for summarizing, rewriting, and querying your local workspace.

The app runs locally in the browser, keeps user documents in browser storage, and exposes no runtime backend.

![Screenshot](https://raw.githubusercontent.com/baditaflorin/local-notion-ai/main/docs/screenshot.png)

## Quickstart

```sh
make install-hooks
make dev
make test
make build
make pages-preview
```

## Links

Live site:

https://baditaflorin.github.io/local-notion-ai/

Repository:

https://github.com/baditaflorin/local-notion-ai

Support:

https://www.paypal.com/paypalme/florinbadita

## Architecture

```mermaid
flowchart LR
  pages["GitHub Pages static assets"] --> browser["Browser app"]
  browser --> indexeddb["IndexedDB + Yjs updates"]
  browser --> search["Local search index"]
  browser --> ai["Local summarize/rewrite/Q&A"]
```

Architecture docs:

https://github.com/baditaflorin/local-notion-ai/blob/main/docs/architecture.md

ADRs:

https://github.com/baditaflorin/local-notion-ai/tree/main/docs/adr

Deploy guide:

https://github.com/baditaflorin/local-notion-ai/blob/main/docs/deploy.md
