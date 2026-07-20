import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://anime-blog.vercel.app',

  output: 'static',
  adapter: vercel(),

  vite: {
    plugins: [tailwindcss()],
    define: {
      'import.meta.env.KEYSTATIC_GITHUB_CLIENT_ID': JSON.stringify(process.env.KEYSTATIC_GITHUB_CLIENT_ID || ''),
      'import.meta.env.KEYSTATIC_GITHUB_CLIENT_SECRET': JSON.stringify(process.env.KEYSTATIC_GITHUB_CLIENT_SECRET || ''),
      'import.meta.env.KEYSTATIC_SECRET': JSON.stringify(process.env.KEYSTATIC_SECRET || ''),
    },
  },

  integrations: [
    react(),
    markdoc(),
    keystatic(),
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
