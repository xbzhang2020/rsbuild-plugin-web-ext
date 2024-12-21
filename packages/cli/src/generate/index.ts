import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import sharp from 'sharp';
import { getSrcDir } from '../util.js';

interface GenerateOptions {
  root?: string;
  template?: string;
  outDir?: string;
  format?: string;
  size?: string;
}

const ICON_SIZES = [16, 32, 48, 64, 128];

function getTemplateIconPath(root: string, template?: string) {
  if (template) return resolve(root, template);

  const name = 'icon.png';
  const srcPath = resolve(root, getSrcDir(root));
  const path1 = resolve(srcPath, 'assets', name);
  if (existsSync(path1)) return path1;

  const path2 = resolve(srcPath, name);
  if (existsSync(path2)) return path2;

  throw new Error('Icon template not found');
}

async function generateIcons({
  root = process.cwd(),
  template,
  format = 'icon-<size>.png',
  outDir,
  size = ICON_SIZES.join(','),
}: GenerateOptions) {
  const input = getTemplateIconPath(root, template);
  const sizes = size
    .split(',')
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item > 0);

  for (const size of sizes) {
    const newIncoName = format.includes('<size>') ? format.replace('<size>', String(size)) : `icon-${size}.png`;
    const newIconPath = outDir || resolve(dirname(input), newIncoName);
    await sharp(input).resize(size).toFile(newIconPath);
  }
}

export { generateIcons };
