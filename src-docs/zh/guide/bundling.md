---
description: 构建使用 vue-vrm 的应用时，把 three.js 和 three-vrm 从主包中拆分出来的技巧。
---

# 打包技巧

three.js 和 three-vrm 体积较大。把它们拆分成独立的 chunk，可以减小主包体积，并让浏览器单独缓存。

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

## 懒加载

如果首屏不需要头像，可以异步加载组件：

```ts
import { defineAsyncComponent } from 'vue';

const VrmCanvas = defineAsyncComponent(async () => (await import('vue-vrm')).VrmCanvas);
```
