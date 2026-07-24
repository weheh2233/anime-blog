import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

process.env.ASTRO_TELEMETRY_DISABLED = '1';
process.env.ASTRO_DEV_BACKGROUND = '1';

const astroBin = resolve('node_modules/astro/bin/astro.mjs');
const child = spawn(process.execPath, [astroBin, 'dev', '--host', '127.0.0.1'], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
