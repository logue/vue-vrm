---
description: Everyday usage of vue-vrm — canvas sizing, background and grid, loading state and errors, and screenshots.
---

# Usage

## Canvas size

The canvas keeps a fixed aspect ratio. Its height is derived from the width.

| Prop           | Default | Effect                                                                     |
| -------------- | ------- | -------------------------------------------------------------------------- |
| `width`        | `480`   | Width of the canvas in pixels.                                             |
| `max-width`    | —       | Upper limit for the width. The canvas shrinks to fit a narrower container. |
| `aspect-ratio` | `3 / 4` | Width divided by height. The default is a portrait canvas.                 |

```vue
<template>
  <VrmCanvas :model-data="modelData" :width="640" :max-width="640" :aspect-ratio="16 / 9" />
</template>
```

The drawing buffer follows the actual size of the element, so the image stays sharp when CSS shrinks it. The device pixel ratio is capped at 2.

## Background and grid

| Prop             | Default | Effect                                                            |
| ---------------- | ------- | ----------------------------------------------------------------- |
| `bg-transparent` | `false` | Renders with a transparent background, so the page shows through. |
| `bg-image`       | —       | URL of a background image. Ignored when `bg-transparent` is set.  |
| `show-grid`      | `false` | Shows a grid on the floor.                                        |

```vue
<template>
  <VrmCanvas :model-data="modelData" bg-transparent show-grid />
</template>
```

## Loading state and errors

Use the events to show a loading indicator and report failures:

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import { VrmCanvas } from 'vue-vrm';

  const modelData = ref<ArrayBuffer>();
  const loading = ref(false);
  const message = ref<string>();

  function onError(error: Error): void {
    loading.value = false;
    message.value = error.message;
  }
</script>

<template>
  <p v-if="loading">Loading…</p>
  <p v-if="message" role="alert">{{ message }}</p>
  <VrmCanvas
    :model-data="modelData"
    @model:loading="loading = true"
    @model:loaded="loading = false"
    @model:error="onError"
    @animation:error="onError"
    @error="onError"
  />
</template>
```

`model:error` is emitted when the buffer is not a valid VRM 1.0 file. VRM 0.x models are rejected with a message that says so. `error` covers other failures, such as a background image that cannot be loaded or a browser without WebGL.

## Screenshots

`captureScreenshot()` renders the current frame and returns it as a data URL:

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import { VrmCanvas, type VrmCanvasExposed } from 'vue-vrm';

  const canvas = ref<VrmCanvasExposed>();

  function download(): void {
    const link = document.createElement('a');
    link.href = canvas.value?.captureScreenshot('image/png') ?? '';
    link.download = 'avatar.png';
    link.click();
  }
</script>

<template>
  <VrmCanvas ref="canvas" :model-data="modelData" />
  <button type="button" @click="download">Save image</button>
</template>
```

:::tip
Combine `captureScreenshot()` with `bg-transparent` to get an image with a transparent background.
:::

## Postprocessing

Pass a `ShaderPass` from three.js to `shader-pass`. It is added to an `EffectComposer` after the scene is rendered.

```vue
<script setup lang="ts">
  import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
  import { SepiaShader } from 'three/addons/shaders/SepiaShader.js';
  import { VrmCanvas } from 'vue-vrm';

  const sepia = new ShaderPass(SepiaShader);
</script>

<template>
  <VrmCanvas :model-data="modelData" :shader-pass="sepia" />
</template>
```
