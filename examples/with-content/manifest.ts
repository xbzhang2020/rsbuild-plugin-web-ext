const manifest: chrome.runtime.ManifestV3 = {
  manifest_version: 3,
  name: 'With content scripts',
  description: 'A basic browser extension',
  version: '1.0',
  permissions: ['scripting', 'activeTab'],
  host_permissions: ['<all_urls>'],
};

export default manifest;
