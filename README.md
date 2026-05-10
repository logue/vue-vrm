# vue-vrm

[![jsdelivr CDN](https://data.jsdelivr.com/v1/package/npm/vue-vrm/badge)](https://www.jsdelivr.com/package/npm/vue-vrm)
[![NPM Downloads](https://img.shields.io/npm/dm/vue-vrm.svg?style=flat)](https://www.npmjs.com/package/vue-vrm)
[![npm version](https://img.shields.io/npm/v/vue-vrm.svg)](https://www.npmjs.com/package/vue-vrm)
[![Open in unpkg](https://img.shields.io/badge/Open%20in-unpkg-blue)](https://uiwjs.github.io/npm-unpkg/#/pkg/vue-vrm/file/README.md)

Vue 3 component library for rendering VRM 1.0 avatars with three.js. It supports VRM loading, VRMA playback, camera controls, screenshots, and low-level helper utilities for working with VRM and VRMA buffers.

## Features

- Vue 3 component for rendering VRM 1.0 models from `ArrayBuffer`
- VRMA playback with single or multiple animation clips
- Configurable camera, lights, background, grid, and optional shader pass
- Optional orbit-style camera interaction with rotate, pan, zoom, and roll
- Exposed methods for playback control, camera reset, and screenshots
- Utility exports for validating and loading VRM / VRMA assets outside the component

> [!IMPORTANT]
> This library accepts `ArrayBuffer` instead of file paths to prevent VRM/VRMA files from
> appearing in source code, source maps, or browser network logs due to **licensing restrictions**.
> Store files on a server (e.g., [Amazon S3](https://aws.amazon.com/s3/), [Cloudflare R2](https://www.cloudflare.com/developer-platform/products/r2/)) and retrieve dynamically via API calls (such as [VRoid Hub API](https://developer.vroid.com/en/api/)).

## Requirements

- Node.js `>=24`
- Vue `>=3.5`
- three `>=0.184`
- `@pixiv/three-vrm` `>=3.5`
- `@pixiv/three-vrm-animation` `>=3.5`

## Installation

```sh
pnpm add vue-vrm vue three @pixiv/three-vrm @pixiv/three-vrm-animation
```

## Quick Start

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { VrmCanvas } from 'vue-vrm';

const modelData = ref<ArrayBuffer | null>(null);

async function onModelFile(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  modelData.value = await file.arrayBuffer();
}
</script>

<template>
  <div>
    <input type="file" accept=".vrm,.glb" @change="onModelFile" />
    <VrmCanvas :model-data="modelData" :show-grid="true" />
  </div>
</template>
```

## Component Example

```vue
<script setup lang="ts">
import { computed, ref } from 'vue';
import { resetVrmCanvasCamera, type VrmCanvasExposed, VrmCanvas } from 'vue-vrm';

const modelData = ref<ArrayBuffer | null>(null);
const animationData = ref<ArrayBuffer | null>(null);
const canvasRef = ref<VrmCanvasExposed | null>(null);

const cameraInteraction = computed(() => ({
  enabled: true,
  rotate: true,
  pan: true,
  zoom: true,
  roll: true,
  damping: true
}));

async function loadFile(event: Event, target: 'model' | 'animation'): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const buffer = await file.arrayBuffer();

  if (target === 'model') {
    modelData.value = buffer;
    return;
  }

  animationData.value = buffer;
}

function resetCamera(): void {
  resetVrmCanvasCamera(canvasRef.value);
}
</script>

<template>
  <fieldset>
    <legend>VRM Demo</legend>
    <input type="file" accept=".vrm,.glb" @change="event => loadFile(event, 'model')" />
    <input type="file" accept=".vrma,.glb" @change="event => loadFile(event, 'animation')" />

    <button type="button" @click="resetCamera">Reset camera</button>

    <VrmCanvas
      ref="canvasRef"
      :model-data="modelData"
      :animation-data="animationData"
      :show-grid="true"
      :camera-interaction="cameraInteraction"
      :directional-light="{ color: '#ffffff', intensity: 1, position: [1, 1, 1] }"
      @model:loaded="() => console.log('model loaded')"
      @animation:start="() => console.log('animation started')"
      @error="error => console.error(error)"
    />
  </fieldset>
</template>
```

## Implementation Examples

For real-world usage patterns, see the following examples:

- [VRoid Hub API Integration](https://github.com/logue/v.logue.dev/blob/master/functions/api/vrm/%5Bavatar_id%5D.ts) — Loading VRM avatars from VRoid Hub using their API
- [Cloudflare Workers Example](https://github.com/logue/v.logue.dev/blob/master/functions/api/assets/%5B%5Bpath%5D%5D.ts) — Serving VRM assets via Cloudflare Workers

## Props

| Prop                | Type                                                                                                                                                                                                                                                                     | Default                                                   | Description                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `modelData`         | `ArrayBuffer \| null`                                                                                                                                                                                                                                                    | `null`                                                    | VRM 1.0 model buffer. Setting a new value unloads the current model and loads the new one.        |
| `animationData`     | `ArrayBuffer \| ArrayBuffer[] \| null`                                                                                                                                                                                                                                   | `null`                                                    | VRMA buffer or multiple VRMA buffers to play on the loaded model.                                 |
| `animationWeights`  | `number[] \| null`                                                                                                                                                                                                                                                       | `null`                                                    | Blend weights for multiple animations. If omitted or invalid, weights are split equally.          |
| `loop`              | `boolean`                                                                                                                                                                                                                                                                | `true`                                                    | Whether animation playback repeats.                                                               |
| `bgTransparent`     | `boolean`                                                                                                                                                                                                                                                                | `false`                                                   | Renders with a transparent background.                                                            |
| `bgImage`           | `string \| null`                                                                                                                                                                                                                                                         | `null`                                                    | Background texture URL. Ignored when `bgTransparent` is `true`.                                   |
| `showGrid`          | `boolean`                                                                                                                                                                                                                                                                | `false`                                                   | Shows a `THREE.GridHelper`.                                                                       |
| `width`             | `number`                                                                                                                                                                                                                                                                 | `480`                                                     | Base canvas width in pixels.                                                                      |
| `maxWidth`          | `number \| null`                                                                                                                                                                                                                                                         | `null`                                                    | Caps the rendered width when the container is wider.                                              |
| `aspectRatio`       | `number`                                                                                                                                                                                                                                                                 | `3 / 4`                                                   | Canvas aspect ratio as `width / height`.                                                          |
| `cameraOptions`     | `{ fov?: number; near?: number; far?: number }`                                                                                                                                                                                                                          | `{ fov: 30, near: 0.1, far: 100 }`                        | Perspective camera settings.                                                                      |
| `cameraDistance`    | `number \| null`                                                                                                                                                                                                                                                         | `null`                                                    | Overrides the automatically computed camera distance.                                             |
| `cameraEuler`       | `[number, number, number]`                                                                                                                                                                                                                                               | `[0, 0, 0]`                                               | Camera rotation as Euler angles in radians.                                                       |
| `cameraOffset`      | `[number, number, number]`                                                                                                                                                                                                                                               | `[0, 0, 0]`                                               | Offset applied to the camera target.                                                              |
| `cameraLookAt`      | `[number, number, number]`                                                                                                                                                                                                                                               | `[0, 0.9, 0]`                                             | Initial point the camera looks at.                                                                |
| `ambientLight`      | `{ color: string; intensity: number }`                                                                                                                                                                                                                                   | `{ color: '#ffffff', intensity: 0.5 }`                    | Ambient light configuration.                                                                      |
| `directionalLight`  | `{ color: string; intensity: number; position: [number, number, number] }`                                                                                                                                                                                               | `{ color: '#ffffff', intensity: 1, position: [1, 1, 1] }` | Directional light configuration.                                                                  |
| `shaderPass`        | `ShaderPass \| null`                                                                                                                                                                                                                                                     | `null`                                                    | Optional postprocessing shader pass added to an `EffectComposer`.                                 |
| `cameraInteraction` | `{ enabled?: boolean; rotate?: boolean; pan?: boolean; zoom?: boolean; roll?: boolean; rotateSpeed?: number; panSpeed?: number; zoomSpeed?: number; damping?: boolean; dampingFactor?: number; minDistance?: number; maxDistance?: number; rollSpeed?: number } \| null` | `null`                                                    | Enables orbit-style camera interaction. Roll uses the `Q` / `E` keys while the canvas is focused. |

## Events

| Event                      | Payload                                                                | Description                                                                           |
| -------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `model:loading`            | none                                                                   | Fired before a model starts loading.                                                  |
| `model:loaded`             | `VRM`                                                                  | Fired after a model has loaded and been added to the scene.                           |
| `model:unloaded`           | none                                                                   | Fired after the previous model has been removed.                                      |
| `model:error`              | `Error`                                                                | Fired when model validation or loading fails.                                         |
| `animation:loading`        | none                                                                   | Fired before animation loading begins.                                                |
| `animation:loaded`         | `VRMAnimation \| VRMAnimation[]`                                       | Fired when animation data has been parsed and attached to the mixer.                  |
| `animation:start`          | none                                                                   | Fired after playback starts.                                                          |
| `animation:pause`          | none                                                                   | Fired when playback is paused through the exposed API.                                |
| `animation:resume`         | none                                                                   | Fired when playback resumes through the exposed API.                                  |
| `animation:stop`           | none                                                                   | Fired when playback is stopped through the exposed API.                               |
| `animation:end`            | none                                                                   | Fired when a non-looping animation reaches the end.                                   |
| `animation:error`          | `Error`                                                                | Fired when animation validation or loading fails.                                     |
| `camera:change`            | `{ position: THREE.Vector3; lookAt: THREE.Vector3; distance: number }` | Fired when the active camera transform changes.                                       |
| `camera:options-change`    | `{ fov?: number; near?: number; far?: number }`                        | Fired when `cameraOptions` changes.                                                   |
| `light:ambient-change`     | `{ color: string; intensity: number }`                                 | Fired when ambient light props change.                                                |
| `light:directional-change` | `{ color: string; intensity: number; position: THREE.Vector3 }`        | Fired when directional light props change.                                            |
| `error`                    | `Error`                                                                | Fired for component-level runtime errors such as background texture loading failures. |

## Exposed Component Methods

Use a template ref to access the component instance.

| Method                               | Return type                       | Description                                           |
| ------------------------------------ | --------------------------------- | ----------------------------------------------------- |
| `playAnimation()`                    | `void`                            | Starts or restarts animation playback.                |
| `pauseAnimation()`                   | `void`                            | Pauses the active animation.                          |
| `resumeAnimation()`                  | `void`                            | Resumes a paused animation.                           |
| `stopAnimation()`                    | `void`                            | Stops playback and rewinds to the beginning.          |
| `resetCamera()`                      | `void`                            | Resets the camera to the initial fitted pose.         |
| `resetCameraPose()`                  | `void`                            | Alias of `resetCamera()`. Included for compatibility. |
| `captureScreenshot(format?: string)` | `Promise<string>`                 | Returns a data URL of the current frame.              |
| `getScene()`                         | `THREE.Scene \| null`             | Returns the internal scene instance.                  |
| `getCamera()`                        | `THREE.PerspectiveCamera \| null` | Returns the internal camera instance.                 |
| `getRenderer()`                      | `THREE.WebGLRenderer \| null`     | Returns the internal renderer instance.               |
| `getMixer()`                         | `THREE.AnimationMixer \| null`    | Returns the current mixer, if any.                    |
| `getVrm()`                           | `VRM \| null`                     | Returns the loaded VRM instance.                      |
| `getCanvas()`                        | `HTMLCanvasElement \| null`       | Returns the internal canvas element.                  |

## Utility Exports

The package also exports low-level helpers for non-component use cases.

```ts
import {
  autoPositionY,
  createMixerWithClips,
  disposeMixer,
  disposeVrm,
  loadVRMAnimation,
  loadVrm,
  meta,
  resetVrmCanvasCamera,
  validateVrm,
  validateVrma
} from 'vue-vrm';
```

| Export                                            | Description                                                                                                    |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `resetVrmCanvasCamera(instance)`                  | Safely resets a `VrmCanvas` template ref, with compatibility for both `resetCamera()` and `resetCameraPose()`. |
| `loadVrm(buffer)`                                 | Validates and loads a VRM 1.0 model from an `ArrayBuffer`.                                                     |
| `autoPositionY(vrm)`                              | Moves the loaded VRM so its feet sit on `y = 0`.                                                               |
| `disposeVrm(vrm)`                                 | Disposes the VRM scene and GPU resources.                                                                      |
| `loadVRMAnimation(buffer)`                        | Validates and loads a VRMA clip from an `ArrayBuffer`.                                                         |
| `createMixerWithClips(vrm, animations, weights?)` | Creates a `THREE.AnimationMixer` with optional blend weights.                                                  |
| `disposeMixer(mixer)`                             | Stops and uncaches the mixer root.                                                                             |
| `validateVrm(buffer)`                             | Throws if the buffer is not a supported VRM 1.0 GLB.                                                           |
| `validateVrma(buffer)`                            | Throws if the buffer is not a VRMA GLB.                                                                        |
| `meta`                                            | Build metadata containing the library version and build date.                                                  |

## Notes

- Only VRM 1.0 is supported. VRM 0.x buffers are rejected during validation.
- `animationWeights` must not sum to more than `1.0`.
- `cameraInteraction.roll` works with the `Q` and `E` keys when the canvas has focus.
- Passing `null` to `modelData` unloads the current model.

## Chunking Recommendation

When bundling with Vite or another Rollup-based tool, splitting `three` and the VRM packages into separate chunks improves cacheability and initial bundle loading behavior.

```ts
import type { UserConfig } from 'vite';

const config: UserConfig = {
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('/node_modules/three/')) {
            return 'three';
          }

          if (
            id.includes('/node_modules/@pixiv/three-vrm') ||
            id.includes('/node_modules/@pixiv/three-vrm-animation')
          ) {
            return 'three-vrm';
          }

          return 'vendor';
        }
      }
    }
  }
};

export default config;
```

## Development

```sh
pnpm install
pnpm lint
pnpm test
pnpm build
```

For the demo app:

```sh
pnpm dev
pnpm preview
```

## License

© 2026 Logue. Licensed under the [MIT License](LICENSE).

## 🎨 Crafted for Developers

This template is built with a focus on **UI/UX excellence** and **modern developer experience**. Maintaining it involves constant testing and updates to ensure everything works seamlessly.

If you appreciate the attention to detail in this project, a small sponsorship would go a long way in supporting my work across the Vue.js and Metaverse ecosystems.

[![GitHub Sponsors](https://img.shields.io/github/sponsors/logue?label=Sponsor&logo=github&color=ea4aaa)](https://github.com/sponsors/logue)
