import type { BrowserTarget, Manifest as _Manifest } from '../types.js';

export type Manifest = _Manifest;

export type ManifestEntryKey = 'background' | 'content' | 'popup' | 'options' | 'devtools' | 'sandbox' | 'icons';

export type ManifestEntry = Record<
  string,
  {
    import?: string | string[];
    html?: boolean;
  }
>;

export type ManifestEntryPoint = {
  import?: string | string[];
  assets?: string[];
};

export type ManifestEntryPoints = Record<string, ManifestEntryPoint>;

export type ManifestEntryProcessor = {
  key: ManifestEntryKey;
  match: (entryName: string) => boolean;
  merge: (props: NormalizeMainfestEntryProps) => void;
  read: (manifest?: Manifest) => ManifestEntry | null;
  write: (props: WriteMainfestEntryProps) => void | Promise<void>;
};

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
  entryPath: ManifestEntryPoint['import'];
  assets: ManifestEntryPoint['assets'];
}
