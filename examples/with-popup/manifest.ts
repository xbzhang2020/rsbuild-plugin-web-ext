const manifest: chrome.runtime.ManifestV3 = {
  manifest_version: 3,
  name: 'With popup',
  description: 'A basic browser extension',
  version: '1.0',
  action: {
    default_icon: {
      16: './hello_extensions.png',
    },
    default_popup: './popup.ts',
  },
};

export default manifest;
