import { cpSync, rmSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const source = resolve('.vercel/output/static/pagefind');
const target = resolve('public/pagefind');

if (!existsSync(source)) {
  console.error(`Missing Pagefind output: ${source}`);
  process.exit(1);
}

rmSync(target, { recursive: true, force: true });
cpSync(source, target, { recursive: true });
