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
