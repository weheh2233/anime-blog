import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';
import tailwindcss from '@tailwindcss/vite';

// 仅在 dev 模式下启用 Keystatic（构建时需要纯静态输出）
const isDev = process.argv[2] === 'dev' || process.argv[2] === 'preview';

export default defineConfig({
  site: 'https://anime-blog.vercel.app',

  // Astro 7: output: 'hybrid' 已合并到 'static'
  // SSR 路由通过 export const prerender = false 实现
  output: 'static',

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [
    react(),
    markdoc(),
    ...(isDev ? [keystatic()] : []),
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
});
