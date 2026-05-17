import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
  integrations: [svelte()],
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    assets: '_astro',
  },
  prefetch: {
    prefetchAll: true,
  },
});
