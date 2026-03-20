import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',

  // ── GitHub Pages ────────────────────────────────────────────────────────────
  // Replace YOUR_USERNAME and YOUR_REPO_NAME with your actual values.
  //
  // If this is a project repo (github.com/YOU/REPO):
  //   site: 'https://YOUR_USERNAME.github.io'
  //   base: '/YOUR_REPO_NAME'
  //
  // If this is a user/org site (repo named YOUR_USERNAME.github.io):
  //   site: 'https://YOUR_USERNAME.github.io'
  //   base: '/'   ← or omit base entirely
  site: 'https://wardbulletin.ca',
});
