import sharp from 'sharp';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

async function resize(input, output, size) {
  return await sharp(input).resize(size).toFile(output);
}

async function generateIcons(iconPath = './src/assets/icon.png') {
  const resolvedIconPath = resolve(process.cwd(), iconPath);
  if (!existsSync(resolvedIconPath)) {
    throw new Error('Icon file not found');
  }

  const ICON_SIZES = [16, 32, 48, 64, 128];
  for (const size of ICON_SIZES) {
    const newIconPath = resolvedIconPath.replace('.png', `-${size}.png`);
    await resize(resolvedIconPath, newIconPath, size);
  }
}

export { generateIcons };
