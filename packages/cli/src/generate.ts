import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';
import { getSrcDir } from './util.js';

export interface GenerateOptions {
  root?: string;
  template?: string;
  srcDir?: string;
  outDir?: string;
  filename?: string;
  size?: string;
}

const ICON_SIZES = [16, 32, 48, 64, 128];

function getTemplateIconPath(root: string, template: string | undefined) {
  let templatePath = '';

  if (template) {
    templatePath = resolve(root, template);
    if (!existsSync(template)) {
      throw new Error("The template doesn't exist");
    }
    return templatePath;
  }

  const defaultTemplate = 'icon.png';
  const srcPath = resolve(root, getSrcDir(root));
  templatePath = resolve(srcPath, 'assets', defaultTemplate);
  if (existsSync(templatePath)) return templatePath;

  templatePath = resolve(srcPath, defaultTemplate);
  if (existsSync(templatePath)) return templatePath;

  throw new Error('Icon template not found');
}

async function generateIcons({
  root = process.cwd(),
  template,
  outDir,
  size = ICON_SIZES.join(','),
  filename = 'icon-{size}.png',
}: GenerateOptions) {
  const input = getTemplateIconPath(root, template);

  const sizes = size
    .split(',')
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item > 0);

  for (const size of sizes) {
    const newIncoName = filename.replace('{size}', String(size));
    const newIconPath = outDir ? resolve(root, outDir, newIncoName) : resolve(dirname(input), newIncoName);
    await sharp(input).resize(size).toFile(newIconPath);
  }
}

export { generateIcons };
