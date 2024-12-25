import { input, select } from '@inquirer/prompts';
import { readdir, cp, copyFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { existsSync } from 'node:fs';

export interface InitialOptions {
  projectName?: string;
  template?: string;
  variant?: string;
}

const templates = [
  {
    name: 'Vanilla',
    value: 'vanilla',
  },
  {
    name: 'React',
    value: 'react',
  },
  {
    name: 'Vue',
    value: 'vue',
  },
  {
    name: 'Svelte',
    value: 'svelte',
  },
];

const variants = [
  {
    name: 'TypeScript',
    value: 'ts',
  },
  {
    name: 'JavaScript',
    value: 'js',
  },
];

export async function normalizeInitialOptions(options: InitialOptions) {
  try {
    console.log();

    if (!options.projectName) {
      options.projectName = await input({ message: 'Project name', default: 'my-extension-app' });
      const root = process.cwd();
      const projectPath = resolve(root, options.projectName);
      if (existsSync(projectPath)) {
        console.log(`${options.projectName} has exist.`);
        return null;
      }
    }

    if (!options.template) {
      options.template = await select({
        message: 'Select a template',
        choices: templates,
      });
      options.variant = await select({
        message: 'Select a variant',
        choices: variants,
      });
    }

    console.log();
    console.group();
    console.log('Done. Next step:');
    console.log(`cd ${options.projectName}`);
    console.log('npm install');
    console.log('npm run dev');
    console.groupEnd();
    return options;
  } catch (error) {
    if (error instanceof Error && error.name === 'ExitPromptError') {
      console.log('Canceled');
    } else {
      throw error;
    }
    return null;
  }
}

async function copyDirectory(src: string, dest: string) {
  const entries = await readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.name === 'node_modules') continue;

    if (entry.isDirectory()) {
      await cp(srcPath, destPath, { recursive: true });
    } else {
      await copyFile(srcPath, destPath);
    }
  }
}

export async function createProject(options: InitialOptions) {
  const { projectName } = options;
  if (!projectName) return;

  const root = process.cwd();
  const srcPath = resolve(root, projectName);
  await mkdir(srcPath);

  // TODO: 兼容性
  const templatePath = resolve(import.meta.dirname, '../templates/template-react-ts');
  const destPath = resolve(projectName);
  await copyDirectory(templatePath, destPath);
}
