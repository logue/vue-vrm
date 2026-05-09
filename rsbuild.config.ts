import { resolve } from 'node:path';

import { defineConfig } from '@rsbuild/core';
import { pluginVue } from '@rsbuild/plugin-vue';

const buildTarget = process.env.BUILD_TARGET ?? 'lib';
const isDemo = buildTarget === 'demo';

// Docs: https://rsbuild.rs/config/
export default defineConfig({
  plugins: [pluginVue()],
  source: {
    define: {
      __DEMO_BUILD__: JSON.stringify(isDemo)
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
    distPath: isDemo ? 'docs' : 'dist',
    filenameHash: isDemo,
    filename: isDemo
      ? undefined
      : {
          js: '[name].es.js',
          css: 'style.css'
        },
    copy: isDemo
      ? [
          {
            from: './src/assets',
            to: 'assets'
          }
        ]
      : undefined
  },
  html: isDemo
    ? {
        template: './src/index.html',
        title: 'VRM Viewer Demo - Vue VRM'
      }
    : undefined,
  tools: {
    htmlPlugin: isDemo ? undefined : false
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});
