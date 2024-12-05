import type { Manifest, BrowserTarget } from '../manifest.ts';

export interface NormalizeManifestProps {
  manifest: Manifest;
  target: BrowserTarget;
  rootPath: string;
  srcPath: string;
  selfRootPath: string;
}

export interface NormailzeMainfestEntryProps extends NormalizeManifestProps {
  entryPath?: string | string[];
}
