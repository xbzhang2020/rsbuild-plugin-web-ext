import { existsSync } from 'node:fs';
import { resolve, isAbsolute } from 'node:path';
import sharp from 'sharp';

function getTemplatePath(template: string) {
  if (isAbsolute(template)) return template;
  const cwd = process.cwd();
  return resolve(cwd, template);
}

async function generateIcons(template = 'src/assets/icon.png') {
  const resolvedIconPath = getTemplatePath(template);
  if (!existsSync(resolvedIconPath)) {
    throw new Error('Icon template not found');
  }

  async function resize(input: string, output: string, size: number) {
    return await sharp(input).resize(size).toFile(output);
  }

  const ICON_SIZES = [16, 32, 48, 64, 128];
  for (const size of ICON_SIZES) {
    const newIconPath = resolvedIconPath.replace('.png', `-${size}.png`);
    await resize(resolvedIconPath, newIconPath, size);
  }
}

export { generateIcons };
