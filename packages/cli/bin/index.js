#!/usr/bin/env node

import { program } from 'commander';
import { generateIcons } from '../src/icons.js';

program
  .command('icons')
  .description('Generate icons in different sizes from a source icon')
  .option('-g, --generate', 'Generate icons')
  .argument('[iconPath]', 'Path to the source icon (default: ./src/assets/icon.png)')
  .action(async (iconPath, options) => {
    if (options.generate) {
      try {
        await generateIcons(iconPath);
        console.log('Icons generated successfully!');
      } catch (error) {
        console.error('Error generating icons:', error.message);
        process.exit(1);
      }
    }
  });

program.parseAsync();
