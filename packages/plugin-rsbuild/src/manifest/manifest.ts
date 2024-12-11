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
