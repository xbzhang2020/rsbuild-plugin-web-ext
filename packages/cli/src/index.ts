import { program } from 'commander';
import { generateIcons } from './generate/index.js';

function main() {
  program
    .command('generate')
    .alias('g')
    .description('generate files')
    .argument('<type>', 'type of file (icons)')
    .option('-r, --root', 'root path (defaults to cwd)')
    .option('-t, --template', "template's name or path")
    .option('-s, --size', 'sizes of output icons (defaults to 16,32,48,64,128)')
    .option('-f, --format', 'format output files (defaults to icon-<size>.png)')
    .option('--out-dir', 'output directory')
    .action(async (type, options) => {
      if (type === 'icons') {
        try {
          await generateIcons(options);
          console.log('Generated icons successfully!');
        } catch (error) {
          console.error('Generated icons failed:', (error as Error).message);
          process.exit(1);
        }
      }
    });

  program.parse();
}

export { main };
