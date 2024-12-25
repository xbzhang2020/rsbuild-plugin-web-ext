import { program } from 'commander';
import type { Command } from 'commander';
import { generateIcons } from './generate.js';
import type { GenerateOptions } from './generate.js';
import { runBuild, runDev } from './rsbuild.js';
import type { BuildOptions as RsbuildBuildOptions, DevOptions as RsbuildDevOptions } from './rsbuild.js';
import { zipExtenison } from './zip.js';
import type { ZipOptions } from './zip.js';

function main() {
  const generateCommand = program.command('generate').alias('g').description('generate files');
  const rsbuildDevCommand = program.command('rsbuild:dev').description('execute the dev command of rsbuild');
  const rsbuildBuildCommand = program.command('rsbuild:build').description('execute the build command of rsbuild');
  const zipCommand = program.command('zip').description('package an extension into a .zip file for publishing');

  applyGenerateCommand(generateCommand);
  applyRsbuildDevCommand(rsbuildDevCommand);
  applyRsbuildBuildCommand(rsbuildBuildCommand);
  applyZipCommand(zipCommand);

  program.parse();
}

function applyGenerateCommand(command: Command) {
  command
    .argument('<type>', 'type of files')
    .option('-r, --root <dir>', 'specify the project root directory')
    .option('-t, --template <name>', "specify the template's name or path")
    .option('-o, --out-dir <dir>', 'specify the output directory')
    .option('-n, --filename <name>', 'specify the output filename')
    .option('--size <size>', 'specify sizes of output icons (defaults to 16,32,48,64,128)')
    .action(async (type, options: GenerateOptions) => {
      try {
        if (type === 'icons') {
          await generateIcons(options);
        }
        console.log(`Generated ${type} successfully!`);
      } catch (error) {
        console.error(`Generated ${type} failed:`, (error as Error).message);
        process.exit(1);
      }
    });
}

function applyRsbuildDevCommand(command: Command) {
  applyCommonRunOptions(command);
  command
    .option('-o --open [url]', 'open the page in browser on startup')
    .option('--port <port>', 'specify a port number for server to listen')
    .action(async (options: RsbuildDevOptions) => {
      try {
        await runDev(options);
      } catch (err) {
        console.error('Failed to start dev server.');
        console.error(err);
        process.exit(1);
      }
    });
}

function applyRsbuildBuildCommand(command: Command) {
  applyCommonRunOptions(command);
  command.option('-z, --zip', 'package the extension after build').action(async (options: RsbuildBuildOptions) => {
    try {
      await runBuild(options);
    } catch (err) {
      console.error('Failed to build.');
      console.error(err);
      process.exit(1);
    }
  });
}

function applyCommonRunOptions(command: Command) {
  command
    .option('-r, --root <root>', 'specify the project root directory')
    .option('-c --config <config>', 'specify the configuration file')
    .option('-m --mode <mode>', 'specify the build mode, can be `development`, `production` or `none`')
    .option('--env-mode <mode>', 'specify the env mode to load the `.env.[mode]` file')
    .option('--env-dir <dir>', 'specify the directory to load `.env` files')
    .option('-t, --target <target>', 'specify the extension target');
}

function applyZipCommand(command: Command) {
  command
    .argument('<source>', 'specify the dist path')
    .option('-r, --root <root>', 'specify the project root directory')
    .option('-o, --out-dir <dir>', 'specify the output directory')
    .option('-n, --filename <filename>', 'specify the output filename')
    .action(async (source: string, options: ZipOptions) => {
      try {
        await zipExtenison({ ...options, source });
      } catch (err) {
        console.error('Failed to package the extension.');
        console.error(err);
        process.exit(1);
      }
    });
}

export { main };
