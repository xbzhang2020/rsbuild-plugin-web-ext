import { existsSync } from 'node:fs';
import { copyFile, cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { input, select, checkbox } from '@inquirer/prompts';

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface InitialOptions {
  projectName?: string;
  template?: string;
  entry?: string[];
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

const entrypoints = [
  {
    name: 'background',
    value: 'background',
  },
  {
    name: 'content',
    value: 'content',
  },
  {
    name: 'popup',
    value: 'popup',
  },
  {
    name: 'options',
    value: 'options',
  },
  {
    name: 'devtools',
    value: 'devtools',
  },
  {
    name: 'sidepanel',
    value: 'sidepanel',
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

    if (!options.entry) {
      options.entry = await checkbox({
        message: 'Select entry points',
        choices: entrypoints,
      });
    }

    console.log('\nDone. Next step:');
    console.group();
    console.log(`cd ${options.projectName}`);
    console.log('npm install');
    console.log('npm run dev');
    console.groupEnd();
    return options;
  } catch (error) {
    if (error instanceof Error && error.name === 'ExitPromptError') {
      console.log('Canceled\n');
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
  await copyTemplate(templatePath, destPath);
  await copyEntryFiles(templatePath, destPath, options);
  await modifyPackageJson(destPath, projectName);
}

function getTemplatePath(template: string) {
  const templatePath = resolve(__dirname, `../templates/template-${template}`);
  if (!existsSync(templatePath)) {
    throw new Error(`Cannot find template ${template}`);
  }
  return templatePath;
}

async function copyTemplate(source: string, dest: string) {
  const files = await readdir(source, { withFileTypes: true });
  const ingoredEntrypoints = entrypoints.map((item) => item.value);

  for (const file of files) {
    const { name } = file;
    const srcPath = resolve(source, name);
    const destPath = resolve(dest, name);

    if (['node_modules', 'dist'].includes(name)) continue;

    if (file.isDirectory()) {
      await cp(srcPath, destPath, {
        recursive: true,
        filter: (s) => {
          if (name === 'src') {
            // exclude all entrypoints
            const entryPath = relative(srcPath, s);
            const ignored = ingoredEntrypoints.some((item) => entryPath.includes(item));
            return !ignored;
          }
          return true;
        },
      });
    } else {
      await copyFile(srcPath, destPath);
    }
  }
}

async function modifyPackageJson(root: string, projectName: string) {
  const pkgPath = resolve(root, 'package.json');
  const content = await readFile(pkgPath, 'utf-8');
  const newContent = JSON.parse(content);
  newContent.name = projectName;
  await writeFile(pkgPath, JSON.stringify(newContent, null, 2), 'utf-8');
}

async function copyEntryFiles(source: string, dest: string, optons: InitialOptions) {
  const srcPath = resolve(source, 'src');
  const destSrcPath = resolve(dest, 'src');

  if (!existsSync(srcPath)) {
    throw new Error('Cannot find src directory');
  }
  if (!existsSync(destSrcPath)) {
    await mkdir(destSrcPath);
  }

  const files = await readdir(srcPath, { withFileTypes: true });
  const entries = optons.entry || [];

  for (const entry of entries) {
    let entryName = entry;
    if (entry.startsWith('contents/')) {
      entryName = 'content';
    }

    const file = files.find((item) => item.name.startsWith(entryName));
    if (!file) continue;
    const { name } = file;
    const destName = file.isFile() ? name : entry;
    await cp(resolve(srcPath, name), resolve(destSrcPath, destName), { recursive: true });
  }
}
