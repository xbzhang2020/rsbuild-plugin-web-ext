import { existsSync } from 'node:fs';
import { copyFile, cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { input, select } from '@inquirer/prompts';

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface InitialOptions {
  projectName?: string;
  template?: string;
}

const frameworks = [
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
];

const variants = [
  {
    name: 'TypeScript',
    value: 'ts',
  },
  {
    name: 'JavaScript',
    value: 'js',
    disabled: true,
  },
];

const templates = ['vanilla-js', 'vanilla-ts', 'react-js', 'react-ts', 'vue-js', 'vue-ts'];

export async function normalizeInitialOptions(options: InitialOptions) {
  try {
    console.log();

    if (!options.projectName) {
      options.projectName = await input({ message: 'Project name', default: 'my-extension-app' });
    }
    const root = process.cwd();
    const projectPath = resolve(root, options.projectName);

    if (existsSync(projectPath)) {
      console.log(`${options.projectName} has exist.`);
      return null;
    }

    if (!options.template) {
      const framework = await select({
        message: 'Select a framework',
        choices: frameworks,
      });
      const variant = await select({
        message: 'Select a variant',
        choices: variants,
      });
      options.template = `${framework}-${variant}`;
    } else {
      const list = options.template.split('-');
      const framework = list[0];
      const variant = list[1] || 'js';
      options.template = `${framework}-${variant}`;
    }

    const hasTemplate = templates.includes(options.template);
    if (!hasTemplate) {
      throw new Error("Template doesn't exist");
    }

    console.log();
    console.log('Done. Next step:');
    console.group();
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

export async function createProject(options: InitialOptions) {
  const { projectName, template } = options;
  if (!projectName || !template) return;

  const root = process.cwd();
  const templatePath = getTemplatePath(template);
  const destPath = resolve(root, projectName);

  await mkdir(destPath);
  await copyDirectory(templatePath, destPath);
  await modifyPackageJson(destPath, projectName);
}

async function copyDirectory(src: string, dest: string) {
  const entries = await readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (['node_modules', 'dist'].includes(entry.name)) continue;

    if (entry.isDirectory()) {
      await cp(srcPath, destPath, { recursive: true });
    } else {
      await copyFile(srcPath, destPath);
    }
  }
}

function getTemplatePath(template: string) {
  const templatePath = resolve(__dirname, `../templates/template-${template}`);
  if (!existsSync(templatePath)) {
    throw Error(`Cannot find template ${template}`);
  }
  return templatePath;
}

async function modifyPackageJson(root: string, projectName: string) {
  const pkgPath = resolve(root, 'package.json');
  const content = await readFile(pkgPath, 'utf-8');
  const newContent = JSON.parse(content);
  newContent.name = projectName;
  await writeFile(pkgPath, JSON.stringify(newContent, null, 2), 'utf-8');
}
