import { program } from 'commander';
import { generateIcons } from './generate.js';

function main() {
  program
    .command('generate')
    .alias('g')
    .description('generate files')
    .argument('<type>', 'type of file (icons)')
    .option('-r, --root <dir>', 'root path (defaults to cwd)')
    .option('-t, --template <name>', "template's name or path")
    .option('-s, --size <size>', 'sizes of output icons (defaults to 16,32,48,64,128)')
    .option('-o, --out-dir <dir>', 'output directory')
    .action(async (type, options) => {
      if (type === 'icons') {
        try {
          console.log('options', options);
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
