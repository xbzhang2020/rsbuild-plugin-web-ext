if (typeof browser === 'undefined' && typeof chrome !== 'undefined') {
  globalThis.browser = chrome;
}

if (typeof browser !== 'undefined') {
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (typeof message !== 'object') return;

    if (message.type === 'web-extend:reload-extension') {
      console.log('contentChanged', contentChanged);
      if (contentChanged) {
        reloadExtension();
      }
      sendResponse({ type: 'ok' });
      return;
    }

    if (message.type === 'web-extend:execute-script') {
      const tabId = sender.tab?.id;
      const file = message.file;
      if (tabId && file) {
        browser.scripting
          .executeScript({
            target: { tabId },
            files: [file],
          })
          .then(() => {
            sendResponse({ code: 0 });
          })
          .catch((error) => {
            sendResponse({ code: -1, error });
          });
      }
      return true;
    }
  });

  browser.commands.onCommand.addListener((command) => {
    if (command === 'web-extend:reload-extension') {
      reloadExtension();
    }
  });
}

/**
 * forked from https://github.com/web-infra-dev/rsbuild/blob/main/packages/core/src/client/hmr.ts
 */
// inject by runtime
const compilationId = null;
const config = RSBUILD_CLIENT_CONFIG;

let connection = null;
let reconnectCount = 0;

let isFirstCompilation = true;
// let lastCompilationHash = null;
let hasCompileErrors = false;
let contentChanged = false;

function formatURL({ port, protocol, hostname, pathname }) {
  if (typeof URL !== 'undefined') {
    const url = new URL('http://localhost');
    url.port = String(port);
    url.hostname = hostname;
    url.protocol = protocol;
    url.pathname = pathname;
    if (compilationId) {
      url.searchParams.append('compilationId', compilationId);
    }
    return url.toString();
  }

  // compatible with IE11
  const colon = protocol.indexOf(':') === -1 ? ':' : '';
  return `${protocol}${colon}//${hostname}:${port}${pathname}`;
}

function clearOutdatedErrors() {
  // Clean up outdated compile errors, if any.
  if (console.clear && hasCompileErrors) {
    console.clear();
  }
}

// Successful compilation.
function handleSuccess() {
  clearOutdatedErrors();

  const isHotUpdate = !isFirstCompilation;
  isFirstCompilation = false;
  hasCompileErrors = false;

  // Attempt to apply hot updates or reload.
  if (isHotUpdate) {
    reloadExtension();
  }
}

function handleWarnings({ text }) {
  clearOutdatedErrors();

  const isHotUpdate = !isFirstCompilation;
  isFirstCompilation = false;
  hasCompileErrors = false;

  for (let i = 0; i < text.length; i++) {
    if (i === 5) {
      console.warn('There were more warnings in other files, you can find a complete log in the terminal.');
      break;
    }
    console.warn(text[i]);
  }

  // Attempt to apply hot updates or reload.
  if (isHotUpdate) {
    reloadExtension();
  }
}

// Compilation with errors (e.g. syntax error or missing modules).
function handleErrors({ text }) {
  clearOutdatedErrors();

  isFirstCompilation = false;
  hasCompileErrors = true;

  // Also log them to the console.
  for (const error of text) {
    console.error(error);
  }
}

function connect() {
  const { location } = self;
  const { host, port, path, protocol } = config;
  const socketUrl = formatURL({
    protocol: protocol || (location.protocol === 'https:' ? 'wss' : 'ws'),
    hostname: host || location.hostname,
    port: port || location.port,
    pathname: path || '/rsbuild-hmr',
  });

  connection = new WebSocket(socketUrl);
  connection.addEventListener('open', onOpen);
  // Attempt to reconnect after disconnection
  connection.addEventListener('close', onClose);
  // Handle messages from the server.
  connection.addEventListener('message', onMessage);
}

function onOpen() {
  // Notify users that the HMR has successfully connected.
  console.info('[HMR] connected.');
}

function onMessage(e) {
  const message = JSON.parse(e.data);
  console.log(message);
  // if (message.compilationId && message.compilationId !== compilationId) {
  //   return;
  // }

  switch (message.type) {
    case 'hash':
      // Update the last compilation hash
      // lastCompilationHash = message.data;
      break;
    case 'still-ok':
    case 'ok':
      contentChanged = true;
      // handleSuccess();
      break;
    // Triggered when static files changed
    case 'static-changed':
    case 'content-changed':
      contentChanged = true;
      // reloadExtension();
      break;
    case 'warnings':
      contentChanged = true;
      // handleWarnings(message.data);
      break;
    case 'errors':
      contentChanged = true;
      // handleErrors(message.data);
      break;
  }
}

function onClose() {
  if (reconnectCount >= config.reconnect) {
    if (config.reconnect > 0) {
      console.info('[HMR] Connection failure after maximum reconnect limit exceeded.');
    }
    return;
  }

  console.info('[HMR] disconnected. Attempting to reconnect.');
  removeListeners();
  connection = null;
  reconnectCount++;
  setTimeout(connect, 1000 * 1.5 ** reconnectCount);
}

function removeListeners() {
  if (connection) {
    connection.removeEventListener('open', onOpen);
    connection.removeEventListener('close', onClose);
    connection.removeEventListener('message', onMessage);
  }
}

function reloadExtension() {
  console.log('reload');
  // browser.runtime.reload();
}

connect();
