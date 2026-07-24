import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const output = resolve('.vercel/output/static/pagefind');

if (existsSync(output)) {
  rmSync(output, { recursive: true, force: true });
}
