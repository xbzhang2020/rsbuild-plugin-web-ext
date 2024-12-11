export type ManifestV2 = chrome.runtime.ManifestV2;

export type ManifestV3 = chrome.runtime.ManifestV3;

export type Manifest = ManifestV3 | ManifestV2;

export type ContentScriptConfig = {
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

export type PluginWebExtOptions<T = object> = {
  manifest?: T;
  srcDir?: string;
  target?: BrowserTarget;
};
