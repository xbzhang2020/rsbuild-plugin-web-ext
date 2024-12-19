import type { Dirent } from 'node:fs';
import type { Manifest } from 'webextension-polyfill';

export type BuildMode = 'development' | 'production' | 'none' | undefined;
export type BrowserTarget = 'chrome-mv3' | 'firefox-mv2' | 'firefox-mv3' | 'safari-mv3';

export type WebExtensionManifest = Manifest.WebExtensionManifest & {
  // Firefox doesn't support sandbox
  sandbox?: {
    pages: string[];
    content_security_policy?: string;
  };
  // Firefox doesn't support side_panel, but supports sidebar_action
  side_panel?: {
    default_path?: string;
  };
};

export type ContentScriptConfig = {
  matches: string[];
  exclude_matches?: string[];
  css?: string[];
  js?: string[];
  run_at?: 'document_start' | 'document_end' | 'document_idle';
  all_frames?: boolean;
  match_about_blank?: boolean;
  include_globs?: string[];
  exclude_globs?: string[];
  world?: 'ISOLATED' | 'MAIN';
};

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
  assets?: string[];
};

export type ManifestEntryPoints = Record<string, ManifestEntryPoint>;

export type ManifestEntryProcessor = {
  key: ManifestEntryKey;
  match: (entryName: string) => boolean;
  merge: (props: NormalizeMainfestEntryProps) => void | Promise<void>;
  read: (manifest?: WebExtensionManifest) => ManifestEntry | null;
  write: (props: WriteMainfestEntryProps) => void | Promise<void>;
};

export interface NormalizeManifestProps {
  rootPath: string;
  mode: BuildMode;
  manifest?: WebExtensionManifest;
  srcDir?: string;
  target?: BrowserTarget;
}

export interface NormalizeMainfestEntryProps extends Required<NormalizeManifestProps> {
  files: Dirent[];
}

export interface WriteManifestProps {
  manifest: WebExtensionManifest;
  rootPath: string;
  entrypoints: ManifestEntryPoints;
}

export interface WriteMainfestEntryProps {
  manifest: WebExtensionManifest;
  rootPath: string;
  entryName: string;
  entryPath: ManifestEntryPoint['entryPath'];
  assets: ManifestEntryPoint['assets'];
}
