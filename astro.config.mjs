import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

export default defineConfig({
  site: 'https://yc-chen.github.io',
  base: '/chineseopfietspad',
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [svelte()],
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'nl', 'zh'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
