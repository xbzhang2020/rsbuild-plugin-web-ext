import type { RsbuildEntry } from '@rsbuild/core';
import type { BrowserTarget, Manifest as _Manifest } from '../types.js';

export interface NormalizeManifestProps {
  manifest: _Manifest;
  target: BrowserTarget;
  rootPath: string;
  srcPath: string;
  selfRootPath: string;
}

export interface NormalizeMainfestEntryProps extends NormalizeManifestProps {
  entryPath: string[];
}

export interface WriteMainfestEntryProps {
  manifest: _Manifest;
  optionManifest?: _Manifest; // defined by user
  rootPath: string;
  entryName: string; // entry name
  entryPath?: string | string[];
  assets: string[];
}

export type Manifest = _Manifest;

export type ManifestEntryKey = 'background' | 'content' | 'popup' | 'options' | 'devtools' | 'sandbox';

export type ManifestEntry = RsbuildEntry;

export type ManifestEntryProcessor = {
  key: ManifestEntryKey;
  match: (entryName: string) => boolean;
  merge: (props: NormalizeMainfestEntryProps) => void;
  read: (manifest?: Manifest) => ManifestEntry | null;
  write: (props: WriteMainfestEntryProps) => void | Promise<void>;
};
