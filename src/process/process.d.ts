import type { BrowserTarget, Manifest } from '../manifest.ts';

export interface NormalizeManifestProps {
  manifest: Manifest;
  target: BrowserTarget;
  rootPath: string;
  srcPath: string;
  selfRootPath: string;
}

export interface NormalizeMainfestEntryProps extends NormalizeManifestProps {
  entryPath?: string | string[];
}

export interface WriteMainfestEntryProps {
  manifest: Manifest;
  originManifest?: Manifest; // defined by user
  key: string; // entry name
  assets: string[];
  rootPath: string;
  entryPath?: string | string[];
}
