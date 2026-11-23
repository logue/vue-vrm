---
description: vue-vrmを使うアプリをビルドするときに、three.jsとthree-vrmをメインのバンドルから分ける方法を説明します。
---

# バンドルのヒント

three.jsとthree-vrmは比較的大きなライブラリです。別のチャンクに分けると、メインのバンドルが小さくなり、ブラウザーも個別にキャッシュできます。

## Vite

```ts
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/three/')) return 'three';
          if (id.includes('/node_modules/@pixiv/')) return 'three-vrm';
        }
      }
    }
  }
});
```

## Rsbuild

```ts
// rsbuild.config.ts
import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  splitChunks: {
    cacheGroups: {
      three: {
        test: /node_modules[\\/](three|@pixiv)[\\/]/,
        name: 'three',
        chunks: 'all'
      }
    }
  }
});
```

## 遅延読み込み

最初の画面でアバターが不要な場合は、コンポーネントを非同期で読み込みます。

```ts
import { defineAsyncComponent } from 'vue';

const VrmCanvas = defineAsyncComponent(async () => (await import('vue-vrm')).VrmCanvas);
```
