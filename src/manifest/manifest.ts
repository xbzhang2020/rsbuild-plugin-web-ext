import type { Manifest as _Manifest, BrowserTarget } from '../types.js';

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
  originManifest?: _Manifest; // defined by user
  key: string; // entry name
  assets: string[];
  rootPath: string;
  entryPath?: string | string[];
}

export type Manifest = _Manifest;
