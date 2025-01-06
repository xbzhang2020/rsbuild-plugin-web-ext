import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import type { ContentScriptConfig } from 'rsbuild-plugin-web-ext';
import App from './App';

const rootEl = document.createElement('div');
document.body.appendChild(rootEl);

if (rootEl) {
  const root = createRoot(rootEl);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

export const config: ContentScriptConfig = {
  matches: ['https://developer.mozilla.org/*'],
};
