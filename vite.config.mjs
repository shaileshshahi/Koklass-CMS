import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readdirSync, copyFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Auto-discover all HTML files in project root for Vite multi-page setup
const htmlFiles = readdirSync(__dirname)
  .filter((file) => file.endsWith('.html'))
  .reduce((acc, file) => {
    const name = file.replace(/\.html$/, '');
    acc[name] = resolve(__dirname, file);
    return acc;
  }, {});

export default defineConfig({
  server: {
    port: 3000,
    open: false,
  },
  plugins: [
    {
      name: 'copy-root-assets',
      closeBundle() {
        const filesToCopy = [
          'admin-sidebar.js',
          'admin-demo.js',
          'admin-charts.js',
          'logo.svg',
          'theme.json',
          'theme-brand.css',
          'ember-variables.css',
          'ember-variables-hsl.css',
        ];
        for (const file of filesToCopy) {
          const src = resolve(__dirname, file);
          const dest = resolve(__dirname, 'dist', file);
          if (existsSync(src)) {
            copyFileSync(src, dest);
          }
        }
      },
    },
  ],
  build: {
    rollupOptions: {
      input: htmlFiles,
    },
  },
});
