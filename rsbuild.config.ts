import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));
const buildDate = new Date().toISOString();

console.log('Injected version:', packageJson.version);
console.log('Injected build date:', buildDate);

import { defineConfig } from '@rsbuild/core';
import { pluginVue } from '@rsbuild/plugin-vue';

const buildTarget = process.env.BUILD_TARGET ?? 'demo';
const isDemo = buildTarget === 'demo';

// Docs: https://rsbuild.rs/config/
export default defineConfig({
  plugins: [pluginVue()],
  source: {
    define: {
      __DEMO_BUILD__: JSON.stringify(isDemo),
      __APP_VERSION__: JSON.stringify(packageJson.version),
      __BUILD_DATE__: JSON.stringify(buildDate)
    },
    entry: isDemo
      ? {
          index: './src/index.ts'
        }
      : {
          index: './src/lib.ts'
        }
  },
  output: {
    distPath: 'docs',
    filenameHash: true,
    copy: [
      {
        from: './src/assets',
        to: 'assets'
      }
    ]
  },
  html: {
    template: './src/index.html',
    title: 'VRM Viewer Demo - Vue VRM'
  },
  tools: {
    htmlPlugin: undefined
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});
