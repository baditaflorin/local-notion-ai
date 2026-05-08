import { render } from "preact";
import { App } from "./App";
import "./styles.css";

const app = document.getElementById("app");

if (!app) {
  throw new Error("Missing app root");
}

render(<App />, app);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/local-notion-ai/sw.js", { scope: "/local-notion-ai/" });
  });
}
