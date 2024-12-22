import type { Dirent } from 'node:fs';
import type { Manifest } from 'webextension-polyfill';

export type BuildMode = 'development' | 'production' | 'none' | undefined;
export type BrowserTarget = 'chrome-mv3' | 'firefox-mv2' | 'firefox-mv3' | 'safari-mv3';

export interface WebExtensionManifest extends Manifest.WebExtensionManifest {
  // Firefox doesn't support sandbox
  sandbox?: {
    pages: string[];
    content_security_policy?: string;
  };
  // Firefox doesn't support side_panel, but supports sidebar_action
  side_panel?: {
    default_path?: string;
  };
}

export interface ContentScriptConfig {
  matches: string[];
  exclude_matches?: string[];
  css?: string[];
  run_at?: 'document_start' | 'document_end' | 'document_idle';
  all_frames?: boolean;
  match_about_blank?: boolean;
  include_globs?: string[];
  exclude_globs?: string[];
  world?: 'ISOLATED' | 'MAIN';
}

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

interface ManifestEntryItem {
  input: string[];
  output: string[];
  html?: boolean;
}

export type ManifestEntryInput = Record<string, Omit<ManifestEntryItem, 'output'>>;
export type ManifestEntryOutput = Record<string, Pick<ManifestEntryItem, 'input' | 'output'>>;

export interface ManifestEntryProcessor {
  key: ManifestEntryKey;
  match: (entryName: string) => boolean;
  merge: (props: NormalizeMainfestEntryProps) => void | Promise<void>;
  read: (manifest?: WebExtensionManifest) => ManifestEntryInput | null;
  write: (props: WriteMainfestEntryItemProps) => void | Promise<void>;
}

export interface NormalizeManifestProps {
  rootPath: string;
  selfRootPath: string;
  mode: BuildMode;
  manifest?: WebExtensionManifest;
  srcDir?: string;
  target?: BrowserTarget;
}

export interface NormalizeMainfestEntryProps extends Required<NormalizeManifestProps> {
  files: Dirent[];
}

export interface WriteMainfestEntriesProps {
  manifest: WebExtensionManifest;
  rootPath: string;
  entry: ManifestEntryOutput;
}

export interface WriteMainfestEntryItemProps {
  manifest: WebExtensionManifest;
  rootPath: string;
  name: string;
  input?: ManifestEntryItem['input'];
  output?: ManifestEntryItem['output'];
}

export interface WriteManifestFileProps {
  distPath: string;
  manifest: WebExtensionManifest;
  mode: BuildMode | undefined;
}
