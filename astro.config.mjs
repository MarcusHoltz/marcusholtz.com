import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// base: './' is broken in Astro 6: prependForwardSlash() in vite-plugin-assets.ts
// always prepends '/', turning './' into '/.' and making BASE_URL = '/.'.
// Root-relative paths (/images/...) with build.format:'file' (flat dist/) work
// from any server root without setting BASE_PATH.
// Docs: https://docs.astro.build/en/reference/configuration-reference/#buildformat
//       https://docs.astro.build/en/reference/configuration-reference/#trailingslash

export default defineConfig({
  // SITE_URL and BASE_PATH are injected by Docker / CI; defaults keep local dev working without env vars.
  site: process.env.SITE_URL || 'https://www.example.com',
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'never',
  build: { format: 'file' },
  vite: {
    plugins: [tailwindcss()],
  },
  output: 'static',
  compressHTML: true,
  // 'attribute' scopes component styles via data-astro-* attributes instead of mangled class names,
  // which is more predictable when targeting elements from global CSS or JavaScript.
  scopedStyleStrategy: 'attribute',
  integrations: [
    ...(process.env.SITE_URL ? [sitemap()] : []),
  ],
  // Global Sharp codec defaults for all processed images.
  // Per-image `quality` props still override these.
  image: {
    service: {
      config: {
        jpeg: { mozjpeg: true },
        webp: { effort: 4 },
        avif: { effort: 4, chromaSubsampling: '4:2:0' },
      },
    },
  },
});
