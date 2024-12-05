export type Manifest = chrome.runtime.ManifestV3 & {
  manifest_version: 3 | 2;
  background?:
    | {
        service_worker?: string; // chrome, safari
        scripts?: string[]; // firefox
        type?: 'module';
      }
    | undefined;
};

export type ContentConfig = {
  matches?: string[] | undefined;
  exclude_matches?: string[] | undefined;
  css?: string[] | undefined;
  js?: string[] | undefined;
  run_at?: string | undefined;
  all_frames?: boolean | undefined;
  match_about_blank?: boolean | undefined;
  include_globs?: string[] | undefined;
  exclude_globs?: string[] | undefined;
  world?: 'ISOLATED' | 'MAIN' | undefined;
};

export type BrowserTarget = 'chrome-mv3' | 'firefox-mv2' | 'firefox-mv3' | 'safari-mv3';
