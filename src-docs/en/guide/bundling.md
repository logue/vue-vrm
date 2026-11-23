---
description: Tips for keeping three.js and three-vrm out of your main bundle when building an application that uses vue-vrm.
---

# Bundling Tips

three.js and three-vrm are relatively large. Splitting them into their own chunks keeps your main bundle small and lets browsers cache them separately.

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

## Lazy loading

If the avatar is not needed on the first screen, load the component asynchronously:

```ts
import { defineAsyncComponent } from 'vue';

const VrmCanvas = defineAsyncComponent(async () => (await import('vue-vrm')).VrmCanvas);
```
