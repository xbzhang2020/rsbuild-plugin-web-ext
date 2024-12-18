import { program } from 'commander';
import { generateIcons } from './generate.js';

function main() {
  program
    .command('gen')
    .description('generate files')
    .argument('<type>', 'generate type')
    .option('-t, --template <path>', 'template name or path')
    .action(async (type, options) => {
      try {
        if (type === 'icons') {
          await generateIcons(options.template);
          console.log('Icons generated successfully!');
        }
      } catch (error) {
        console.error('Error generating icons:', (error as Error).message);
        process.exit(1);
      }
    });

  program.parse();
}

export { main };
