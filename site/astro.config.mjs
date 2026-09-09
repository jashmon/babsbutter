// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// Static, zero-JS-by-default marketing site. See CLAUDE.md for the project brief.
export default defineConfig({
  output: 'server',
  adapter: vercel(),
});
