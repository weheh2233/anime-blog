import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { dump, load } from 'js-yaml';

const backgroundRoot = path.resolve('public/images/site/backgroundImages');
const contentRoot = path.resolve('src/content/site-backgrounds');
const sourceExtensions = new Set(['.png', '.jpg', '.jpeg', '.avif']);

function publicPathFor(filePath) {
  const relative = path.relative(path.resolve('public'), filePath).split(path.sep).join('/');
  return `/${relative}`;
}

async function optimizeFile(sourcePath) {
  const outputPath = sourcePath.replace(/\.[^.]+$/i, '.webp');
  await sharp(sourcePath)
    .webp({ quality: 85, effort: 6 })
    .toFile(outputPath);
  fs.unlinkSync(sourcePath);
  return outputPath;
}

async function updateEntry(entryPath, convertedFiles) {
  const source = fs.readFileSync(entryPath, 'utf8');
  const entry = load(source);
  if (!entry || typeof entry !== 'object' || typeof entry.image !== 'string') return;

  const imagePath = path.resolve('public', entry.image.replace(/^\/+/, ''));
  const convertedPath = convertedFiles.get(imagePath);
  if (!convertedPath) return;

  entry.image = publicPathFor(convertedPath);
  fs.writeFileSync(entryPath, dump(entry, { lineWidth: -1 }), 'utf8');
}

async function main() {
  if (!fs.existsSync(backgroundRoot)) return;

  const convertedFiles = new Map();
  for (const folder of fs.readdirSync(backgroundRoot, { withFileTypes: true })) {
    if (!folder.isDirectory()) continue;

    const folderPath = path.join(backgroundRoot, folder.name);
    for (const file of fs.readdirSync(folderPath, { withFileTypes: true })) {
      if (!file.isFile()) continue;
      const sourcePath = path.join(folderPath, file.name);
      const extension = path.extname(file.name).toLowerCase();
      if (!sourceExtensions.has(extension)) continue;

      const outputPath = await optimizeFile(sourcePath);
      convertedFiles.set(sourcePath, outputPath);
      console.log(`[background] ${file.name} -> ${path.basename(outputPath)}`);
    }
  }

  if (!fs.existsSync(contentRoot)) return;
  for (const entry of fs.readdirSync(contentRoot, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.yaml')) continue;
    await updateEntry(path.join(contentRoot, entry.name), convertedFiles);
  }
}

main().catch((error) => {
  console.error('[background] optimization failed');
  console.error(error);
  process.exitCode = 1;
});
