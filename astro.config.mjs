import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';

export default defineConfig(({ command }) => ({
  site: 'https://anime-blog.vercel.app',

  // Keystatic 仅在本地 dev 时加载，生产构建时不包含（纯静态站点）
  integrations: [
    react(),
    ...(command === 'dev' ? [keystatic()] : []),
  ],

  // Shiki 代码高亮
  markdown: {
    shikiConfig: {
      theme: 'github-dark-default',
      defaultColor: false,
      wrap: true,
      langs: [],
    },
  },
}));
