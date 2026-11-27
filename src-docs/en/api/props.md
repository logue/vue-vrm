---
description: Complete list of props accepted by the vue-vrm component, with types and defaults.
---

# Props

Props are written in kebab-case in templates (`model-data`) and camelCase in JavaScript (`modelData`). The option types (`CameraOptions`, `LightOptions`, `DirectionalLightOptions`, `CameraInteractionOptions`, `Vec3`, `AnimationData`) are exported from `vue-vrm`.

## Model and animation

| Prop                | Type                           | Default     | Description                                                                                                         |
| ------------------- | ------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------- |
| `model-data`        | `ArrayBuffer`                  | `undefined` | VRM 1.0 file. A new value replaces the model; `undefined` unloads it.                                               |
| `animation-data`    | `ArrayBuffer \| ArrayBuffer[]` | `undefined` | VRMA file, or several files to blend. See [Animation](../guide/animation).                                          |
| `animation-weights` | `number[]`                     | `undefined` | Weight of each clip. Equal weights when omitted or when the length does not match. Must not sum to more than `1.0`. |
| `loop`              | `boolean`                      | `true`      | Repeats the animation. When `false`, it plays once and keeps the last frame.                                        |
| `expressions`       | `VrmExpressions`               | `undefined` | Expression weights (0–1) keyed by preset or custom name. See [Expressions](../guide/expressions).                   |

## Canvas

| Prop             | Type         | Default     | Description                                                 |
| ---------------- | ------------ | ----------- | ----------------------------------------------------------- |
| `width`          | `number`     | `480`       | Width in pixels.                                            |
| `max-width`      | `number`     | `undefined` | Upper limit for the width.                                  |
| `aspect-ratio`   | `number`     | `3 / 4`     | Width divided by height.                                    |
| `bg-transparent` | `boolean`    | `false`     | Transparent background.                                     |
| `bg-image`       | `string`     | `undefined` | Background image URL. Ignored when `bg-transparent` is set. |
| `show-grid`      | `boolean`    | `false`     | Shows a grid on the floor.                                  |
| `shader-pass`    | `ShaderPass` | `undefined` | A three.js `ShaderPass` applied after rendering.            |

## Rendering {#rendering}

| Prop     | Type                | Default     | Description                                                                            |
| -------- | ------------------- | ----------- | -------------------------------------------------------------------------------------- |
| `render` | `VrmRenderFunction` | `undefined` | Called every frame instead of the default `renderer.render(scene, camera)`. See below. |

When `render` is set, the component still updates the animation mixer and `vrm.update()` before calling it, with the same `delta`. It replaces the default rendering and the built-in `shader-pass` composer, and it is also used by `captureScreenshot()`. A new function takes effect from the next frame.

The following example applies an `EffectComposer` with a custom glitch pass. The composer is created on `renderer:ready`, resized on `resize`, and disposed on `renderer:dispose` (see [Events](./events#rendering)). The renderer, scene, and camera stay the same while models are swapped, so the composer does not need to be rebuilt on `model:loaded`.

```vue
<script setup lang="ts">
  import type { VrmRenderContext, VrmRenderTargets, VrmResizePayload } from 'vue-vrm';
  import { VrmCanvas } from 'vue-vrm';
  import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
  import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
  import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
  import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

  import { GlitchShader } from './GlitchShader'; // your own ShaderMaterial parameters

  let composer: EffectComposer | undefined;
  let glitchPass: ShaderPass | undefined;

  function onReady({ renderer, scene, camera }: VrmRenderTargets): void {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    glitchPass = new ShaderPass(GlitchShader);
    composer.addPass(glitchPass);
    composer.addPass(new OutputPass());
  }

  function onResize({ width, height, pixelRatio }: VrmResizePayload): void {
    composer?.setPixelRatio(pixelRatio);
    composer?.setSize(width, height);
    glitchPass?.uniforms.uResolution?.value.set(width * pixelRatio, height * pixelRatio);
  }

  function onRender({ delta, elapsed }: VrmRenderContext): void {
    if (!(composer && glitchPass)) return;
    glitchPass.uniforms.uIntensity.value = getBeatIntensity(); // 0–1, e.g. from audio analysis
    glitchPass.uniforms.uTime.value = elapsed;
    composer.render(delta);
  }

  function onDispose(): void {
    composer?.dispose();
    composer = undefined;
    glitchPass = undefined;
  }
</script>

<template>
  <VrmCanvas
    :model-data="modelData"
    :render="onRender"
    @renderer:ready="onReady"
    @resize="onResize"
    @renderer:dispose="onDispose"
  />
</template>
```

## Camera

| Prop                 | Type                       | Default                            | Description                                                                           |
| -------------------- | -------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------- |
| `camera-options`     | `CameraOptions`            | `{ fov: 30, near: 0.1, far: 100 }` | Field of view (degrees) and clipping planes.                                          |
| `camera-distance`    | `number`                   | fitted to the model                | Distance from the target.                                                             |
| `camera-euler`       | `Vec3`                     | `[0, 0, 0]`                        | Rotation around the target, in radians.                                               |
| `camera-offset`      | `Vec3`                     | `[0, 0, 0]`                        | Moves the target that the camera is placed around.                                    |
| `camera-look-at`     | `Vec3`                     | `[0, 0.9, 0]`                      | The point the camera looks at. Ignored while orbit controls are enabled.              |
| `camera-interaction` | `CameraInteractionOptions` | `undefined`                        | Orbit controls. See [Camera & Lighting](../guide/camera-and-lighting#orbit-controls). |

## Lights

| Prop                | Type                      | Default                                                   | Description        |
| ------------------- | ------------------------- | --------------------------------------------------------- | ------------------ |
| `ambient-light`     | `LightOptions`            | `{ color: '#ffffff', intensity: 0.5 }`                    | Ambient light.     |
| `directional-light` | `DirectionalLightOptions` | `{ color: '#ffffff', intensity: 1, position: [1, 1, 1] }` | Directional light. |

## Types

```ts
type Vec3 = [number, number, number];

type AnimationData = ArrayBuffer | ArrayBuffer[];

type CameraOptions = { fov?: number; near?: number; far?: number };

type LightOptions = { color: string; intensity: number };

type DirectionalLightOptions = LightOptions & { position: Vec3 };

type CameraInteractionOptions = {
  enabled: boolean;
  rotate?: boolean;
  pan?: boolean;
  zoom?: boolean;
  roll?: boolean;
  rotateSpeed?: number;
  panSpeed?: number;
  zoomSpeed?: number;
  damping?: boolean;
  dampingFactor?: number;
  minDistance?: number;
  maxDistance?: number;
  rollSpeed?: number;
};

type VrmRenderTargets = { renderer: WebGLRenderer; scene: Scene; camera: PerspectiveCamera };

type VrmRenderContext = VrmRenderTargets & { delta: number; elapsed: number };

type VrmRenderFunction = (context: VrmRenderContext) => void;

type VrmExpressions = Partial<Record<VRMExpressionPresetName, number>> & Record<string, number>;

type VrmExpressionNames = { preset: VRMExpressionPresetName[]; custom: string[] };
```
