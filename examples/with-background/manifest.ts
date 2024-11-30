const manifest: chrome.runtime.ManifestV3 = {
  manifest_version: 3,
  name: 'With background',
  description: 'A basic browser extension',
  version: '1.0',
  background: {
    service_worker: './background.ts',
  },
};

export default manifest;
