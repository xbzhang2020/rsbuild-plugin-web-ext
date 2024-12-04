import type { ManifestV3 } from '../manifest.ts';

export interface NormalizeManifestProps {
  manifest: ManifestV3;
  rootPath: string;
  srcPath: string;
  selfRootPath: string;
}

export interface NormailzeMainfestEntryProps extends NormalizeManifestProps {
  entryPath: string;
}
