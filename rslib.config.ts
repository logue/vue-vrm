import { readFileSync } from 'node:fs';

import { pluginVue } from '@rsbuild/plugin-vue';
import { defineConfig } from '@rslib/core';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8')) as {
  version: string;
};

const buildDate = new Date().toISOString();

export default defineConfig({
  lib: [
    {
      format: 'esm',
      dts: false
    }
  ],
  plugins: [pluginVue()],
  source: {
    entry: {
      index: './src/lib.ts'
    },
    define: {
      __APP_VERSION__: JSON.stringify(packageJson.version),
      __BUILD_DATE__: JSON.stringify(buildDate)
    }
  },
  output: {
    target: 'web',
    distPath: {
      root: './dist'
    }
  }
});
