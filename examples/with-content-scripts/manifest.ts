const manifest: chrome.runtime.ManifestV3 = {
  manifest_version: 3,
  name: 'With content scripts',
  description: 'A basic browser extension',
  version: '1.0',
  // content_scripts: [
  //   {
  //     js: ['./content.ts'],
  //     matches: ['<all_urls>'],
  //   },
  // ],
};

export default manifest;
