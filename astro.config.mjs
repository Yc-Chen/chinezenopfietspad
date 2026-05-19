import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://chinezenopfietspad.nl',
  base: '/',
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [
    svelte(),
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en',
          nl: 'nl',
          zh: 'zh',
        },
      },
    }),
  ],
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'nl', 'zh'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
