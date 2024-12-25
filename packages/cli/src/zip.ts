import { createWriteStream, existsSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import archiver from 'archiver';

export interface ZipOptions {
  outDir?: string;
  filename?: string;
  root?: string;
  source: string;
}

export async function zipExtenison({ filename, source, root = process.cwd(), outDir }: ZipOptions) {
  const sourceDir = resolve(root, source);
  if (!existsSync(sourceDir)) {
    throw new Error(`${source} doesn't exist`);
  }

  const manifestFile = resolve(sourceDir, 'manifest.json');
  if (!existsSync(manifestFile)) {
    throw new Error(`Cannot find manifest.json in ${sourceDir}`);
  }

  const dest = filename || `${basename(sourceDir)}.zip`;
  const filePath = resolve(root, outDir || dirname(source), dest);
  const output = createWriteStream(filePath);

  return new Promise((resolve, reject) => {
    const archive = archiver('zip', {
      zlib: { level: 9 },
    });
    output.on('close', () => {
      // console.log(`${archive.pointer()} total bytes`);
      console.log(`Zipped ${source} successfully.`);
      resolve({});
    });
    archive.on('error', reject);

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}
