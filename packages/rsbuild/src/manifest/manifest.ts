import type { Dirent } from 'node:fs';

export type BuildMode = 'development' | 'production' | 'none' | undefined;

export type ManifestV2 = chrome.runtime.ManifestV2;

export type ManifestV3 = chrome.runtime.ManifestV3;

export type ManifestBase = ManifestV3 | ManifestV2;

export interface SidePanel {
  default_path?: string;
}

export interface SidebarAction {
  default_title?: string;
  default_panel?: string;
  default_icon?: string;
}

export type Manifest = ManifestBase & {
  side_panel?: SidePanel;
  sidebar_action?: SidebarAction;
};

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

export type PageToOverride = 'newtab' | 'history' | 'bookmarks';

export type ManifestEntryKey =
  | 'background'
  | 'content'
  | 'popup'
  | 'options'
  | 'devtools'
  | 'sandbox'
  | 'icons'
  | 'overrides'
  | 'sidepanel';

export type ManifestEntry = Record<
  string,
  {
    import?: string | string[];
    html?: boolean;
  }
>;

export type ManifestEntryPoint = {
  entryPath?: string | string[];
  assets?: string[]; // js, css...
};

export type ManifestEntryPoints = Record<string, ManifestEntryPoint>;

export type ManifestEntryProcessor = {
  key: ManifestEntryKey;
  match: (entryName: string) => boolean;
  merge: (props: NormalizeMainfestEntryProps) => void | Promise<void>;
  read: (manifest?: Manifest) => ManifestEntry | null;
  write: (props: WriteMainfestEntryProps) => void | Promise<void>;
};

export interface NormalizeManifestProps {
  rootPath: string;
  selfRootPath: string;
  mode: BuildMode;
  manifest?: Manifest;
  srcDir?: string;
  target?: BrowserTarget;
}

export interface NormalizeMainfestEntryProps extends Required<NormalizeManifestProps> {
  files: Dirent[];
}

export interface WriteMainfestEntryProps {
  manifest: Manifest;
  rootPath: string;
  entryName: string;
  entryPath: ManifestEntryPoint['entryPath'];
  assets: ManifestEntryPoint['assets'];
}

