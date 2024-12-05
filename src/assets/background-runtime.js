// injected by rsbuild
const config = RSBUILD_CLIENT_CONFIG;
const liveReload = RSBUILD_DEV_LIVE_RELOAD;

let hasCompileErrors = false;

function clearOutdatedErrors() {
  if (console.clear && hasCompileErrors) {
    console.clear();
  }
}

function handleSuccess() {
  clearOutdatedErrors();
  hasCompileErrors = false;
  tryApplyUpdates();
}

function handleWarnings(warnings) {
  clearOutdatedErrors();
  hasCompileErrors = false;
  for (let i = 0; i < warnings.length; i++) {
    if (i === 5) {
      console.warn('There were more warnings in other files, you can find a complete log in the terminal.');
      break;
    }
    console.warn(formatted.warnings[i]);
  }

  tryApplyUpdates();
}

function handleErrors(errors) {
  clearOutdatedErrors();
  hasCompileErrors = true;
  for (const error of errors) {
    console.error(error);
  }
}

let connection = null;
let reconnectCount = 0;

function onOpen() {
  console.info('[HMR] connected.');
}

function onMessage(e) {
  const message = JSON.parse(e.data);

  switch (message.type) {
    case 'hash':
      break;
    // case 'still-ok':
    case 'ok':
      handleSuccess();
      break;
    case 'static-changed':
    case 'content-changed':
      reloadExtension();
      break;
    case 'warnings':
      handleWarnings(message.data);
      break;
    case 'errors':
      handleErrors(message.data);
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

function connect() {
  const { host, port, path, protocol } = config;
  const socketUrl = formatURL({
    protocol: protocol,
    hostname: host,
    port: port,
    pathname: path || '/rsbuild-hmr',
  });

  connection = new WebSocket(socketUrl);
  connection.addEventListener('open', onOpen);
  connection.addEventListener('close', onClose);
  connection.addEventListener('message', onMessage);
}

function removeListeners() {
  if (connection) {
    connection.removeEventListener('open', onOpen);
    connection.removeEventListener('close', onClose);
    connection.removeEventListener('message', onMessage);
  }
}

function tryApplyUpdates() {
  reloadExtension();
}

function reloadExtension() {
  if (!liveReload) return;
  if (typeof chrome !== 'undefined') {
    chrome.runtime.reload();
  } else if (typeof browser !== 'undefined') {
    browser.runtime.reload();
  }
}

function formatURL({ port, protocol, hostname, pathname }) {
  if (typeof URL !== 'undefined') {
    const url = new URL('http://localhost');
    url.port = String(port);
    url.hostname = hostname;
    url.protocol = protocol;
    url.pathname = pathname;
    return url.toString();
  }
  const colon = protocol.indexOf(':') === -1 ? ':' : '';
  return `${protocol}${colon}//${hostname}:${port}${pathname}`;
}
connect();
