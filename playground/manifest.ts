const manifest: chrome.runtime.ManifestV3 = {
  manifest_version: 3,
  name: 'Hello Extensions',
  description: 'Base Level Extension',
  version: '1.0',
  content_scripts: [
    {
      js: ['./src/content.ts'],
      matches: ['<all_urls>'],
    },
  ],
  action: {
    default_popup: './src/popup.ts',
  },
};

export default manifest;
