import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));
const buildDate = new Date().toISOString();

console.log('Injected version:', packageJson.version);
console.log('Injected build date:', buildDate);

import { defineConfig } from '@rsbuild/core';
import { pluginVue } from '@rsbuild/plugin-vue';

// Docs: https://rsbuild.rs/config/
// Demo build configuration - for library build, see rslib.config.ts
export default defineConfig({
  plugins: [pluginVue()],
  source: {
    define: {
      __DEMO_BUILD__: JSON.stringify(true),
      __APP_VERSION__: JSON.stringify(packageJson.version),
      __BUILD_DATE__: JSON.stringify(buildDate),
    },
    entry: {
      index: './src/index.ts',
    },
  },
  output: {
    distPath: 'docs',
    assetPrefix: './',
    filenameHash: true,
    copy: [
      {
        from: './src/assets',
        to: 'assets',
      },
    ],
  },
  html: {
    template: './src/index.html',
    title: 'VRM Viewer Demo - Vue VRM',
  },
  tools: {
    htmlPlugin: undefined,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
