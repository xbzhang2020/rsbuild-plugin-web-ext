export type ManifestV3 = chrome.runtime.ManifestV3 & {
  background?:
    | {
        service_worker?: string; // chrome, safari
        scripts?: string[]; // firefox
        type?: 'module';
      }
    | undefined;
};

export function getDefaultManifest(): ManifestV3 {
  return {
    manifest_version: 3,
    name: '',
    version: '',
  };
}
