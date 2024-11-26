export interface ManifestV3 extends chrome.runtime.ManifestV3 {
  background:
    | {
        service_worker?: string; // chrome, safari
        scripts?: string[]; // firefox
        type?: 'module';
      }
    | undefined;
}
