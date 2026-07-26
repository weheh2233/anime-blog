import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

process.env.ASTRO_TELEMETRY_DISABLED = '1';
process.env.ASTRO_DEV_BACKGROUND = '1';

const musicDir = resolve('src/content/music');
const syncScript = resolve('scripts/sync-local-music.mjs');
const backgroundDir = resolve('public/images/site/backgroundImages');
const backgroundSyncScript = resolve('scripts/optimize-background-images.mjs');
const syncMusic = () => {
  const result = spawnSync(process.execPath, [syncScript], {
    stdio: 'inherit',
    env: process.env,
  });
  return result.status === 0;
};

const optimizeBackgrounds = () => {
  const result = spawnSync(process.execPath, [backgroundSyncScript], {
    stdio: 'inherit',
    env: process.env,
  });
  return result.status === 0;
};

if (!syncMusic()) {
  process.exit(1);
}

if (!optimizeBackgrounds()) {
  process.exit(1);
}

let syncTimer;
const musicWatcher = fs.watch(musicDir, { recursive: true }, () => {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncMusic();
  }, 120);
});

let backgroundTimer;
const backgroundWatcher = fs.watch(backgroundDir, { recursive: true }, () => {
  clearTimeout(backgroundTimer);
  backgroundTimer = setTimeout(() => {
    optimizeBackgrounds();
  }, 400);
});

const astroBin = resolve('node_modules/astro/bin/astro.mjs');
const child = spawn(process.execPath, [astroBin, 'dev', '--host', '127.0.0.1', '--force'], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code, signal) => {
  clearTimeout(syncTimer);
  clearTimeout(backgroundTimer);
  musicWatcher.close();
  backgroundWatcher.close();
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
