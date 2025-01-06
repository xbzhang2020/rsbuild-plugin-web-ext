import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import type { ContentScriptConfig } from "rsbuild-plugin-web-ext";

const rootEl = document.createElement("div");
document.body.appendChild(rootEl);

if (rootEl) {
  const root = createRoot(rootEl);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

export const config: ContentScriptConfig = {
  matches: ["https://developer.mozilla.org/*"],
};
