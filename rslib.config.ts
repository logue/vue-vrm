import { readFileSync } from 'node:fs';

import { pluginVue } from '@rsbuild/plugin-vue';
import { defineConfig } from '@rslib/core';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8')) as {
  name: string;
  description: string;
  author: {
    name: string;
    email: string;
  };
  license: string;
  version: string;
  homepage: string;
};

const buildDate = new Date().toISOString();

export default defineConfig({
  lib: [
    {
      // Modern ESM build for modern bundlers and environments
      format: 'esm',
      dts: false,
      syntax: 'esnext',
    },
    {
      // Legacy CommonJS build for Node.js and older bundlers
      format: 'cjs',
      dts: false,
      syntax: 'es2015',
    },
    {
      banner: {
        js: `/**
 * ${pkg.name}
 *
 * @description ${pkg.description}
 * @author ${pkg.author.name} <${pkg.author.email}>
 * @copyright 2026 By Masashi Yoshikawa All rights reserved.
 * @license ${pkg.license}
 * @version ${pkg.version}
 * @see {@link ${pkg.homepage}}
 */
`,
      },
    },
  ],
  plugins: [pluginVue()],
  source: {
    entry: {
      index: './src/lib.ts',
    },
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      __BUILD_DATE__: JSON.stringify(buildDate),
    },
  },
  output: {
    target: 'web',
    minify: true,
    distPath: {
      root: './dist',
    },
  },
});
