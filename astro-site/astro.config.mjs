import { defineConfig } from 'astro/config';

// Phase 1: clean Astro rebuild of the article section.
// URLs are preserved (/article/<slug>/) so SEO and inbound links keep working.
// (sitemap integration to be re-added once all sections are migrated)
export default defineConfig({
  site: 'https://markaswalet.com',
  build: { format: 'directory' },
});
