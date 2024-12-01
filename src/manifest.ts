export type ManifestV3 = chrome.runtime.ManifestV3 & {
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
