const manifest: chrome.runtime.ManifestV3 = {
  manifest_version: 3,
  name: 'With options',
  description: 'A basic browser extension',
  version: '1.0',
  options_ui: {
    page: './options',
    open_in_tab: true,
  },
};

export default manifest;
